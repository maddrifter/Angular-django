/// <reference path='../_all.ts' />

module scrumdo {
    export class BoardCellManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "$q"
        ];

        public cellsByProject;
        public CellCounts: ng.resource.IResourceClass<any>;
        public BoardCell: ng.resource.IResourceClass<any>;

        constructor(
            public resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public q: ng.IQService) {

            this.cellsByProject = {}

            this.CellCounts = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iteration/:iterationId/cell_counts");

            this.BoardCell = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/boardcell/:id",
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

        cellCounts(organizationSlug: string, projectSlug: string, iterationId) {
            return this.CellCounts.query({ organizationSlug: organizationSlug, projectSlug: projectSlug, iterationId: iterationId });
        }

        deleteCell(cell, organizationSlug: string, projectSlug: string, targetCellId = null) {
            if (typeof targetCellId !== "undefined" && targetCellId !== null) {
                return cell.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug, target_cell_id: targetCellId });
            } else {
                return cell.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            }
        }

        createCell(properties, organizationSlug: string, projectSlug: string) {
            var cell = new this.BoardCell();
            _.extend(cell, properties);
            var p = cell.$create({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            p.then(this.setupModelMethodsOnCell);
            return p;
        }

        saveCell(cell, organizationSlug: string, projectSlug: string) {
            return cell.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug }).then(this.setupModelMethodsOnCell);
        }

        loadCells(organizationSlug: string, projectSlug: string):ng.IPromise<BoardCell[]> {
            if (projectSlug in this.cellsByProject) {
                var deferred = this.q.defer();
                deferred.resolve(this.cellsByProject[projectSlug]);
                return deferred.promise;
            }
            var p = this.BoardCell.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
            p.then((results) => {
                this.cellsByProject[projectSlug] = results;
                this.setupModelMethods(results);
            });
            return p;
        }

        setupModelMethods(cells) {
            var i, len, model;
            for (i = 0, len = cells.length; i < len; i++) {
                model = cells[i];
                this.setupModelMethodsOnCell(model);
            }
        }

        setupModelMethodsOnCell = (model) => {
            model.setGridsx = function(val) {
                this.x = val * GRID_CONSTANTS.fullsize;
            }

            model.setGridsy = function(val) {
                this.y = val * GRID_CONSTANTS.fullsize;
            }

            model.setGridWidth = function(val) {
                this.width = val * GRID_CONSTANTS.fullsize;
            }

            model.setGridHeight = function(val) {
                this.height = val * GRID_CONSTANTS.fullsize;
            }

            model.gridsx = function() {
                // See comments at top of kanbanboardeditorview
                return Math.floor(this.x / GRID_CONSTANTS.fullsize);
            }

            model.gridex = function() {
                // See comments at top of kanbanboardeditorview
                var x = this.x + this.width;
                return (Math.floor(x / GRID_CONSTANTS.fullsize)) - 1;
            }

            model.gridsy = function() {
                // See comments at top of kanbanboardeditorview
                return (Math.floor(this.y / GRID_CONSTANTS.fullsize));
            }

            model.gridey = function() {
                // See comments at top of kanbanboardeditorview
                var y = this.y + this.height;
                return (Math.floor(y / GRID_CONSTANTS.fullsize)) - 1;
            }

            model.headerColorHex = function() {
                return pad(this.headerColor.toString(16), 6);
            }

            model.backgroundColorHex = function() {
                return pad(this.backgroundColor.toString(16), 6)
            }
        }
    }
}