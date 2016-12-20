/// <reference path='../_all.ts' />

module scrumdo {
    export class StoryQueueController {
        public static $inject: Array<string> = [
            "$scope",
            "$http",
            "organizationSlug",
            "projectSlug",
            "API_PREFIX",
            "$uibModal",
            "urlRewriter",
            "mixpanel",
            "projectManager",
            "iterationManager",
        ];

        private archivedVisible: boolean;
        private current_page: number;
        private progress: number;
        private working: boolean;
        private maxCount: number;
        private count: number;
        private max_page: number;
        private items: Array<any>;
        private importQueue;
        private archiveQueue;
        private target;
        private project;

        constructor(
            private scope,
            private http: ng.IHttpService,
            public organizationSlug: string,
            public projectSlug: string,
            public API_PREFIX: string,
            private modal: ng.ui.bootstrap.IModalService,
            private urlRewriter: URLRewriter,
            private mixpanel,
            private projectManager,
            private iterationManager: IterationManager) {

            this.target = null;
            this.iterationManager.loadIterations(organizationSlug, projectSlug).then((result) => {
                this.scope.iterations = result;
                this.target = _.findWhere(result, { iteration_type: 0 });
            });

            this.projectManager.loadProject(organizationSlug, projectSlug).then((result) => {
                this.project = result;
                this.scope.project = result;
            });
            this.archivedVisible = false;
            this.current_page = 1;
            this.progress = 0;
            this.working = false;
            this.maxCount = 1;
            this.loadPage(1);
        }

        reload() {
            this.loadPage(this.current_page);
        }

        loadPage(number) {
            this.http.get(this.API_PREFIX + "organizations/" + this.organizationSlug + "/projects/"
                + this.projectSlug + "/storyqueue?archived=" + this.archivedVisible + "&page=" + this.current_page).then((result: any) => {
                    var data = result.data;
                    this.count = data.count;
                    this.current_page = data.current_page;
                    this.max_page = data.max_page;
                    this.items = data.items;

                    var ref = this.items;
                    for (var i = 0, len = ref.length; i < len; i++) {
                        var item = ref[i];
                        item.selected = false;
                    }
                });
        }

        showArchived() {
            this.archivedVisible = !this.archivedVisible;
            this.loadPage(this.current_page);
        }

        selectAll() {
            var i, item, len, ref;
            ref = this.items;
            for (i = 0, len = ref.length; i < len; i++) {
                item = ref[i];
                item.selected = true;
            }
        }

        batchImport() {
            this.working = true;
            this.importQueue = _.where(this.items, { selected: true });
            this.maxCount = this.importQueue.length;
            this.importNext();
        }

        batchArchive() {
            this.working = true;
            this.archiveQueue = _.where(this.items, {
                selected: true
            });
            this.maxCount = this.archiveQueue.length;
            this.archiveNext();
        }

        importNext = () => {
            if (this.importQueue.length === 0) {
                this.working = false;
                return;
            }
            this.progress = Math.round(100 * (this.maxCount - this.importQueue.length) / this.maxCount);
            var next = this.importQueue.shift();
            this.import(next.id).then(this.importNext);
        }

        archiveNext = () => {
            if (this.archiveQueue.length === 0) {
                this.working = false;
                return;
            }
            this.progress = Math.round(100 * (this.maxCount - this.archiveQueue.length) / this.maxCount);
            trace(this.progress);
            var next = this.archiveQueue.shift();
            this.archive(next.id).then(this.archiveNext);
        }

        import(itemId) {
            var payload = {
                action: 'import',
                iteration: this.target.id,
                id: itemId
            };

            return this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + this.projectSlug
                + "/storyqueue", payload).then((result) => {
                    this.removeItem(itemId);
                });
        }

        archive(itemId) {
            var payload = {
                action: 'archive',
                iteration: this.target.id,
                id: itemId
            };

            return this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + this.projectSlug
                + "/storyqueue", payload).then((result) => {
                    if (!this.archivedVisible) {
                        this.removeItem(itemId);
                    }
                });
        }

        removeItem(itemId) {
            var item = _.findWhere(this.items, { id: itemId });
            if (!item.archived) {
                this.project.story_queue_count -= 1;
            }
            removeById(this.items, itemId);
        }
    }
}