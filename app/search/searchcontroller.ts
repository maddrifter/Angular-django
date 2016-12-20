/// <reference path='../_all.ts' /> 

module scrumdo {
 
    export class SearchController {
        public static $inject: Array<string> = [
            "$scope",
            "$stateParams",
            "storyManager",
            "projectManager",
            "organizationSlug",
            "projectSlug",
            "initialSearchTerms",
            "iterationManager"
        ];

        private project;
        private loading: boolean;
        private busyMode: boolean = false;
        private lastQuery: string;
        private currentPage;
        private maxPage;
        private storyCount;
        private stories;

        constructor(
            private scope,
            public $stateParams:ng.ui.IStateParamsService,
            private storyManager,
            private projectManager,
            public organizationSlug: string,
            public projectSlug: string,
            private initialSearch,
            private iterationManager ) {

            if (projectSlug != '') {
                this.projectManager.loadProject(this.organizationSlug, this.projectSlug).then((result) => {
                    this.project = result;
                    this.scope.project = result;
                });
                this.iterationManager.loadIterations(this.organizationSlug, this.projectSlug).then((result) => {
                    this.scope.iterations = result;
                });
            }

            this.loading = false;

            if ($stateParams['q'] !== '' || initialSearch !== '') {
                let searchKey = $stateParams['q']? $stateParams['q'] : initialSearch;
                this.search(searchKey);
            }
        }

        search(query) {
            this.loading = true;
            this.lastQuery = query;
            if (this.projectSlug === '') {
                this.storyManager.searchOrganization(query).then(this.onStoriesLoaded);
            } else {
                this.storyManager.searchProject(this.projectSlug, query).then(this.onStoriesLoaded);
            }
        }

        pageChanged() {
            this.busyMode = true;
            if (this.projectSlug === '') {
                this.storyManager.searchOrganization(this.lastQuery, this.currentPage).then(this.onStoriesLoaded);
            } else {
                this.storyManager.searchProject(this.projectSlug, this.lastQuery, this.currentPage).then(this.onStoriesLoaded);
            }
        }

        onStoriesLoaded = (stories) => {
            this.loading = false;
            this.busyMode = false;
            this.maxPage = stories.max_page;
            this.storyCount = stories.count;
            this.currentPage = stories.current_page;
            this.stories = _.map(stories.items, this.storyManager.wrapStory); 
        }
    }
}