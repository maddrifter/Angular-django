/// <reference path='../../_all.ts' />

module scrumdo {

    interface AddStoryScope extends ng.IScope {
        ctrl: AddStoryController;
        tags: Array<any>;
        cardTypes:any;
        iterations:Array<Iteration>;
        story:Story;
        project:Project;
        pointScale:any;
        
        iteration:any;
    }

    export class AddStoryController {
        public st = [];

        public initialized = false;
        public story:Story;
        public previousStory:Story;
        public working: boolean;
        public sdMentioId:string;
        public sdMentioCount:number = 0;
        public project:Project;
        public currentIteration:Iteration;
        public currentEpic:Epic;
        public releaseMode:boolean = false;
        public currentPoints:any;
        public timeCriticality:any;
        public riskReduction:any;
        private workItemName: string;


        private summaryEditor;
        public summaryEditorConfig = {
            setup: null,
            menu: {},
            paste_data_images: true,
            plugins: "codesample tabfocus paste",
            statusbar: false,
            toolbar: "styleselect | bold italic underline strikethrough | bullist numlist | paste removeformat codesample",
            inline: true,
            fixed_toolbar_container: "#toolbar-sdmentio-cp-10000"
        }
        public editorConfig = {
            setup: null,
            menu: {},
            paste_data_images: true,
            plugins: "codesample tabfocus paste",
            statusbar: false,
            toolbar: "styleselect | bold italic underline strikethrough | bullist numlist | paste removeformat codesample",
            inline: true,
            fixed_toolbar_container: "#toolbar-sdmentio-cp-10001"
        };

        public customConfig = {
            setup: null,
            menu: {},
            paste_data_images: true,
            plugins: "codesample tabfocus paste",
            statusbar: false,
            toolbar: "styleselect | bold italic underline strikethrough | bullist numlist | paste removeformat codesample",
            inline: true,
            fixed_toolbar_container: "#toolbar-sdmentio-cp-10002"
        };

        public customConfigSecond = {
            setup: null,
            menu: {},
            paste_data_images: true,
            plugins: "codesample tabfocus paste",
            statusbar: false,
            toolbar: "styleselect | bold italic underline strikethrough | bullist numlist | paste removeformat codesample",
            inline: true,
            fixed_toolbar_container: "#toolbar-sdmentio-cp-10003"
        };

        public customConfigThird = {
            setup: null,
            menu: {},
            paste_data_images: true,
            plugins: "codesample tabfocus paste",
            statusbar: false,
            toolbar: "styleselect | bold italic underline strikethrough | bullist numlist | paste removeformat codesample",
            inline: true,
            fixed_toolbar_container: "#toolbar-sdmentio-cp-10004"
        };

        public static $inject = ["$scope",
                                 "storyManager",
                                 "ngToast",
                                 "scrumdoTerms",
                                 "$timeout",
                                 "$compile",
                                 "betaOptions",
                                 "$state"];


        constructor(public scope:AddStoryScope,
                    public storyManager,
                    public ngToast,
                    public scrumdoTerms:ScrumDoTerms,
                    public timeout:ng.ITimeoutService,
                    public compile,
                    betaOptions:BetaOptions,
                    private $state:ng.ui.IStateService) {

            this.scope.ctrl = this;
            this.scope.tags = [];
            this.scope.cardTypes = this.cardTypes;
            this.story = this.scope.story = this.createStoryStub();
            this.onIterationChanged();
            this.sdMentioId = "sdmentio-cp-1000";

            this.currentIteration = _.findWhere(this.scope.iterations, {
                id: this.story.iteration_id
            });

            this.scope.$watch("iteration", this.onIterationChanged);
            this.scope.$watch("project", this.onProjectChanged);

            this.summaryEditorConfig.setup = this.editorSetup;
            this.editorConfig.setup = this.editorSetupCp;
            this.customConfig.setup = this.customConfigSecond.setup = this.customConfigThird.setup= this.editorSetupCustom;

            if(["app.iteration.teamplanningteam"].indexOf(this.$state.current.name) > -1){
                this.workItemName = this.scope.$root['safeTerms'].children.work_item_name;
            }else{
                this.workItemName = this.scope.$root['safeTerms'].current.work_item_name;
            }
        }

        protected editorSetup = (editor) => {
            this.summaryEditor = editor;
            editor.on("init", () => {
                this.appendMentionHtml(this.sdMentioId + this.sdMentioCount);
                this.sdMentioCount++;
            });
        }
    
