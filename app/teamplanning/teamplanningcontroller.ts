/// <reference path='../_all.ts' />

module scrumdo {


    export class TeamPlanColumn implements CardGridColumn {
        id: string;
        public title: string;
        public visible: boolean;
        schedule: ProgramIncrementSchedule;
    }

    export class TeamPlanRow implements CardGridRow {
        id: string;
        public title: string;
        public visible: boolean;
        public feature:Story;
        public release:MiniRelease;
    }



    export class TeamPlanningController {

        public noData:boolean;
        public columns:Array<TeamPlanColumn>;
        public rows:Array<TeamPlanRow>;
        public teamOptions:Array<{project_name:string, project_slug:string}>;
        public selectedTeam:{project_name:string, project_slug:string};

        public backlogOpen:Boolean = false;

        private storyLists:Array<Array<Story>> = [];
        private workItemName:string;
        private childWorkItemName:string;
        private stats = [];

        private intervalObj;

        public static $inject:Array<string> = [
            "projectData",
            "organizationSlug",
            "storyManager",
            "storyAssignmentManager",
            "storyEditor",
            "limitSettingsService",
            "WIPLimitManager",
            "$state",
            "$q",
            "$scope",
            "realtimeService",
            "exportManager"
        ];

        constructor(public projectData:ProjectDatastore,
                    private organizationSlug:string,
                    private storyManager:StoryManager,
                    private storyAssignmentManager:StoryAssignmentManager,
                    private storyEditor:StoryEditor,
                    private limitSettingsService:LimitSettingsService,
                    private wipLimitManager:WIPLimitManager,
                    private $state,
                    private $q:ng.IQService,
                    private $scope:ng.IScope,
                    private realtimeService: RealtimeService,
                    private exportManager: ExportManager) {

            if(!projectData.currentIncrement.schedule) {
                $state.go('app.iteration.notincrement')
                return
            }
            
            this.workItemName = this.$scope.$root['safeTerms'].current.work_item_name;
            var ref = this.$scope.$root['safeTerms'].children.work_item_name;
            this.childWorkItemName = ref != null ? ref: '';
            this.setLimitBarStats();

            // wait for assignments to load
            this.intervalObj = setInterval(() => {
                this._checkForAssignments();
            }, 10);

            this.$scope.$root['kiosk'] = new Kiosk();
            this.$scope.$on('removeCardRow', this.onRemoveRow)
            this.$scope.$on('newCard', this.onNewCard)

            this.$scope.$on('cardGridDrag', this.onDragCard)
            this.$scope.$on('cardGridRawDrag', this.onRawDragCard)

            this.$scope.$on('onStoryAdded', this.calculateStats)
            this.$scope.$on('storyModified', this.calculateStats)
            this.$scope.$on("$destroy", this.onDestroy);

            wipLimitManager.getLimits(this.projectData.currentTeam.project.slug,
                                      this.projectData.currentIncrement.iteration_id).then(this.onLimitResponse)

        }

        private onDestroy = () => {
            this.$scope.$root['kiosk'] = null;
            this.realtimeService.unSubscribeProject([this.selectedTeam.project_slug]);
        }

        public setLimitBarStats(){
            this.stats = [
                            [
                                {value: 0, label:`Total ${pluralize(this.workItemName)}`, limit:0},
                                {value: 0, label:`${this.workItemName} Points`, limit:0},
                            ],
                            [
                                {value: 0, label:`${pluralize(this.childWorkItemName)}`, limit:0},
                                {value: 0, label:`${this.childWorkItemName} Points`, limit:0},
                            ]
                        ];
        }

        private _checkForAssignments(){
            if(this.projectData.currentTeam.assignments != null){
                clearInterval(this.intervalObj);
                this.setupRowsColumns();
                this.realtimeService.subscribeProject([this.selectedTeam.project_slug]);
            }
        }

        private _backlogBoardProject = null;
        public backlogBoardProject():BacklogBoardProject {
            if(!this._backlogBoardProject) {
                let team = this.projectData.currentTeam;
                let backlogId: number = team.project.kanban_iterations.backlog;
                this._backlogBoardProject = {
                    backlogIterationId: () => backlogId,
                    backlog: _.findWhere(team.iterations, {iteration_type: 0}),
                    uiState: new UIState(),
                    projectSlug: team.project.slug,
                    project: team.project,
                    epics: team.epics,
                    iterations: team.iterations,
                    boardCells: team.boardCells,
                    backlogStories: team.backlog
                }
            }
            return this._backlogBoardProject;
        }


        private calculateStats = () => {
            this.calculateFeatureStats();
            this.calculateUserStoryStats();
        }

