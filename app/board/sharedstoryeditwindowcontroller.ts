/// <reference path='../_all.ts' />

module scrumdo {
    export class SharedStoryEditWindowController {
        public static $inject: Array<string> = [
            "$http",
            "organizationSlug",
            "$scope",
            "story",
            "project",
            "confirmService",
            "$q",
            "editorManager",
            "taskMode",
            "shareKey",
            "API_PREFIX",
            "user",
            "$sce",
            "storyManager",
        ];

        public newComment: string;
        public sharedMode: boolean;
        public currentPoints;
        public blockerEntries: Array<StoryBlocker> = [];
        public attachments: Array<any>;
        public comments: Array<any>;
        public news;
        public edited: boolean;
        public currentIteration;
        public currentEpic;
        public agingInfo: Array<any> = [];


        constructor(
            public http: ng.IHttpService,
            public organizationSlug: string,
            public scope,
            public story,
            public project,
            public confirmService: ConfirmationService,
            public q: ng.IQService,
            public editorManager,
            public taskModeVar,
            public shareKey: string,
            public API_PREFIX: string,
            public user,
            public $sce: ng.ISCEService,
            public storyManager: SharedStoryManager) {

            trace("StoryEditorController");
            this.scope.busyMode = "Loading Card...";
            this.scope.taskMode = taskModeVar;
            this.scope.story = story;
            this.scope.ctrl = this;
            this.scope.user = user;
            this.newComment = "";
            this.setCurrentIteration();
            this.sharedMode = true;
            this.scope.project = this.project;

            this.scope.pointScale = (function() {
                var i, len, ref, results;
                ref = this.scope.project.point_scale;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var p = ref[i];
                    results.push(transformPoints(p));
                }
                return results;
            }).call(this);

            this.currentPoints = _.find(this.scope.pointScale, (p) => p[1] == this.story.points);
            if (this.currentPoints == null) {
                this.currentPoints = this.scope.pointScale[0];
            }

            this.scope.to_trusted = (html_code) => {
                return $sce.trustAsHtml(html_code);
            }

            this.attachments = [];
            this.comments = [];
            var loads = [];
            
            this.storyManager.loadStory(story.id).then((result) => {
                this.news = result.data.news;
                this.comments = result.data.comments;
                this.attachments = result.data.attachments;
                this.blockerEntries = result.data.blockers;
                this.edited = false;
                this.scope.busyMode = false;
                this.setCurrentEpic();
                this.sortAgingGroup(_.groupBy(result.data.aging.sort(this.sortAgingDetails), (d) => d[2].slug));
            });
        }

        setIterations(iterations) {
            this.scope.iterations = iterations;
            this.setCurrentIteration();
        }

        setCurrentIteration() {
            if (this.scope.iterations != null) {
                if (this.story.iteration_id === -1) {
                    this.story.iteration_id = (_.findWhere(this.scope.iterations, { iteration_type: 0 }))['id'];
                }
                this.currentIteration = _.findWhere(this.scope.iterations, { id: this.story.iteration_id });
            }
        }

        setCurrentEpic() {
            if (this.story.epic != null) {
                this.currentEpic = _.findWhere(this.scope.epics, { id: this.story.epic.id });
            }
        }

        setEpics(epics) {
            this.scope.epics = epics;
            this.setCurrentEpic();
        }

        cardMode() {
            this.scope.taskMode = false;
        }

        taskMode() {
            this.scope.taskMode = true;
        }
        
        sortAgingDetails = (a, b) => {
            if(a[0].x > b[0].x){
                return 1;
            }else if(a[0].x < b[0].x){ 
                return -1
            }else{
                if(a[0].y < b[0].y) return -1;
                if(a[0].y > b[0].y) return 1;
                return 0;
            }
        }
        
        sortAgingGroup = (data) => {
            var order:number = 0;
            for(var i in data){
                var d = data[i];
                if(i == this.story.project_slug){
                    this.agingInfo[0] = d;
                }else{
                    order++;
                    this.agingInfo[order] = d;
                }
            }
        }
    }
}