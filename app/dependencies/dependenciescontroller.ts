/// <reference path='../_all.ts' />

module scrumdo {

    export class DependencyColumn implements CardGridColumn {
        // public iteration:Iteration;
        // public get title(): string {
        //     return this.iteration.name;
        // }
        id: string;
        public title: string;
        public visible: boolean;
        schedule: ProgramIncrementSchedule;
    }

    export class DependencyRow implements CardGridRow {
        // public team:Project;
        // public get title(): string {
        //     return this.team.name;
        // }
        // public visible: boolean;
        id: string;
        public title: string;
        public visible: boolean;
    
    }

    // ------------------------------------------------------------------------------------------------------------
    export class DependenciesController {
        public static $inject:Array<string> = [
            "projectData",
            "projectManager",
            "epicManager",
            "storyManager",
            "dependencyManager",
            "organizationSlug",
            "$q",
            "$scope",
            "realtimeService",
            "userService",
            "storyEditor"
        ];

        public noData;
        public columns:Array<DependencyColumn> = [];
        public rows:Array<DependencyRow> = [];
        public dependencies:Array<Array<number>>;
        private teamsSlug:Array<string>;

        // Map from project:scheduleid to an iterationid in that project
        public iterationIds = {};

        constructor(public project:ProjectDatastore,
                    private projectManager:ProjectManager,
                    private epicManger:EpicManager,
                    private storyManager:StoryManager,
                    private dependencyManager:DependencyManager,
                    private organizationSlug:string,
                    private $q:ng.IQService,
                    private $scope:ng.IScope,
                    private realtimeService: RealtimeService,
                    private userService: UserService,
                    private storyEditor: StoryEditor) {

            this.setupRowsColumns();
            $scope.$root['kiosk'] = new Kiosk();
            $scope.$on("$destroy", this.onDestroy);
            $scope.$on("incrementChanged", this.setupRowsColumns);
            $scope.$on("cardGridDrag", this.onCardGridDrag)
            $scope.$on("dependencyChanged", this.setupDependencies)
            $scope.$on("$destroy", this.onDestroy);
            $scope.$on('newCard', this.onNewCard);
            this.subscribeTeamProjects();

        }

        private subscribeTeamProjects(){
            if(this.project.currentIncrement.schedule != null){
                this.teamsSlug = _.reduce(this.project.getIncrementTeams(), (list, iteration:IncrementIteration)=>{
                    return list.concat(iteration.project_slug);
                }, []);
                this.realtimeService.subscribeProject(this.teamsSlug);
            }
        }

         private onDestroy = () => {
            this.$scope.$root['kiosk'] = null;
            this.realtimeService.unSubscribeProject(this.teamsSlug);
        }

        onNewCard = (event, {row, column}) => {
            let schedule:ProgramIncrementSchedule = column.schedule;
            let iterationId = _.findWhere(schedule.iterations,{project_slug:row.id}).iteration_id;
            this.projectManager.loadProject(this.organizationSlug, row.id)
                                .then((teamProject)=> {
                                    this.storyEditor.createStory(teamProject, {
                                        iteration_id:iterationId,
                                        release:row.release
                                    });
                                });
        }
        
        onCardGridDrag = (event, data) => {
            let row:DependencyRow = data.row;
            let column:DependencyColumn = data.column;
            let storyId = data.storyId;
            let story = this.storyManager.getStory(storyId);

            trace("DependenciesController::onCardGridDrag");

            let schedule:ProgramIncrementSchedule = column.schedule;
            let iter:IncrementIteration = _.findWhere(schedule.iterations,{project_slug:row.id})

            let projectSlug = row.id;
            let iterationId = iter.iteration_id;
            
            this.storyManager.moveToProject(story, projectSlug, iterationId);
        }

        setupDependencies = () => {
            this.dependencyManager
                .loadIncrementDependencies(this.project.currentIncrement.id)
                .then((result) => this.dependencies = result.data.map((dep) => [dep.dependency, dep.story]));
        }


        setupRowsColumns = () => {
            if( (!this.project.currentIncrement) || (!this.project.currentIncrement.id) ){
                this.noData = true;
                return;
            }

            this.columns = this.project.currentIncrement.schedule.map((schedule:ProgramIncrementSchedule) => ({
                id: String(schedule.id),
                title: schedule.default_name,
                visible: true,
                schedule: schedule,
                available: this.getColumnsAvailability(schedule)
            }));

            this.rows = this.project.getIncrementTeams().map((iter: IncrementIteration) => ({
                id: iter.project_slug,
                title: iter.project_name,
                visible: true,
                canWrite: this.userService.canWrite(iter.project_slug)
            }));

            this.setupDependencies();
        }

        public gridCardProvider = (row:DependencyRow, column:DependencyColumn):CardGridCellData => {
            let schedule:ProgramIncrementSchedule = column.schedule;
            let iter:IncrementIteration = _.findWhere(schedule.iterations,{project_slug:row.id})

            return new CardGridCellData(
                this._loadIterationStories(row, iter),
                this.projectManager.loadProject(this.organizationSlug, row.id),
                this.epicManger.loadEpics(this.organizationSlug, row.id),
                this.$q
            );
        }

        private _loadIterationStories(row, iter){
            if(iter == null){
                return this.$q.resolve([]);
            }
            return this.storyManager.loadIteration(row.id, iter.iteration_id);
        }

        private getColumnsAvailability(schedule:ProgramIncrementSchedule){
            var res = {};
            _.forEach(this.project.getIncrementTeams(), (itr:IncrementIteration) => {
                res[itr.project_slug] = this.project.isTeamInSchedule(itr.project_slug, schedule);
            });
            return res;
        }
    }
}
