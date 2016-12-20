/// <reference path='../_all.ts' />

module scrumdo {
    export class TrackTimeWindowController {

        public static $inject:Array<string> = [
            "organizationSlug",
            "story",
            "project",
            "iteration",
            "projectManager",
            "storyManager",
            "iterationManager",
            "timeManager",
            "projects",
            "ngToast",
            "taskManager",
            "$sce",
            "$scope",
            "$filter"];

        public currentProject:Project;
        public currentIteration:Iteration;
        public currentStory:number=-1;
        public minutes:number=0;

        public tasks:Array<Task> = [];
        public stories:Array<Story> = [];
        public iterations:Array<Iteration> = [];
        public currentTask = null;

        public notes:string = "";
        public noteField:boolean = false;
        public date;
        public loading:boolean = false;
        public trackingMode:string = "scrumdo";
        public harvest_url:string;

        constructor(public organizationSlug,
                    public story,
                    public project,
                    public iteration,
                    public projectManager,
                    public storyManager,
                    public iterationManager,
                    public timeManager,
                    public projects,
                    public toast,
                    public taskManager,
                    public $sce,
                    public scope,
                    public filter) {

            this.scope.currentProject = this.project != null ? this.project : void 0;
            this.currentIteration = this.iteration;
            this.currentStory = this.story != null ? this.story.id : void 0;
            this.minutes = 0;
            this.tasks = [];
            this.notes = "";
            this.noteField = false;
            this.date = moment(new Date()).format("YYYY-MM-DD");
            this.loading = false;
            this.trackingMode = this.project != null ? this.project.time_tracking_mode : "scrumdo";
            this.loadProjects();
            if(this.project != null){
                this.setHarvestUrl();
            }
            $(".time-entry-input").focus();
            this.scope.$watch("currentProject", this.projectChanged, true);
        }
        
        public attachHarvestEventListner():void{
            window.addEventListener("message", function (event) {
                if (event.origin != "https://platform.harvestapp.com") {
                    return;
                }

                if (event.data.type == "frame:resize") {
                    if($("#harvest_tracker").length > 0){
                        $("#harvest_tracker").css({height:event.data.value+'px'});
                    }
                }
            });
        }
        
        public setHarvestUrl():string{
            var harvest_url:string;
            var host = window.location.protocol+"//"+window.location.hostname
            harvest_url = "https://platform.harvestapp.com/platform/timer?app_name=ScrumDo&service=app.scrumdo.com&";
            harvest_url += "closable=false&";
            harvest_url += "base_url="+encodeURIComponent(host+'/projects/story_permalink/'+this.story.id)+"&";
            harvest_url += "external_group_id="+this.project.id+"&";
            harvest_url += "external_group_name="+encodeURIComponent(this.project.name)+"&";
            harvest_url += "external_item_id="+this.story.id+"&";
            harvest_url += "external_item_name="+encodeURIComponent('['+this.project.name+'] [Card ' + this.project.prefix+ '-' +this.story.number+'] '+this.formatStorySummary(this.story.summary));
            this.harvest_url = this.$sce.trustAsResourceUrl(harvest_url);
            this.attachHarvestEventListner();
            return this.harvest_url;
        }
        
        public formatStorySummary = (content):string => {
            var tcontent:string = "";
            tcontent = content.replace(/(<([^>]+)>)/ig,"");
            tcontent = tcontent.replace(/&nbsp;/ig,"");
            tcontent = tcontent.replace(/[\n\r]+/g, '');
            return tcontent;
        }

        public formatTask = (task:Task):string => {
            return task.summary.replace(/<[^>]+>/gm, "");
        }

        public formatStory = (story:Story):string => {
            var prefix = this.currentProject ? this.currentProject.prefix : this.project.prefix;
            return prefix + "-" + story.number + " " + this.filter('decodeHtmlEntities')(story.summary.replace(/<[^>]+>/gm, ""));
        }

        public projectChanged = () => { 
            if(this.currentProject == null){
                this.currentProject = this.scope.currentProject;
                return;
            }
            this.currentProject = this.scope.currentProject;
            this.stories = [];
            this.tasks = [];
            this.iterations = [];
            this.currentTask = null;
            this.currentIteration = null;
            this.currentStory = null;
            this.loadIterations();
        }

        public loadIterations = () => {
            if (this.projects.length === 0) {
                return;
            }

            if (this.scope.currentProject == null) {
                this.scope.currentProject = this.projects[0];
            }
            this.loading = true;
            return this.iterationManager.loadIterations(this.organizationSlug, this.scope.currentProject.slug).then((result) => {
                this.iterations = result;
                this.buildIterationTree();
                this.loading = false;
                this.loadStories();
            });
        }

        private buildIterationTree(){
            let hasIncrement = _.find(this.iterations, (i: Iteration) => i.increment != null);
            _.forEach(this.iterations, (itr:Iteration) => {
                if(itr.increment == null && hasIncrement != null){
                    itr.increment = {"id": -1, "name": "Others"};
                }
            });
        }

        public storyChanged = () => {
            this.currentTask = null;
            this.loading = true;
            this.loadTasks();
        }

        public loadTasks = () => {
            if (this.currentStory == null) {
                this.tasks = [];
                return;
            }
            return this.taskManager.loadTasks(this.scope.currentProject.slug, this.currentStory).then((tasks) => {
                this.tasks = tasks;
                return this.loading = false;
            });
        }

        public iterationChanged = () => {
            this.stories = [];
            this.tasks = [];
            this.currentTask = null;
            this.currentStory = null;
            this.loadStories();
        }

        public loadStories = () => {
            if (this.currentIteration == null) {
                this.stories = [];
                return;
            }
            this.loading = true;
            
            return this.storyManager.loadIterations(this.scope.currentProject.slug, [this.currentIteration.id], "", false).then((result) => {
                this.loading = false;
                this.stories = result;
                this.loadTasks();
            });
        }

        public loadProjects = () => {
            if (this.projects != null) {
                this.loadIterations();
                return;
            }

            this.loading = true;
            return this.projectManager.loadProjectsForOrganization(this.organizationSlug).then((result) => {
                this.projects = result;
                this.loading = false;
                this.loadIterations();
            });
        }

        public enterTime = ():void => {
            if (this.minutes === 0) {
                return;
            }
            this.timeManager.create(this.scope.currentProject.slug,
                                    this.currentIteration != null ? this.currentIteration.id : void 0,
                                    this.currentStory,
                                    this.currentTask,
                                    this.date,
                                    this.minutes,
                                    this.notes).then(() => {
                this.toast.create("Time Logged");
                this.scope.$root.$broadcast("timeEntryCreated");
            });

            $(".time-entry-input").focus();
            this.minutes = 0;
            this.notes = "";
        }
    }
}
