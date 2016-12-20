/// <reference path='../_all.ts' />

module scrumdo {
    export class SummaryController {

        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "projectData",
            "scrumdoTerms",
            "$localStorage",
            "programIncrementManager",
            "projectSlug",
            "$state",
            "reportManager",
            "IncrementScheduleWindowService",
            "mixpanel",
            "confirmService"

        ];

        private teams: Array<any>;
        private isPortfolioProject:boolean;
        private isSidebarEnabled:boolean;
        public userStoriesData: {};
        public featuresData: {};
        public incrementStoriesCounts: {cards_total:number, cards_completed:number, cards_in_progress:number};
        public leadData: {};
        public featureTerm:string;
        public visibleSchedules: {};

        constructor(public $scope: ng.IScope,
                    public organizationSlug: string,
                    public projectData:ProjectDatastore,
                    private scrumdoTerms:ScrumDoTerms, 
                    private $localStorage,
                    private programIncrementManager:ProgramIncrementManager,
                    private projectSlug:string,
                    $state: ng.ui.IStateService,
                    private reportManager: ReportManager,
                    private IncrementScheduleWindowService: IncrementScheduleWindowService,
                    private mixpanel,
                    private confirmService: ConfirmationService) {

            this.isPortfolioProject = this.projectData.currentProject.portfolio_id != null;
            this.isSidebarEnabled = this.projectData.currentProject.children_count > 0 && this.projectData.canWrite();
            var isSummaryTabEnabled: boolean = projectData.currentProject.tab_summary;
            if (!isSummaryTabEnabled) {
                $state.go('app.iteration.cards');
            }
            this.visibleSchedules = [];
            this.featureTerm = this.isPortfolioProject ? "Features" : "Stories";
            this.setupTeams();
            this.getIncrementStories();
            this.getIncrementFeature();
            this.setupChildStoriesStats();
            this.getIncrementLeadData();

            this.$scope.$on("ProjectIncrementChanged", this.reloadIncrement);
        }

        private reloadIncrement = (event, data:ProgramIncrement) => {
            this.projectData.reloadIncrement(data.iteration_id);
        }

        public toggleSidebar(){
            return this.$localStorage.timelineSidebarOpen = !this.$localStorage.timelineSidebarOpen;
        }

        private setupTeams(){
            var project = this.projectData.currentProject;
            var currentTeam = {slug:project.slug, name:project.name, icon: project['icon'], color: project['color']};
            if(this.projectData.currentIncrement.schedule == null || this.projectData.currentIncrement.schedule.length == 0){
                this.teams = [currentTeam];
                return;
            }
            this.teams = this.projectData.getIncrementTeams().map((ii:IncrementIteration) =>
                    ({slug:ii.project_slug, name:ii.project_name, icon: ii.project_icon, color: ii.project_color}));
            this.teams.unshift(currentTeam);
        }

        public setupChildStoriesStats(){
            this.incrementStoriesCounts = {cards_completed: 0, cards_in_progress:0, cards_total:0};
            if(this.projectData.currentIncrement.schedule == null || this.projectData.currentIncrement.schedule.length == 0) return;
            _.each(this.projectData.currentIncrement.schedule[0].iterations, (i:IncrementIteration) => {
                this.incrementStoriesCounts.cards_total += i.cards_total;
                this.incrementStoriesCounts.cards_in_progress += i.cards_in_progress;
                this.incrementStoriesCounts.cards_completed += i.cards_completed;
            });
        }

        public getIncrementFeature(){
            this.reportManager.loadIncrementFeaturesProgress(this.organizationSlug, this.projectSlug, this.projectData.currentIteration.id).then((data) => {
                this.featuresData = data['data'];
            });
        }

        public getIncrementStories(){
            this.reportManager.loadIncrementStoriesProgress(this.organizationSlug, this.projectSlug, this.projectData.currentIteration.id).then((data) => {
                this.userStoriesData = data['data'];
            });
        }

        public getIncrementLeadData(){
            this.reportManager.loadIncrementFeaturesLead(this.organizationSlug, this.projectSlug, this.projectData.currentIteration.id).then((data) => {
                this.leadData = data['data'];
            });
        }

        public createIncrementSchedule = () => {
            this.IncrementScheduleWindowService.createSchedule(this.organizationSlug, 
                                                                this.projectSlug, 
                                                                this.projectData.currentIteration.id, 
                                                                this.projectData.currentIncrement,
                                                                null);
            return this.mixpanel.track("Create Increment");
        }

        public editIncrementSchedule(schedule){
            this.IncrementScheduleWindowService.createSchedule(this.organizationSlug, 
                                                                this.projectSlug, 
                                                                this.projectData.currentIteration.id, 
                                                                this.projectData.currentIncrement,
                                                                schedule);
        }

        public deleteIncrementSchedule(schedule){
            this.confirmService.confirm("Are you sure?",
                "This will delete the "+ this.$scope.$root['safeTerms'].children.time_period_name +".  Are you sure?",
                "Cancel",
                "Delete",
                "btn-warning").then(() => this.onDeleteConfirm(schedule));
        }
        
        onDeleteConfirm = (schedule) => {
            this.programIncrementManager.deleteIncrementSchedule(this.projectSlug, 
                                                                this.projectData.currentIncrement.id, 
                                                                schedule).then(() => {
                                                                    this.reloadIncrement(null, this.projectData.currentIncrement);
            });
        }

        public getScheduleCardsCount(schedule){
            return _.reduce(schedule.iterations, function(memo, i:any){ return memo + i.cards_total; }, 0);
        }

        public toggleSchedule(schedule: ProgramIncrementSchedule){
            if(this.visibleSchedules[schedule.id] == null){
                this.visibleSchedules[schedule.id] = false;
            }else{
                this.visibleSchedules[schedule.id] = !this.visibleSchedules[schedule.id];
            }
            this.$scope.$broadcast("scheduleVisibilityChanged", {id:schedule.id, visible: this.visibleSchedules[schedule.id]});
        }
    }
}