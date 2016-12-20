/// <reference path='../../_all.ts' />

module scrumdo {
    export class FilterBuilderController {
        public static $inject: Array<string> = [
            "$scope",
            "project",
            "savedQueries",
            "cells",
            "organizationSlug",
            "epicManager",
            "filterManager",
            "confirmService",
            "hotkeys",
            "$timeout",
            "winTitle",
            "alertService"
        ];

        private name: string;
        private createdBeforeOpen: boolean;
        private order: boolean;
        private filterLabel;
        private release;
        private currentEpic;
        private assignees;
        private creators;
        private options;
        private epics: Array<any>;
        private workItemName:string;

        constructor(
            private scope,
            public project,
            public savedQueries,
            private cells,
            public organizationSlug: string,
            private epicManager: EpicManager,
            private filterManager: FilterManager,
            private confirmService: ConfirmationService,
            private hotkeys,
            public $timeout: ng.ITimeoutService,
            public winTitle,
            private alertService: AlertService) {

            this.scope.ctrl = this;
            this.name = 'FilterBuilderController';
            this.createdBeforeOpen = false;
            this.order = (this.scope.order != null) && this.scope.order;
            this.filterLabel = null;
            this.release = null;
            this.currentEpic = null;
            this.assignees = [];
            this.creators = [];
            this.options = {
                createdbefore: null,
                createdafter: null,
                before: null,
                after: null
            };

            this.scope.cells = cells;
            if (this.project != null) {
                this.epicManager.loadEpics(organizationSlug, this.project.slug).then((result) => {
                    this.epics = result.concat();  // Have to make a copy so we're not appending to the cached version
                    this.epics.push({ number: -1, summary: "Card has no epic" });
                });
            }

            this.$timeout(() => {
                $('input.search-criteria')[0].focus();
            }, 900);

            this.hotkeys.bindTo(this.scope).add({
                combo: "enter",
                allowIn: ["INPUT"],
                callback: (event) => {
                    event.preventDefault();
                    this.filter();
                }
            });

            if(this.scope.$root['safeTerms'] == null){
                this.workItemName = "Release";
            }else{
                this.workItemName = this.scope.$root['safeTerms'].parent.work_item_name;
            }
        }

        notEmpty(val) {
            return (typeof val !== "undefined" && val !== null) && val.length > 0;
        }

        buildQuery() {
            var query: string = "", d, k, ref, ref1, v
            if (this.filterLabel != null) {
                this.options.label = this.filterLabel.name;
            }
            if (this.currentEpic != null) {
                this.options.epic = this.currentEpic.number;
            }
            if (this.release) {
                this.options.release = this.release.number;
            }

            ref = this.options;
            for (k in ref) {
                v = ref[k];
                if (v == null) {
                    continue;
                } else if ((v != null) && typeof v.getMonth === 'function') {
                    d = moment(v).format('M/D/YYYY');
                    query += k + ": " + d + ", ";
                } else {
                    if(v !== "")
                    query += k + ": " + v + ", ";
                }
            }
            ref = this.assignees;
            for (var i = 0, len = ref.length; i < len; i++) {
                var assignee = ref[i];
                query += "assignee: " + assignee.username + ", ";
            }

            ref1 = this.creators;
            for (i = 0, len = ref1.length; i < len; i++) {
                var creator = ref1[i];
                query += "creator: " + creator.username + ", ";
            }

            trace("Query: " + query);
            return query;
        }

        deleteFilter(filter) {
            this.filterManager.deleteFilter(filter);
        }

        filter = () => {
            this.openQuery(this.buildQuery());
        }

        saveQuery() {
            var okClass;
            var query = this.buildQuery();
            if (query != "") {
            this.confirmService.prompt("Save Query", "Enter a name for this query.", "Cancel", "Save", okClass = "secondary").then((name) => {
                    this.filterManager.createFilter({
                        name: name,
                        query: query
                    }).then(this.filter);
               
                });
            }
            else {
                this.alertService.alert("Blank Query", "Cannot create a filter for blank query");
            }
        }

        openQuery(query) {
            this.scope.$close(query);
        }

        openCreatedBefore($event) {
            $event.preventDefault();
            $event.stopPropagation();
            this.createdBeforeOpen = true;
        }
    }
}