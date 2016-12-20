/// <reference path='../_all.ts' />

module scrumdo {

    interface TimelineIncrementScope extends ng.IScope{
        increment: Iteration;
        project: Project;
    }

    export class TimelineIncrementController {
        public static $inject:Array<string> = [
            "$scope",
            "organizationSlug",
            "projectSlug",
            "iterationWindowService",
            "storyManager",
            "storyEditor"
        ];

        private features: Array<Story>;
        private cardSize: string;
        private stats: number;
        private loading: boolean;

        constructor(public $scope: TimelineIncrementScope,
                    public organizationSlug: string,
                    public projectSlug: string,
                    public iterationWindowService: IterationWindowService,
                    public storyManager: StoryManager,
                    public storyEditor: StoryEditor){

            var _calculateStats = _.debounce(this.calculateStats, 500); 
            this.$scope.$on("storyModified", _calculateStats);
            this.$scope.$on("onStoryAdded", _calculateStats);
            this.$scope.$on("timelineIncrementChanges", this.setSeperatorHeight);

            this.cardSize = 'feature';
            this.loading = true;
            this.setSeperatorHeight();
            this.loadFeatures();
        }

        public loadFeatures(){
            this.storyManager.loadIteration(this.projectSlug, this.$scope.increment.id, "").then((features)=>{
                this.features = features;
                this.calculateStats();
                this.loading = false;
            });
        }

        public editIncrement(){
            this.iterationWindowService.editIteration(this.organizationSlug, this.projectSlug, this.$scope.increment, "increment");
        }

        public addCard(){
            this.storyEditor.createStory(this.$scope.project, {iteration_id: this.$scope.increment.id});
        }

        public incrementCards = (feature) => {
            return feature.feature_stats.teams == 0 && feature.cell.type != 3;
        }

        public committedCards = (feature) => {
            return feature.feature_stats.teams > 0 && feature.cell.type != 3;
        }

        public completedCards = (feature) => {
            return feature.cell.type == 3;
        }

        private setSeperatorHeight = () => {
            setTimeout(() => {
                if($('.scrumdo-timeline-wrapper').length == 0) return;
                var elm = $(".increment-wrapper > li", ".scrumdo-timeline-wrapper");
                elm.css({ height: "" });
                var height = document.getElementById("scrumdo-timeline-wrapper").scrollHeight;
                elm.css({ height: (height-10) + "px" });
            }, 200);
        }

        private calculateStats = () => {
            this.stats = getStoryTotals(this.features);
        }

    }
}