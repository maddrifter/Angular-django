/// <reference path='../_all.ts' />

module scrumdo {

    // The minimal amount of a BoardProject we need for the backlog
    export interface BacklogBoardProject {
        backlogIterationId: Function;
        backlog: Iteration;
        uiState:UIState;
        projectSlug: string;
        project: Project;
        epics:Array<Epic>;
        iterations:Array<Iteration>;
        boardCells:Array<BoardCell>;
        backlogStories:Array<Story>;
    }

    export class BacklogController {
        public static $inject: Array<string> = [
            "$scope",
            "$rootScope",
            "$localStorage"
        ];

        public sortOrder: any = 'rank';
        public viewType: number;
        public storyLoadLimit: number;
        // public backlog;
        public storage;
        public filterOn: number;
        public storyCount: number;

        constructor(
            public scope,
            public rootScope,
            public localStorage) {

            this.viewType = 0;
            this.storyLoadLimit = 1000;
            this.scope.newstory = {
                summary: ""
            };



            this.scope.ctrl = this;
            this.scope.$on("projectLoaded", this.setIterationId);
            this.rootScope.$on("backlogFilterChange", this.onFilter);
            this.setIterationId();
            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.storage = this.localStorage.$default({});
            this.loadViewType();
        }

        get boardProject():BacklogBoardProject {
            return this.scope.boardProject;
        }

        onFilter = (event, query, name) => {
            if (name === "backlogFilter" && query !== "") {
                this.filterOn = 1;
            } else {
                this.filterOn = 0;
            }
        }

        setIterationId = () => {
            this.scope.backlogId = this.boardProject.backlogIterationId();
            if (this.boardProject.backlog) {
                this.storyCount = this.boardProject.backlog.story_count;
            }
        }
        
        // This filter needs to return a function to act as a filter
        //so it can take a param.
        filterStoryByEpic(epic) {
            return (story) => {
                var ref;
                return ((ref = story.epic) != null ? ref.id : void 0) === epic.id;
            };
        }
        
        filterStoryByNoEpic(){
            return (story) => {
                return story.epic == null;
            };
        }

        filterByNullLabel(story) {
            return story.labels.length == 0;
        }

        filterByLabel(label) {
            return (story) => {
                return _.findWhere(story.labels, { id: label.id }) != null;
            };
        }

        filterEpic(epic) {
            return !epic.archived;
        }

        toggleBacklog($event) {
            $event.preventDefault();
            this.boardProject.uiState.backlogOpen = !this.boardProject.uiState.backlogOpen;
            this.rootScope.$broadcast('backlogToggled');

        }

        loadBacklog($event) {
            $event.preventDefault();
            if (this.storyCount > this.storyLoadLimit) {
                this.boardProject.uiState.loadBacklog = !this.boardProject.uiState.loadBacklog;
            } else {
                this.boardProject.uiState.loadBacklog = !this.boardProject.uiState.loadBacklog;
                this.boardProject.uiState.backlogOpen = !this.boardProject.uiState.backlogOpen;
            }
            this.rootScope.$broadcast('backlogToggled');
        }

        onSortChange = (event, sort) => {
            if (sort === 'value_time') {
                this.sortOrder = [calculateValueOverTime_withRules,calculateValueOverTime];
            } else if (sort === 'value_point') {
                this.sortOrder = [calculateValueOverPoints_withRules,calculateValueOverPoints];
            } else if (sort === 'wsjf_value') {
                this.sortOrder = calculateWSJFValue;
            } else if (sort !== "rank") {
                this.sortOrder = [sort, "rank"];
            } else {
                this.sortOrder = sort;
            }
        }

        loadViewType() {
            var pStorage;
            if (this.storage[this.boardProject.projectSlug] != null) {
                pStorage = this.storage[this.boardProject.projectSlug];
                this.viewType = pStorage.backlogView != null ? pStorage.backlogView : 0;
            } else {
                this.storage[this.boardProject.projectSlug] = {};
                this.viewType = 0;
            }
        }
        
        viewChange(){
            this.scope.$emit('backlogChanged');
            this.storage[this.boardProject.projectSlug].backlogView = this.viewType;
        }

        selectAll(event) {
            return this.scope.$broadcast("selectAll");
        }

        selectNone(event) {
            return this.scope.$broadcast("selectNone");
        }

    }
}