/// <reference path='../_all.ts' />

module scrumdo {
    export class BoardHeadersManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "$q"
        ];

        public headersByProject;
        public BoardHeader: ng.resource.IResourceClass<any>;

        constructor(
            public resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public q: ng.IQService) {

            this.headersByProject = {};
            this.BoardHeader = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/header/:id",
                {
                    id: '@id',
                    organizationSlug: 'organizationSlug',
                    projectSlug: 'projectSlug'
                },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "project_slug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "project_slug",
                            id: "@id"
                        }
                    }
                }
            );
        }

        deleteHeader(header, organizationSlug: string, projectSlug: string) {
            return header.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }

        createHeader(properties, organizationSlug: string, projectSlug: string) {
            var cell = new this.BoardHeader();
            _.extend(cell, properties);
            var p = cell.$create({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            p.then(this.setupModelMethodsOnHeader);
            return p;
        }

        saveHeader(header, organizationSlug: string, projectSlug: string) {
            var p = header.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            p.then(this.setupModelMethodsOnHeader);
            return p;
        }

        loadHeaders(organizationSlug: string, projectSlug: string) {
            if (projectSlug in this.headersByProject) {
                var deferred = this.q.defer();
                deferred.resolve(this.headersByProject[projectSlug]);
                return deferred.promise;
            }

            var p = this.BoardHeader.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
            p.then((results) => {
                this.headersByProject[projectSlug] = results;
                this.setupModelMethods(results);
            });
            return p;
        }

        setupModelMethods(headers) {
            var i, len, model;
            for (i = 0, len = headers.length; i < len; i++) {
                model = headers[i];
                this.setupModelMethodsOnHeader(model);
            }
        }

        setupModelMethodsOnHeader = (model) => {
            model.setGridsx = function(val) {
                var w;
                w = this.ex - this.sx;
                this.sx = val * GRID_CONSTANTS.fullsize;
                return this.ex = this.sx + w;
            };

            model.setGridsy = function(val) {
                var h;
                h = this.ey - this.sy;
                this.sy = val * GRID_CONSTANTS.fullsize;
                return this.ey = this.sy + h;
            };

            model.setGridWidth = function(val) {
                if (this.isVertical()) {
                    return;
                }
                return this.ex = (val * GRID_CONSTANTS.fullsize) + this.sx;
            };

            model.setGridHeight = function(val) {
                if (!this.isVertical()) {
                    return;
                }
                return this.ey = (val * GRID_CONSTANTS.fullsize) + this.sy;
            };

            model.gridsx = function() {
                //See comments at top of kanbanboardeditorview
                return Math.floor(model.sx / GRID_CONSTANTS.fullsize);
            };

            model.gridex = function() {
                // See comments at top of kanbanboardeditorview
                return (Math.floor(model.ex / GRID_CONSTANTS.fullsize)) - 1;
            };

            model.gridsy = function() {
                // See comments at top of kanbanboardeditorview
                return Math.floor(model.sy / GRID_CONSTANTS.fullsize);
            };

            model.gridey = function() {
                //See comments at top of kanbanboardeditorview
                return (Math.floor(model.ey / GRID_CONSTANTS.fullsize)) - 1;
            };

            model.isVertical = function() {
                var h, w;
                w = model.ex - model.sx;
                h = model.ey - model.sy;
                return h > w;
            };

            model.backgroundColorHex = function() {
                return pad(model.background.toString(16), 6);
            };

            model.header = true;
        }
    }
}