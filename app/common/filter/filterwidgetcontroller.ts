/// <reference path='../../_all.ts' />

module scrumdo {
    export class FilterWidgetController {
        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "$uibModal",
            "urlRewriter",
            "filterManager",
            "boardCellManager",
            "$window",
            "userService",
            "hotkeys"
        ];

        private openNewTab: boolean = false;
        private name: string;
        private query: string;
        private savedFilters: Array<any>;
        private myCardsFlag: boolean;
        private showFilter: boolean;
        private enterPressed: boolean;
        private savedFilterFlag: boolean;
        private savedSearchDialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            private scope,
            public organizationSlug: string,
            public modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter,
            private filterManager: FilterManager,
            private boardCellManager,
            private window: ng.IWindowService,
            private userService: UserService,
            private hotkeys) {

            this.scope.ctrl = this;
            this.name = 'FilterWidgetController';
            if (this.scope.placeholder == null) {
                this.scope.placeholder = "Filter by keyword...";
            }
            this.query = "";
            this.savedFilters = [];
            if (this.scope.icon == null) {
                this.scope.icon = "glyphicon-glass";
            }
            this.myCardsFlag = false;
            this.showFilter = true;
            this.enterPressed = false;
            this.savedFilterFlag = false;
            if (this.scope.name !== "projectFilter") {
                this.hotkeys.bindTo(this.scope).add({
                    combo: "f",
                    description: "Open filter window",
                    callback: (event) => {
                        event.preventDefault();
                        this.openNewTab = false;
                        this.openFilterBuilder();
                    }
                }).add({
                    combo: "s",
                    description: "Open project Search window",
                    callback: (event) => {
                        event.preventDefault();
                        this.openNewTab = true;
                        this.openFilterBuilder('Search Project');
                    }
                });
            }
        }

        showMyCards() {
            this.openNewTab = false;
            var userQuery: string;
            if (this.myCardsFlag) {
                userQuery = "assignee: " + this.userService.me.username + ",";
                this.query = userQuery;
            } else {
                this.query = "";
                this.showFilter = true;
            }
            this.dispatchFilter();
        }

        dispatchFilter() {
                if (this.scope.projectSearch === 'true' || this.openNewTab) {
                    var q = encodeURIComponent(this.query);
                    var url = "/projects/project/" + this.scope.project.slug + "/search?q=" + q;
                    if (this.openNewTab && this.query != "") {
                        this.openNewTab = false;
                        this.query = "";
                        var win = this.window.open(url, '_blank');
                        win.focus();
                    } else {
                        this.window.location.assign(url);
                    }
                } else {
                    if (this.scope.name === "backlogFilter") {
                        this.scope.$emit('backlogFilterChange', this.query, this.scope.name);
                        if (this.scope.$root.boardProject.uiState.backlogOpen || this.query !== "") {
                            this.scope.$emit('filter', this.query, this.scope.name);
                            try {
                                this.scope.filter({
                                    filter: this.query
                                });
                            } catch (error) {
                                return;
                            } finally {
                                if (this.query != "")
                                    this.showFilter = false;
                            }
                        }
                    } else {
                        this.scope.$emit('filter', this.query, this.scope.name);
                        try {
                            this.scope.filter({
                                filter: this.query
                            });
                        } catch (error1) {
                            return;
                        }
                        finally {
                            if (this.query != "")
                                this.showFilter = false;
                        }
                    }
                }
                if (this.query != "") {
                    this.showFilter = false;
                }
            return;
        }

        enterKeyPressed() {
            this.enterPressed = true;
            this.openNewTab = false;
            this.myCardsFlag = false;
            this.dispatchFilter();
        }

        getSavedFilters() {
            var p;
            if (this.savedFilters.length === 0) {
                p = this.filterManager.loadSavedFilters();
                p.then(this.onFiltersLoaded);
                return p;
            }
            return this.savedFilters;
        }

        onFiltersLoaded = (result) => {
            if (result.length === 0) {
                this.savedFilters = [{ query: '', name: 'No Saved Queries' }];
            } else {
                this.savedFilters = result;
            }
        }

        loadSavedFilters() {
            this.getSavedFilters();
            return;
        }

        openFilterBuilder(title = 'Filter Builder') {
            var project = this.scope.project;
            var savedFilters = this.getSavedFilters();
            var cells;
            if (this.scope.cells != null) {
                cells = this.scope.cells;
            } else {
                cells = this.boardCellManager.loadCells(this.organizationSlug, project.slug);
            }
            this.savedSearchDialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("common/filter/filterbuilder.html"),
                controller: 'FilterBuilderController',
                size: "lg",
                resolve: {
                    winTitle: () => title,
                    project: () => project,
                    savedQueries: () => savedFilters,
                    cells: () => cells
                }
            });
            this.savedSearchDialog.result.then(this.onQuery);
        }

        onQuery = (query) => {
            this.myCardsFlag = false;
            this.query = query;
            this.savedFilterFlag = true;
            this.dispatchFilter();
        }

        clearFilters() {
            this.query = "";
            if (this.enterPressed  || this.myCardsFlag || this.savedFilterFlag ) {
                this.dispatchFilter();
            }
            this.myCardsFlag = false;
            this.savedFilterFlag = false;
            this.enterPressed = false;
            this.showFilter = true;
        }

        checkFilterStatus = (newValue) => {
            if (newValue === "") {
                this.clearFilters();
            }
        }
    }
}