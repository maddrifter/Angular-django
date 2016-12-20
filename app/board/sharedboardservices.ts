/// <reference path='../_all.ts' />

module scrumdo {
    export class SharedStoryManager {
        public static $inject: Array<string> = [
            "$http",
            "API_PREFIX",
            "shareKey",
            "$q"
        ];

        public storyPromises = {};

        constructor(
            public http: ng.IHttpService,
            public API_PREFIX: string,
            public shareKey: string,
            public q: ng.IQService) {
        }

        loadStory(storyId) {
            if (storyId in this.storyPromises) {
                return this.storyPromises[storyId];
            }
            var p = this.http.get(this.API_PREFIX + "shared/" + this.shareKey + "/story/" + storyId);
            this.storyPromises[storyId] = p;
            return p;
        }

        loadTasks(project_slug, story_id) {
            var d = this.q.defer();
            this.loadStory(story_id).then((result) => {
                d.resolve(result.data.tasks);
            });
            return d.promise;
        }
    }

    export class SharedUserService {
        public static $inject: Array<string> = [
            "$rootScope",
            "organizationSlug",
            "projectSlug",
            "$localStorage",
            "API_PREFIX",
            "shareKey"
        ];

        public me;

        constructor(
            public scope,
            public organizationSlug: string,
            public projectSlug: string,
            public $localStorage,
            public API_PREFIX: string,
            public shareKey: string) {

            this.scope.$storage = $localStorage.$default({});
            this.scope.user = {
                username: "guest",
                first_name: "Guest",
                last_name: "",
                staff_orgs: [],
                base_url: "https://app.scrumdo.com",
                id: 1,
                avatar: "https://app.scrumdo.com/avatar/avatar/24/guest",
                organization: {
                    slug: "scrumdo",
                    id: 2,
                    name: "ScrumDo LLC"
                },
                timezone: "US/Eastern",
                email: "guest@scrumdo.com",
                staff: false,
                project_access: {}
            };
            this.scope.user.project_access[projectSlug] = {
                category: "",
                canAdmin: false,
                name: "",
                favorite: true,
                publishKey: "",
                subscribeKey: "",
                canWrite: false,
                canRead: true,
                slug: projectSlug,
                channel: "",
                uuid: ""
            };
            this.scope.$broadcast("accessChanged");
        }

        setupSecurityVariables(me) {
            this.me = me;
            return;
        }

        access(projectSlug) {
            if ((this.me != null) && projectSlug in this.me.project_access) {
                return this.me.project_access[projectSlug];
            } else {
                return null;
            }
        }

        canAdmin(projectSlug) {
            return false;
        }

        canWrite(projectSlug) {
            return false;
        }

        canRead(projectSlug) {
            return true;
        }

        projectList() {
            var k, r, ref, v;
            r = [];
            ref = this.me.project_access;
            for (k in ref) {
                v = ref[k];
                r.push({
                    'slug': k,
                    'name': v.name,
                    'category': v.category
                });
            }
            return _.sortBy(r, (v: any) => (pad(v.category, 20, ' ')) + " " + v.name);
        }
    }

    export class SharedProjectManager {
        public static $inject: Array<string> = [
            "$http",
            "API_PREFIX",
            "$q",
            "organizationSlug",
            "shareKey"
        ];

        public projects: Array<any>;

        constructor(
            public http: ng.IHttpService,
            public API_PREFIX: string,
            public q: ng.IQService,
            public organizationSlug: string,
            public shareKey: string) {

        }

        deleteLabel(labelId, projectSlug: string) {

        }

        saveLabel(labelProperties, projectSlug: string) {

        }

        loadProjectsForOrganization(organizationSlug: string, stats = false) {

        }

        loadClassicProjectsForOrganization(organizationSlug: string) {

        }

        saveProject(project) {

        }

        recordProjects(projects) {
            var i, len, project;
            for (i = 0, len = projects.length; i < len; i++) {
                project = projects[i];
                this.updateProjectRecord(project);
            }
        }

        updateProjectRecord(project) {
            if (project.slug in this.projects) {
                angular.copy(project, this.projects[project.slug]);
            } else {
                this.projects[project.slug] = project;
            }
        }

        loadProject(organizationSlug: string, projectSlug: string, forceLoad: boolean = false) {

        }
    }
    
    // This class represents everything the board would need to know about
    // a project to render the board.
    
    export class SharedBoardProject {

        public static $inject: Array<string> = [
            "$rootScope",
            "projectSlug",
            "organizationSlug",
            "$http",
            "epicManager",
            "$q",
            "shareKey",
            "API_PREFIX",
            "boardCellManager",
            "boardHeadersManager",
        ];
        public storyManager = null;
        public backlogStories: Array<any> = [];
        public archiveStories: Array<any> = [];
        public editMode: boolean = false;
        public searchQuery: string = "";
        public fullyLoaded: boolean = false;

        public canEditBoard: boolean;
        public uiState;
        public selectedIterations;
        public toLoad;
        public projectLoaded: boolean;

        public project;
        public boardCells;
        public workflows;
        public boardHeaders;
        public backlog;
        public epics;
        public nestedEpics;
        public boardStories;
        public iterations;
        public policies;

        constructor(
            public rootScope,
            public projectSlug: string,
            public organizationSlug: string,
            public http: ng.IHttpService,
            public epicManager: EpicManager,
            public $q: ng.IQService,
            public shareKey: string,
            public API_PREFIX: string,
            public boardCellManager,
            public boardHeadersManager) {

            this.canEditBoard = true;
            this.uiState = new UIState();
            this.selectedIterations = [];
            this.toLoad = 7;
            this.projectLoaded = false;
            var loads = [];

            trace("Loading " + this.API_PREFIX + "shared/" + this.shareKey);

            this.http.get(this.API_PREFIX + "shared/" + this.shareKey).then((result) => {
                var data: any = result.data;

                this.project = data.project;
                this.rootScope.project = data.project;
                this.boardCells = data.boardCells;
                this.boardCellManager.setupModelMethods(this.boardCells);
                this.workflows = data.workflows;
                this.boardHeaders = data.boardHeaders;
                this.boardHeadersManager.setupModelMethods(this.boardHeaders);
                this.selectedIterations = this.iterations = data.iterations;
                //this.rootScope.iterations = i; // var i was not there 
                this.backlog = _.findWhere(this.iterations, { iteration_type: 0 });
                this.epics = data.epics;
                this.nestedEpics = epicManager.toNested(this.epics);
                this.rootScope.epics = data.epics;
                this.boardStories = this.rootScope.boardStories = data.stories;
                this.rootScope.$broadcast("storiesChanged");
                this.projectLoaded = true;
                this.rootScope.$broadcast("projectLoaded");
                this.fullyLoaded = true;
                this.rootScope.$emit('fullyLoaded');
            });

            this.rootScope.boardProject = this;

            var iterWatcher = ($scope) => {
                if ($scope.boardProject.iterations == null) {
                    return;
                }
                return $scope.boardProject.iterations.map((iteration) => {
                    return iteration.selected;
                });
            }

            this.rootScope.$watch(iterWatcher, this.onIterationsChanged, true);

            this.rootScope.kiosk = new Kiosk();
            this.rootScope.$on("filter", this.onFilter);
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
            this.backlogStories = [];
        }

        loadArchive() {
            this.archiveStories = [];
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

        onIterationsChanged = () => {
            this.selectedIterations = this.iterations;
        }

        loadStories() {

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
    }
}