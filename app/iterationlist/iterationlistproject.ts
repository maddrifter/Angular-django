// All the project specific info the iteration list
// will need to function

/// <reference path='../_all.ts' />

module scrumdo {
    export class IterationListProject {
        public static $inject: Array<string> = [
            "$rootScope",
            "organizationSlug",
            "storyManager",
            "iterationManager",
            "$window",
            "$q"
        ];

        private storyLoadLimit: number;
        public iteration;
        private searchQuery;
        public stories;
        public projectSlug: string;
        private projectData: ProjectDatastore;
 
        constructor(
            private rootScope,
            public organizationSlug: string,
            private storyManager: StoryManager,
            private iterationManager: IterationManager,
            private window: ng.IWindowService,
            private $q: ng.IQService) {

            this.rootScope.iterationListProject = this;
            this.rootScope.$on("filter", this.onFilter);
            this.storyLoadLimit = 1000;
            this.iteration = {};
            
            var _refreshIteration = _.debounce(this.reloadIteration, 500);
            this.rootScope.$on("storyModified", _refreshIteration);
            this.rootScope.$on("onStoryAdded", _refreshIteration);
            this.rootScope.$on("projectIterationChanges", this.reloadData);
            this.rootScope.$on('$stateChangeSuccess', this.onStateChanged);
        }

        onStateChanged = (event, data) => {
            if(data.name == "app.iteration.cards"){
                this.reloadData(null, null);
            }
        }

        reloadData = (event, iteration: Iteration) => {
            this.iteration = this.projectData.currentIteration;
            this.stories = this.projectData.currentStories;
        }
        
        init(projectData: ProjectDatastore){
            this.projectData = projectData;
            this.iteration = projectData.currentIteration;
            this.projectSlug = projectData.currentProject.slug;
            this.stories = projectData.currentStories;
            this.rootScope.$broadcast("appLoaded");
        }

        onFilter = (event, query, filterName) => {
            console.log(filterName);
            trace("Filter changed");
            this.searchQuery = query;
            this.loadStories();
        }

        loadStories() {
            var q: string = "";
            if ((this.searchQuery != null) && this.searchQuery !== "") {
                q = this.searchQuery;
            }
            if(q != ""){
                this.storyManager.searchIterations(this.projectSlug, [this.iteration.id], q, true).then((e) => {
                    this.stories = e;
                    if (this.searchQuery == null) {
                        this.rootScope.$broadcast("appLoaded");
                    }
                });
            }else{
                this.stories = this.projectData.currentStories;
            }
        }
        
        reloadIteration = () => {
            this.iterationManager.loadIteration(this.organizationSlug, this.projectSlug, this.iteration.id).$promise.then((iteration) => {
                this.iteration = iteration;
            });
        }
    }
}