        protected editorSetupCp = (editor) => {
            editor.on("init", () => {
                this.appendMentionHtml(this.sdMentioId + this.sdMentioCount);
                this.sdMentioCount++;
            });
        }

        protected editorSetupCustom = (editor) => {
            editor.on("init", () => {
                this.appendMentionHtml(this.sdMentioId + this.sdMentioCount);
                this.sdMentioCount++;
            });
        }
    
        public appendMentionHtml = (id) => {
            var el = this.compile( "<sd-mentio editor=\"'"+id+"'\" trigger=\"'@'\" project=\"project\"></sd-mentio>" )( this.scope );
            $('body').append(el);
        }

        public onProjectChanged = () => {

            if (this.scope.project == null) {
                return;
            }
            this.project = this.scope.project;
            this.scope.pointScale = this.scope.project.point_scale.map((p) => transformPoints(p));
            this.currentPoints = _.find(this.scope.pointScale, (p) => p[1] === this.story.points);
            this.timeCriticality = _.find(this.scope.pointScale, (p) => p[1] == this.story.time_criticality_label);
            this.riskReduction = _.find(this.scope.pointScale, (p) => p[1] == this.story.risk_reduction_label);
            if (this.currentPoints == null) {
                if(this.story.points_value == null){
                    this.currentPoints = this.scope.pointScale[0];
                }else{
                    //show story current values if point scale has been changed to different one 
                    this.currentPoints = [this.story.points_value, this.story.points, this.story.points+" Points"];
                }
            }
            if (this.timeCriticality == null) {
                if(this.story.time_criticality == null){
                    this.timeCriticality = this.scope.pointScale[0];
                }else{
                    //show story current values if point scale has been changed to different one
                    this.timeCriticality = [this.story.time_criticality, this.story.time_criticality_label, this.story.time_criticality_label+" Points"];
                }
            }
            if (this.riskReduction == null) {
                if(this.story.risk_reduction == null){
                    this.riskReduction = this.scope.pointScale[0];
                }else{
                    //show story current values if point scale has been changed to different one
                    this.riskReduction = [this.story.risk_reduction, this.story.risk_reduction_label, this.story.risk_reduction_label+" Points"];
                }
            }
        }

        public onIterationChanged = () => {
            if ((this.scope.iteration != null) && (this.scope.iteration.id != null)) {
                this.story.iteration_id = this.scope.iteration.id;
                return this.currentIteration = _.findWhere(this.scope.iterations, {
                    id: this.story.iteration_id
                });
            }
        }

        public createStoryStub = () => {
            return this.storyManager.createStoryStub();
        }

        public addCard = () => {
            var editorScope;
            if (this.story.summary.length > 0) {
                this.createStory();
                this.previousStory = this.story;


                this.scope.story = this.story = this.createStoryStub();
                this.summaryEditor.focus();

            }
        }

        public createStory = () => {
            this.story.tags = this.story.tags_list.join(",");
            this.story.iteration_id = this.currentIteration.id;
            this.story.epic = this.currentEpic;
            this.story.points = this.currentPoints[0];
            this.story.time_criticality_label = this.timeCriticality[0];
            this.story.risk_reduction_label = this.riskReduction[0];
            this.story.business_value = this.story.business_value_label;
            if (isNaN(this.story.estimated_minutes)) {
                this.story.estimated_minutes = 0;
            }
            this.working = true;
            return this.storyManager.create(this.scope.project.slug, this.story).then(this.onStoryAdded, this.onStoryFail);
        }

        public onStoryFail = () => {
            return this.timeout((() => {
                this.scope.story = this.story = this.previousStory;
                return this.working = false;
            }), 2000);
        }

        public onStoryAdded = (story) => {
            this.ngToast.create({
                content: `${this.workItemName} `+ this.project.prefix + '-' + story.number + " created. <i>" + story.summary + "</i>",
                timeout: 8000,
                dismissButton: true
            });
            this.working = false;

            return this.scope.$root.$broadcast("reset_attachment");
        }


        public cardTypes = () => {
            var i;
            if (this.st.length > 0) {
                return this.st;
            }
            i = 1;
            this.scope.project.statuses.forEach((s) => {
                if (s.length > 0) {
                    this.st.push({
                        id: i,
                        name: s
                    });
                }
                return i++;
            });
            return this.st;
        }
    }
}