        private calculateUserStoryStats = () => {
            let stats = this.storyLists
                .reduce((list, storyList)=>list.concat(storyList), [])
                .reduce((stats, story:Story)=>{
                    if(story.release != null){
                        if($.inArray(story.release.id, this.projectData.currentTeam.assignments) > -1){
                            stats.count++;
                            stats.points += parseFloat(<string>story.points_value);
                        }
                    }
                    return stats;
                },{count:0, points:0})
            this.stats[1][0].value = stats.count;
            this.stats[1][1].value = stats.points;
        }

        private calculateFeatureStats = () => {

            let stats = this.projectData.currentTeam.assignments
                .map((featureId)=> <Story> _.findWhere(this.projectData.currentStories, {id:featureId}))
                .reduce((acc, story:Story)=>{
                    acc.count++;
                    acc.points += parseFloat(<string>story.points_value);
                    return acc;
                },{count:0, points:0})
            this.stats[0][0].value = stats.count;
            this.stats[0][1].value = stats.points;
        }

        private onLimitResponse = (limitResponse:{data:LimitSettings}) => {
            this.setLimits(limitResponse.data);
        }

        private setLimits = (limits:LimitSettings) => {
            this.stats[0][0].limit = limits.featureLimit;
            this.stats[0][1].limit = limits.featurePointLimit;
            this.stats[1][0].limit = limits.cardLimit;
            this.stats[1][1].limit = limits.cardPointLimit;
            this.calculateFeatureStats();
        }


        public getStats():StatGroups {
            return this.stats;
        }

        public setLimit():void {
            const initial = {
                featureLimit: this.stats[0][0].limit,
                featurePointLimit: this.stats[0][1].limit,
                cardLimit: this.stats[1][0].limit,
                cardPointLimit: this.stats[1][1].limit
            }

            this.limitSettingsService
                    .showSettings(initial)
                    .then(this.onSaveLimits)
        }

        private onSaveLimits = (limits:LimitSettings) => {
            this.wipLimitManager.setLimits(this.projectData.currentTeam.project.slug,
                                           this.projectData.currentIncrement.iteration_id,
                                           limits)
                .then(this.onLimitResponse);
        }



        private onRawDragCard = (event, {storyId, placeholder}) => {
            let story = this.storyManager.getStory(storyId);
            var previousId = placeholder.prev(".cards").attr("data-story-id");
            var nextId = placeholder.next(".cards").attr("data-story-id");
            var parent = placeholder.parent();
            var iterationId = parseInt(parent.attr("data-iteration-id"));

            if(!parent){return;}

            if(iterationId != this.projectData.currentTeam.project.kanban_iterations.backlog) {
                console.log('ERROR: onRawDragCard - drag to a non-backlog, don\'t know what to do.')
                return;
            }

            this.storyManager.moveToIteration(story, iterationId);

            var other;

            if (nextId) {
                story.story_id_after = nextId;
                other = this.storyManager.getStory(story.story_id_after);
                story.rank = other.rank - 1;
            } else {
                story.story_id_after = -1;
            }

            if (previousId) {
                story.story_id_before = previousId;
                other = this.storyManager.getStory(story.story_id_before);
                story.rank = other.rank + 1;
            } else {
                story.story_id_before = -1;
            }

            placeholder.remove();
            
            this.storyManager.saveStory(story).then(this.calculateUserStoryStats)

        }

        private onDragCard = (event, {storyId, row, column, placeholder}) => {
            let story = this.storyManager.getStory(storyId);
            let targetRelease:MiniRelease = row.release;
            let targetSchedule:ProgramIncrementSchedule = column.schedule;
            let targetIteration:IncrementIteration = _.findWhere(targetSchedule.iterations,{project_slug:this.teamProjectSlug()})

            this.storyManager.moveToIteration(story, targetIteration.iteration_id);
            this.storyManager.moveToRelease(story, targetRelease.id);


            var previousId = placeholder.prev(".cards").attr("data-story-id");
            var nextId = placeholder.next(".cards").attr("data-story-id");
            var other;
            if (nextId) {
                story.story_id_after = nextId;
                other = this.storyManager.getStory(story.story_id_after);
                story.rank = other.rank - 1;
            } else {
                story.story_id_after = -1;
            }

            if (previousId) {
                story.story_id_before = previousId;
                other = this.storyManager.getStory(story.story_id_before);
                story.rank = other.rank + 1;
            } else {
                story.story_id_before = -1;
            }

            this.storyManager.saveStory(story).then(this.calculateUserStoryStats)

        }

        private teamProjectSlug():string {
            return this.projectData.currentTeam.project.slug;
        }

        onNewCard = (event, {row, column}) => {
            let schedule:ProgramIncrementSchedule = column.schedule;

            let iterationId = _.findWhere(schedule.iterations,{project_slug:this.teamProjectSlug()}).iteration_id;

            this.storyEditor.createStory(this.projectData.currentTeam.project, {
                iteration_id:iterationId,
                release:row.release
            });

        }

        teamSelected() {
            let params = _.extend({}, this.$state.params, {teamSlug:this.selectedTeam.project_slug})
            this.$state.go('app.iteration.teamplanningteam', params);
        }

