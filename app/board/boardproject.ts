/// <reference path='../_all.ts' />

module scrumdo {
    export class BoardProject {
        public static $inject: Array<string> = [
            "$rootScope",
            "projectSlug",
            "organizationSlug",
            "iterationManager",
            "storyManager",
            "epicManager",
            "$q",
            "projectDatastore",
            "$timeout"
        ];

        public backlogStories: Array<any> = [];
        public archiveStories: Array<any> = [];
        public editMode: boolean = false;
        public searchQuery: string = "";
        public fullyLoaded: boolean = false;
        public canEditBoard: boolean;
        public uiState;
        public toLoad: number;
        public projectLoaded: boolean;
        public iterations: Array<Iteration>;
        public iteration: Iteration;
        public backlog;
        public project;
        public boardCells;
        public workflows;
        public policies;
        public boardHeaders;
        public epics;
        public nestedEpics;
        public boardStories;

        constructor(
            public rootScope,
            public projectSlug: string,
            public organizationSlug: string,
            public iterationManager: IterationManager,
            public storyManager: StoryManager,
            public epicManager: EpicManager,
            public $q: ng.IQService,
            public projectData: ProjectDatastore,
            public timeout: ng.ITimeoutService) {
            
            this.canEditBoard = true;
            this.uiState = new UIState();
            this.toLoad = 7;
            this.projectLoaded = false;

            this.initData();

            this.rootScope.boardProject = this;
            if(this.projectData.currentIteration != null){
                this.rootScope.defaultBoardIteration = this.projectData.currentIteration.id;
            }

            
            this.rootScope.$on("filter", this.onFilter);
            var _refreshIteration = _.debounce(this.reloadIterations, 500);
            this.rootScope.$on("storyModified", _refreshIteration);
            this.rootScope.$on("storyDeleted", _refreshIteration);
            this.rootScope.$on("onStoryAdded", _refreshIteration);
            this.rootScope.$on("projectIterationChanges", this.reloadData);
            this.rootScope.$on('$stateChangeSuccess', this.onStateChanged);
        }

        onStateChanged = (event, data) => {
            if(data.name == "app.iteration.board"){
                this.reloadData(null, null);
            }
        }

        reloadData = (event, iteration: Iteration) => {
            this.iteration = this.projectData.currentIteration;
            this.rootScope.boardStories = this.boardStories = this.projectData.currentStories;
            this.rootScope.defaultBoardIteration = this.projectData.currentIteration.id;
        }

        initData(){
            this.iterations = this.rootScope.iterations = this.projectData.iterations;
            this.iteration = this.projectData.currentIteration;
            this.backlog = _.findWhere(this.iterations, { iteration_type: 0 });
            this.project = this.rootScope.project = this.projectData.currentProject;
            this.boardCells = this.projectData.cells;
            this.workflows = this.projectData.workflows;
            this.policies = this.projectData.policies;
            this.boardHeaders = this.projectData.headers;
            this.epics = this.rootScope.epics = this.projectData.epics;
            this.nestedEpics = this.epicManager.toNested(this.epics);
            this.projectLoaded = true;
            this.timeout(()=>this.rootScope.$broadcast("projectLoaded"), 10);
            this.rootScope.boardStories = this.boardStories = this.projectData.currentStories;
            
        }

        backlogIterationId() {
            var ref;
            return (ref = this.project) != null ? ref.kanban_iterations.backlog : void 0;
        }

        archiveIterationId() {
            var ref;
            return (ref = this.project) != null ? ref.kanban_iterations.archive : void 0;
        }

        loadBacklog(query = '') {
            this.storyManager.loadIterations(this.projectSlug, [this.backlogIterationId()], query).then((stories) => {
                this.backlogStories = stories;
            });
        }

        loadArchive() {
            var t = this;
            this.storyManager.loadIterations(this.projectSlug, [this.archiveIterationId()]).then((stories) => {
                Array.prototype.splice.apply(t.archiveStories, [0, t.archiveStories.length].concat(stories));
            });
        }

        onFilter = (event, query, filterName) => {
            if (filterName === 'boardFilter') {
                trace("Filter changed");
                this.searchQuery = query;
                this.loadStories();
            } else if (filterName === 'backlogFilter') {
                trace("Backlog filter changed");
                this.loadBacklog(query);
            }
        }

        loadStories() {
            var q = "";
            if ((this.searchQuery != null) && this.searchQuery !== "") {
                q = this.searchQuery;
            }
            if(q != ""){
                this.storyManager.searchIterations(this.projectSlug, [this.iteration.id] , q, true).then((stories) => {
                    this.rootScope.boardStories = this.boardStories = stories;
                    this.rootScope.$broadcast("storiesChanged");
                    if (!this.fullyLoaded) {
                        this.fullyLoaded = true;
                        this.rootScope.$emit('fullyLoaded');
                    }
                });    
            }else{
                this.rootScope.boardStories = this.boardStories = this.projectData.currentStories;
            }
        }

        getCell(id) {
            return this.getById(this.boardCells, id);
        }

        getHeader(id) {
            return this.getById(this.boardHeaders, id);
        }

        getPolicy(id) {
            return this.getById(this.policies, id);
        }

        getWorkflow(id) {
            return this.getById(this.workflows, id);
        }

        getById(collection, id) {
            var results = _.where(collection, { 'id': id });
            if (results.length === 0) {
                return null;
            }
            return results[0];
        }

        reloadIterations = () => {
            this.iterationManager.loadIterations(this.organizationSlug, this.projectSlug, true).then((i) => {

                _.each(i, (e: any) => {
                    if(!_.findWhere(this.iterations, {id:e.id})) {
                        this.iterations.push(e);
                    }
                });

                _.each(i, (e: any) => {
                    let iter:Iteration = <Iteration>_.findWhere(this.iterations, {id:e.id});
                    if(iter){iter.story_count = e.story_count;}

                    iter = <Iteration>_.findWhere(this.rootScope.iterations, {id: e.id});
                    if(iter){iter.story_count = e.story_count;}
                });
            });
        }
    }
}