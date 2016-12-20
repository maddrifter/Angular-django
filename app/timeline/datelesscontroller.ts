/// <reference path='../_all.ts' />

module scrumdo {

    interface TimelineIncrementScope extends ng.IScope{
        increment: Iteration;
        project: Project;
        timeScale: any;
    }

    interface monthsObj {
        displayName: string;
        number: number;
        year: number; 
    }

    interface featureDates {
        story_id: number;
        uncommitted_date: string;
        committed_date: string;
        done_date: string;
    }

    export class DatelessIncrementController {
        public static $inject:Array<string> = [
            "$scope",
            "organizationSlug",
            "projectSlug",
            "iterationWindowService",
            "storyManager",
            "storyEditor",
            "$resource",
            "$localStorage",
        ];

        private features: Array<Story>;
        private cardSize: string;
        private stats: number;
        private loading: boolean;
        public startDate: string;
        public endDate: string;
        public months: Array<monthsObj>;
        private LoadFeatureDates: ng.resource.IResourceClass<any>;
        public FeatureDates: Array<featureDates>;
        public showByMonth: boolean = true;

        constructor(public $scope: TimelineIncrementScope,
                    public organizationSlug: string,
                    public projectSlug: string,
                    public iterationWindowService: IterationWindowService,
                    public storyManager: StoryManager,
                    public storyEditor: StoryEditor,
                    private resource: ng.resource.IResourceService,
                    private $localStorage){

            var _calculateStats = _.debounce(this.calculateStats, 500);
            var _reloadFeatureDates = _.debounce(this.refreshFeatureDates, 500); 
            this.$scope.$on("storyModified", _calculateStats);
            this.$scope.$on("onStoryAdded", _calculateStats);
            this.$scope.$on("storyModified", _reloadFeatureDates);
            this.$scope.$on("onStoryAdded", _reloadFeatureDates);
            this.$scope.$on("timelineIncrementChanges", this.setSeperatorHeight);
            
            this.LoadFeatureDates = this.resource(API_PREFIX + "organizations/:organizationSlug/timeline/project/:projectSlug/:iteration_id");

            this.cardSize = 'feature';
            this.months = [];
            this.loading = true;
            this.setSeperatorHeight();
            this.loadFeatures();
            this.loadFeatureDates();
        }

        public loadFeatureDates = (reload = false) => {
            this.getFeaturesDates().then((data) => {
                                                this.FeatureDates = data;
                                                if(!reload){
                                                    this.setDateLimits();
                                                    this.loading = false;
                                                }
                                            });
        }

        private getFeaturesDates(): ng.IPromise<any> {
            return this.LoadFeatureDates.query({ organizationSlug: this.organizationSlug , 
                                            projectSlug: this.projectSlug, 
                                            iteration_id: this.$scope.increment.id}).$promise;
        }

        private refreshFeatureDates = () => {
            this.loadFeatureDates(true);
        }

        public loadFeatures(){
            this.storyManager.loadIteration(this.projectSlug, this.$scope.increment.id, "").then((features: Array<Story>)=>{
                this.features = features;
                this.calculateStats();
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

        public cardsByMonth(month: monthsObj){
            return (story: Story) => {
                return this.matchStoryByMonth(story, month)
                    && story['feature_stats'].teams == 0 && story['cell'].type != 3;
            }
        }

        public committedCardsByMonth(month: monthsObj){
            return (story: Story) => {
                return this.matchStoryByMonth(story, month, "committed_date") 
                    && story['feature_stats'].teams > 0 && story['cell'].type != 3;
            }
        }

        public completedCardsByMonth(month: monthsObj){
            return (story: Story) => {
                return this.matchStoryByMonth(story, month, "done_date")
                    && story['cell'].type == 3;
            }
        }

        public isCurrentMonth(month: monthsObj){
            return month.number == moment().get("month");
        }

        public orderMonths = (month: monthsObj) => {
            return month.number+month.year;
        }

        public changeViewType(){
            this.setDateLimits();
        }

        private matchStoryByMonth(story: Story, month: monthsObj, card_type: string = "uncommitted_date"){
            var feature = _.find(this.FeatureDates, (d: featureDates) => d.story_id == story.id);
            if(feature == null){
                return false;
            }else{
                if(this.showByMonth){
                    return moment(feature[card_type]).get("month") == month.number 
                        && moment(story["modified"]).get("year") == month.year;
                }else{
                    if(feature[card_type] == null) return;
                    var q = this.getQuarterByMonth(moment(feature[card_type]));
                    return q == month.number 
                        && moment(story["modified"]).get("year") == month.year;
                }
            }
        }

        private setSeperatorHeight = () => {
            setTimeout(() => {
                if($('.scrumdo-timeline-wrapper').length == 0) return;
                var elm = $(".increment-wrapper > li", ".scrumdo-timeline-wrapper"),
                    elm1 = $(".monthly-feature");
                elm.css({ height: "" });
                elm1.css({ height: "" });
                var height = document.getElementById("scrumdo-timeline-wrapper").scrollHeight;
                elm.css({ height: (height-10) + "px" });
                elm1.css({ height: (height-125) + "px" });
                this.setTimelineWidth();
            }, 200);
        }

        private setTimelineWidth(){
            $(".monthly-timeline", ".scrumdo-timeline-wrapper").css({width: ""});
            var width = document.getElementById("scrumdo-timeline-wrapper").scrollWidth;
            $(".monthly-timeline", ".scrumdo-timeline-wrapper").css({ width:  width});
            this.updateTimeScale();
        }

        private calculateStats = () => {
            this.stats = getStoryTotals(this.features);
        }

        private updateTimeScale(){
            this.$scope.timeScale.initData();
        }

        private setDateLimits(){
            this.months = [];
            var featureDates = this.getMinMaxDates();

            if(featureDates.length == 0){
                this.pushMonthData(moment());
                this.setSeperatorHeight();
                return;
            }

            this.startDate = _.min(featureDates).format("MM/DD/YYYY");
            this.endDate = _.max(featureDates).format("MM/DD/YYYY");

            for(var date = moment(this.startDate); date.diff(this.endDate) <= 0; date.add(1, 'months')){
                this.pushMonthData(date);
            }

            if(!_.find(this.months, (m: monthsObj) => m.number == moment().get("month"))){
                this.pushMonthData(moment());
            }
            this.setSeperatorHeight();
        }

        private pushMonthData(date){
            if(this.showByMonth){
                var obj: monthsObj = { displayName: moment(date).format("MMM"), number: moment(date).get("month"), year: moment(date).get("year") }
                this.months.push(obj);
            }else{
                var qarter = this.getQuarterByMonth(date);
                var obj: monthsObj = { displayName: moment(date).format("MMM"), number: qarter, year: moment(date).get("year") }
                if(!_.find(this.months, (m: monthsObj) => m.number == qarter)){
                    this.months.push(obj);
                }
            }
        }

        private getQuarterByMonth(date){
            return Math.floor( moment(date).get("month") / 3 ) + 1 ;
        }

        private getMinMaxDates(){
            var uncommitted_dates = [],
                committed_dates = [],
                done_dates = [];
            _.forEach(this.FeatureDates, (d: featureDates) => {
                if(d.uncommitted_date != null){
                    uncommitted_dates.push(moment(d.uncommitted_date));
                }
                if(d.committed_date != null){
                    committed_dates.push(moment(d.committed_date));
                }
                if(d.done_date != null){
                    done_dates.push(moment(d.done_date));
                }
            });
            return _.union(uncommitted_dates,committed_dates, done_dates);
        }

    }
}