        onRemoveRow = (event, row) => {
            let i = this.projectData.currentTeam.assignments.indexOf(row.feature.id)

            if(i==-1) return;

            this.projectData.currentTeam.assignments.splice(i, 1);


            this.storyAssignmentManager.removeAssignment(this.projectData.currentIncrement.id,
                                                         this.teamProjectSlug(),
                                                         row.feature.id)

            this.setupRowsColumns();
            this.calculateFeatureStats();
            this.calculateUserStoryStats();
            
        }




        public gridCardProvider = (row:TeamPlanRow, column:TeamPlanColumn):CardGridCellData => {
            let schedule:ProgramIncrementSchedule = column.schedule;
            let currentTeam = this.projectData.currentTeam;
            let iter:IncrementIteration = _.findWhere(schedule.iterations,{project_slug:currentTeam.project.slug})
            let assignmentId = parseInt(row.id);

            return new CardGridCellData(
                this._loadStoriesForAssignment(currentTeam, iter, assignmentId),
                this.$q.resolve(currentTeam.project),
                this.$q.resolve(currentTeam.epics),
                this.$q
            );
        }

        private _loadStoriesForAssignment(currentTeam, iter, assignmentId){
            if(iter == null){
                return this.$q.resolve([]);
            }
            return this.storyManager
                        .loadStoriesForAssignment(currentTeam.project.slug, iter.iteration_id, assignmentId)
                        .then((stories)=>{
                            this.storyLists.push(stories)
                            this.calculateUserStoryStats();
                            return stories
                        });
        }

        public pullFeature(story:Story) {
            if(this.projectData.currentTeam.assignments.indexOf(story.id) === -1) {
                this.projectData.currentTeam.assignments.push(story.id);

                this.storyAssignmentManager.createAssignment(this.projectData.currentIncrement.id,
                                                             this.projectData.currentTeam.project.slug,
                                                             story.id);
                this.setupRowsColumns();
                this.calculateFeatureStats();
                this.calculateUserStoryStats();
            }
        }


        setupRowsColumns = () => {
            if( (!this.projectData.currentIncrement) || (!this.projectData.currentIncrement.id) ){
                this.noData = true;
                return;
            }

            this.teamOptions = this.projectData.getIncrementTeams().map((ii:IncrementIteration) =>
                    ({project_slug:ii.project_slug, project_name:ii.project_name}));
            
            this.columns = this.projectData.currentIncrement.schedule.map((schedule:ProgramIncrementSchedule) => ({
                id: String(schedule.id),
                title: schedule.default_name,
                visible: true,
                schedule: schedule,
                available: this.getColumnsAvailability(schedule)
            }));


            this.rows = this.projectData.currentTeam.assignments.map((featureId:number) => {
                let feature = <Story> _.findWhere(this.projectData.currentStories, {id:featureId})
                return {
                    id: String(featureId),
                    title: `${this.projectData.currentProject.prefix}-${feature.number} ${feature.summary}`,
                    visible: true,
                    feature: feature,
                    release: {
                        iteration_id:feature.iteration_id,
                        number:feature.number,
                        id:feature.id,
                        project_slug:this.projectData.currentProject.slug,
                        summary:feature.summary,
                        project_prefix:this.projectData.currentProject.prefix
                    },
                    canWrite: this.projectData.currentTeam.canWrite
                }
            });

            this.rows = _.sortBy(this.rows, (r) => r.feature.rank )

            console.log(this.columns)

            this.selectedTeam = _.findWhere(this.teamOptions, {project_slug: this.projectData.currentTeam.project.slug});
        }

        public exportPlanning(event){
            this.exportManager.startTeamPlanningExport(this.projectData.currentProject, this.projectData.currentTeam, this.projectData.currentIteration.id);
        }

        private getColumnsAvailability(schedule:ProgramIncrementSchedule){
            var res = {};
            _.forEach(this.projectData.currentTeam.assignments, (featureId:number) => {
                res[String(featureId)] = this.projectData.isTeamInSchedule(this.projectData.currentTeam.project.slug, schedule);
            });
            return res;
        }
    }

    export function checkNoIncrement($scope, $state:ng.ui.IStateService, projectDatastore:ProjectDatastore) {
        $scope.projectData = projectDatastore;
        if (projectDatastore.currentIncrement.schedule) {
            $state.go('app.iteration.teamplanning')
            return
        }
    }

    export function redirectDefaultTeam($state:ng.ui.IStateService, projectDatastore:ProjectDatastore) {
        if(!projectDatastore.currentIncrement.schedule) {
            $state.go('app.iteration.notincrement')
            return
        }
        let teams = projectDatastore.getIncrementTeams().map((ii:IncrementIteration) => ii.project_slug);

        let defaultTeamSlug = teams[0];

        $state.go('app.iteration.teamplanningteam',{teamSlug:defaultTeamSlug})
    }

}