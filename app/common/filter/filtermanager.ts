/// <reference path='../../_all.ts' />

module scrumdo {
    export class FilterManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ];

        private Filters: ng.resource.IResourceClass<any>;
        private currentList: Array<any>;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string) {

            this.Filters = this.resource(API_PREFIX + "query/:id", {}, {
                get: {
                    method: 'GET',
                    params: {
                        id: "@id"
                    }
                },
                remove: {
                    method: 'DELETE',
                    params: {
                        id: "@id"
                    }
                },
                save: {
                    method: 'PUT',
                    params: {
                        id: "@id"
                    }
                },
                create: {
                    method: 'POST'
                }
            });
        }

        deleteFilter(filter) {
            var p = filter.$remove();
            p.then((result) => {
                var index: number = this.currentList.indexOf(filter);
                this.currentList.splice(index, 1);
            });
            return p;
        }

        createFilter(properties) {
            var newFilter = new this.Filters();
            _.extend(newFilter, properties);
            var p = newFilter.$create();
            p.then((result) => {
                this.currentList.push(result);
            });
            return p;
        }

        loadSavedFilters() {
            var p = this.Filters.query().$promise;
            p.then((results) => {
                this.currentList = results;
            });
            return p;
        }
    }
}