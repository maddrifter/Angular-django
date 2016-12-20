/// <reference path='../_all.ts' />

module scrumdo{

    interface FeaturePlanScope extends ng.IScope{
        increment: ProgramIncrement;
        project: Project;
    }

    export class IncrementFeaturePlansController{
        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "projectSlug",
            "storyManager",
            "releaseStatManager"
        ]

        private features: Array<Story>;
        private featuresStoriesIterations: {};
        public scheduleVisibility: {};

        constructor(public $scope:FeaturePlanScope,
                    public organizationSlug:string,
                    public projectSlug:string,
                    private storyManager: StoryManager,
                    private releaseStatManager: ReleaseStatManager){
                    this.$scope.$root['releaseStats'] = {};
                    this.scheduleVisibility = [];
                    this.$scope.$on("scheduleVisibilityChanged", this.onVisibilityChnaged);
                    this.features = [];
                    if(this.$scope.increment.iteration_id != null){
                        this.loadStats();
                        this.loadReleaseChildStats();
                    }
        }

        private onVisibilityChnaged = (event, data) => {
            this.scheduleVisibility[data.id] = data.visible;
        }

        public loadFeatures(){
            this.storyManager.loadIteration(this.projectSlug, this.$scope.increment.iteration_id, "").then((features: Array<Story>)=>{
                this.features = features;
            });
        }

        public loadStats(){
            this.releaseStatManager.loadIterationStats(this.organizationSlug, this.projectSlug, this.$scope.increment.iteration_id).then((stats) => {
                for (var i = 0, len = stats.length; i < len; i++) {
                    var stat = stats[i];
                    this.$scope.$root["releaseStats"][stat.release_id] = stat;
                }
            });
        }

        public loadReleaseChildStats(){
            this.releaseStatManager.loadReleaseChildStats(this.organizationSlug, this.projectSlug, this.$scope.increment.iteration_id).then((stats) => {
                this.featuresStoriesIterations = stats;
                this.loadFeatures();
            });
        }

        public isVisibleForSchedule = (schedule: ProgramIncrementSchedule) => {
            return (story:Story) => {
                return story.feature_stats.story_count > 0;
            }
        }

        public featureBySchedule = (schedule: ProgramIncrementSchedule) => {
            return (story:Story) => {
                return story.feature_stats.story_count > 0 && this.checkFeatureSchedule(schedule, story);
            }
        }

        public checkFeatureSchedule(schedule: ProgramIncrementSchedule, feature: Story){
            var ids: Array<number> = _.pluck(schedule.iterations, 'iteration_id');
            return _.find(ids, (id) => {
                return this.featuresStoriesIterations[feature.id] != null && this.featuresStoriesIterations[feature.id].indexOf(id) > -1;
            });
        }

        public isCurrentSchedule(schedule: ProgramIncrementSchedule){
            return moment(schedule.start_date) <= moment() && moment(schedule.end_date) >= moment();
        }

        public featureOrderBy = (story: Story) => {
            return story.rank;
        }
    }
}