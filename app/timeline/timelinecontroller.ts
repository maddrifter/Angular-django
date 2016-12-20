/// <reference path='../_all.ts' />

module scrumdo {
    export class TimelineController {
        public static $inject:Array<string> = [
            "$scope",
            "organizationSlug",
            "projectSlug",
            "projectData",
            "programIncrementManager",
            "iterationManager",
            "$state",
            "$localStorage",
            "scrumdoTerms",
            "iterationWindowService",
            "mixpanel",
            "releaseStatManager"
        ];

        private showInTimeline = {};
        public startDate: string;
        public endDate: string;
        public visibleIncrements: Array<Iteration>;
        public datelessMode: boolean;
        private selectedIds: Array<number>;
        private iterationTree:{};
        private haveParentIncrement:boolean;

        constructor(public $scope, 
                    private organizationSlug:string,
                    private projectSlug:string,
                    public projectData:ProjectDatastore,
                    private programIncrementManager:ProgramIncrementManager,
                    private iterationManager: IterationManager,
                    private $state:ng.ui.IStateService,
                    private $localStorage,
                    private scrumdoTerms: ScrumDoTerms,
                    private iterationWindowService: IterationWindowService,
                    private mixpanel,
                    private releaseStatManager: ReleaseStatManager) {
            
            if(this.$localStorage.timelineSidebarOpen == null){
                this.$localStorage.timelineSidebarOpen = true;
            }
            this.$scope.$watch("ctrl.projectData.iterations", this.onIncrementChanged, true);
            this.$scope.$root.$on("DATA:PATCH:RELEASESTAT", this.onReleaseStatsPatch);
            this.datelessMode = true;
            this.selectedIds = [];

            var _refreshIncrements = _.debounce(this.refreshIterations, 500); 
            // TODO :: need to find another way 
            //this.$scope.$on("storyModified", _refreshIncrements);
            //this.$scope.$on("onStoryAdded", _refreshIncrements);

            projectData.clearCurrentIteration();
            this.loadStats();
            this.$scope.$root.releaseStats = {};
            this.initIncrements();
            this.haveParentIncrement = false;
            
        }

        private onIncrementChanged = () =>{
            this.initIncrements();
            this.buildIterationTree();
        }

        private initIncrements(){
            if(_.filter(this.projectData.iterations, (i) => i.iteration_type == 1).length == 0) {
                this.visibleIncrements = null;
                return;
            }
            _.forEach(this.projectData.iterations, (increment) => {
                if(((increment.start_date == null || increment.end_date == null) 
                    && increment["showInTimeline"] !== true && this.selectedIds.indexOf(increment.id) == -1) 
                    || increment["showInTimeline"] === false){
                    increment["showInTimeline"] = false;
                }else{
                    increment["showInTimeline"] = true;
                }
             });
             this.refreshData();
             this.checkIfNoneActive();
        }

        private onReleaseStatsPatch = (event, message) => {
            var releaseId = message.payload.id;
            if(this.$scope.$root == null) return;
            if (!(releaseId in this.$scope.$root.releaseStats)) {
                return;
            }
            var stats = this.$scope.$root.releaseStats[releaseId];
            var props = message.payload.properties;
            _.extend(stats, props);
        }

        private loadStats(){
            this.releaseStatManager.loadProjectStats(this.organizationSlug, this.projectSlug).then((stats) => {
                for (var i = 0, len = stats.length; i < len; i++) {
                    var stat = stats[i];
                    this.$scope.$root.releaseStats[stat.release_id] = stat;
                }
            });
        }

        public toggleIncrement = (increment: Iteration) => {
            if(increment.start_date == null || increment.end_date == null){
                this.hideAllIcrements();
                this.doToggleAction(increment);
            }else{
                this.hideDatelessIcrements();
                this.doToggleAction(increment);
            }
            this.refreshData();
            this.$scope.$root.$broadcast("timelineIncrementChanges", null);
        }

        private hideDatelessIcrements(){
            _.forEach(this.projectData.iterations, (increment) => {
                if(increment.start_date == null || increment.end_date == null){
                    increment["showInTimeline"] = false;
                }
            })
        }

        private hideDatedIcrements(){
            _.forEach(this.visibleIncrements, (increment: Iteration) => {
                if(increment.start_date != null && increment.end_date != null){
                    increment["showInTimeline"] = false;
                }
            });
        }

        private checkforMixIteration(){
            var withDates = _.find(this.visibleIncrements, (i: Iteration) => {
                return (i.start_date!=null && i.end_date!=null)
            });
            var withoutDates = _.find(this.visibleIncrements, (i: Iteration) => {
                return (i.start_date==null || i.end_date==null)
            });

            if(withDates != null && withoutDates != null){
                this.hideDatedIcrements();
            }
            
        }

        private hideAllIcrements(){
            _.forEach(this.projectData.iterations, (i) => i["showInTimeline"] = false)
        }

        private doToggleAction(increment: Iteration){
            var active = _.filter(this.projectData.iterations, (i) => i["showInTimeline"] ===true);
            if(active.length === 1 && active[0].id == increment.id){
                return;
            }
            if(increment["showInTimeline"] == null){
                increment["showInTimeline"] = false;
            }else{
                increment["showInTimeline"] = !increment["showInTimeline"];
            } 
        }

        private setTimeScaleWidth = () => {
            setTimeout(() => {
                if($('.scrumdo-timeline-wrapper').length == 0) return;
                var elm = $(".timeline-scale", ".scrumdo-timeline-wrapper");
                elm.empty();
                elm.css({ width: "" });
                var width = document.getElementById("scrumdo-timeline-wrapper").scrollWidth;
                elm.css({ width: (width) + "px" });
                this.updateTimeScale();
            }, 200);
        }

        private refreshData(){
            this.updateVisibleData();
            this.setDates();
            this.setTimeScaleWidth();
        }

        private updateVisibleData(){
            this.visibleIncrements = _.sortBy( _.filter(
                                            this.projectData.iterations, (i) => i["showInTimeline"] !== false), 
                                            (i) => moment(i.start_date));
            this.selectedIds = _.pluck(this.visibleIncrements, 'id');
            this.checkforMixIteration();
            this.updateTimelineMode();
        }

        private checkIfNoneActive(){
            if(this.visibleIncrements.length == 0){
                var dateless = _.filter(this.projectData.iterations, (i: Iteration) => i.iteration_type == 1 && i.start_date == null && i.end_date==null);
                if(dateless[0] != null ){
                    dateless[0]["showInTimeline"] = true;
                }
                this.refreshData();
            }
        }

        private updateTimelineMode(){
            if(this.visibleIncrements.length == 0 || (this.visibleIncrements[0].start_date == null  && this.visibleIncrements[0].end_date == null)){
                this.datelessMode = true;
            }else{
                this.datelessMode = false;
            }
        }

        private setDates(){
            if(this.datelessMode) return; 
            var startDates = _.map(this.projectData.iterations,(i) => { 
                    if(i["showInTimeline"] !==false && i.start_date != null ) return moment(i.start_date)});
            var endDates = _.map(this.projectData.iterations,(i) => { 
                if(i["showInTimeline"] !==false && i.end_date != null ) return moment(i.end_date)});
            this.startDate = _.min(startDates).format("MM/DD/YYYY");
            this.endDate = _.max(endDates).format("MM/DD/YYYY");
        }

        private updateTimeScale(){
            if(!this.datelessMode){
                this.$scope.timeScale.initData();
            }
        }

        public toggleSidebar = () => {
            return this.$localStorage.timelineSidebarOpen = !this.$localStorage.timelineSidebarOpen;
        }

        public createIncrement = () => {
            this.iterationWindowService.createIteration(this.organizationSlug, this.projectSlug, null, "increment");
            return this.mixpanel.track("Create Increment");
        }

        public editIncrement(increment){
            this.iterationWindowService.editIteration(this.organizationSlug, this.projectSlug, increment, "increment");
        }

        private refreshIterations = () => {
            this.iterationManager.loadIterations(this.organizationSlug, this.projectSlug).then((iterations) => {
                this.projectData.iterations = iterations;
            });
        }
        
        public hightlightConnector(id, flag){
            var connectorId = `increment-path-${id}`;
            var startPointId = `start-point-${id}`;
            var classList = flag? "connector-line active" : "connector-line";
            $(`#${connectorId}`).attr("class", classList);
            if(flag){
                $(`#${startPointId}, #increment-highlighter-${id}`).addClass("active");
            }else{
                $(`#${startPointId}, #increment-highlighter-${id}`).removeClass("active");
            }
        }

        public iterationSortOrder(a, b) {
            if (a.hidden && !b.hidden) {
                return 1;
            }
            if (b.hidden && !a.hidden) {
                return -1;
            }

            if ((a.end_date == null) && (b.end_date != null)) {
                return -1;
            }

            if ((b.end_date == null) && (a.end_date != null)) {
                return 1;
            }

            if ((a.end_date == null) && (b.end_date == null)) {
                // Both are null, compare by name
                if (a.name > b.name) {
                    return -1;
                } else {
                    return 1;
                }
            }

            if (a.end_date > b.end_date) {
                return -1;
            } else if (a.end_date < b.end_date) {
                return 1;
            }
            return 0;
        }

        private buildIterationTree(){
            this.iterationTree = {};
            this.iterationTree[-1] = [];
            _.forEach(this.projectData.iterations, (itr:Iteration) => {
                if(itr.increment != null){
                    this.haveParentIncrement = true;
                    if(this.iterationTree[itr.increment.id] == null){
                        this.iterationTree[itr.increment.id] = [itr];
                    }else{
                        this.iterationTree[itr.increment.id].push(itr);
                    }
                }else{
                    this.iterationTree[-1].push(itr);
                }
            });
        }

    }
}