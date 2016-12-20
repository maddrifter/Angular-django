/// <reference path='../_all.ts' />

interface EpicResource extends ng.resource.IResourceClass<any> {
    load: any
}

module scrumdo {
    export class EpicManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "$sce",
            "$q",
            "$rootScope",
            "organizationSlug"
        ];
        
        private indentCharacter:string = " ";
        private epicsByProject: {};
        private epics: {};
        private nestedEpics: Array<any>;
        private Epic: EpicResource;
        private EpicStats: ng.resource.IResourceClass<any>;

        constructor(
            public resource: ng.resource.IResourceService,
            private API_PREFIX: string,
            private sce: ng.ISCEService,
            private q: ng.IQService,
            private rootScope,
            public organizationSlug: string) {

            this.epicsByProject = {};
            this.epics = {};
            this.nestedEpics = [];
            this.Epic = <EpicResource> this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/epics/:id", { id: '@id' },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: "organizationSlug",
                            projectSlug: "projectSlug"
                        }
                    },
                    load: {
                        method: 'GET',
                        isArray: false,
                        params: {
                            organizationSlug: "organizationSlug",
                            projectSlug: "projectSlug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: "organizationSlug",
                            projectSlug: "projectSlug",
                            id: "@id"
                        }
                    }
                });

            this.EpicStats = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/epic/stats/:id/", { },
                {

                });

            this.rootScope.$on("DATA:PATCH:EPIC", this.onPatch);
            this.rootScope.$on("DATA:ADD:EPIC", this.onAdd);
            this.rootScope.$on("DATA:DEL:EPIC", this.onDel);
        }

        onPatch = (event, message) => {
            var epicId = message.payload.id;
            if (!(epicId in this.epics)) {
                return;
            }
            var epic = this.epics[epicId];
            var props = message.payload.properties;
            trace("Patching epic " + epicId);
            _.extend(epic, props);
        }

        onAdd = (event, message) => {
            var epicId = parseInt(message.payload.id);
            var projectSlug = message.payload.project;
            var callback = this.onEpicLoaded(projectSlug);
            this.loadEpic(this.organizationSlug, projectSlug, epicId).then(callback);
        }

        onDel = (event, message) => {
            var epicId = parseInt(message.payload.id);
            var projectSlug = message.payload.project;
            var epic = _.findWhere(this.epicsByProject[projectSlug], { id: epicId });
            if(epic != null){
                this.onDeleteEpic(projectSlug, epic);
            }
            
        }

        onEpicLoaded = (projectSlug) => {
            return (epic) => {
                this.track(projectSlug, epic);
            }
        }

        deleteEpic(organizationSlug, projectSlug, epic) {
            var p = epic.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            var epicId = epic.id;
            var index;
            p.then(() => {
                this.onDeleteEpic(projectSlug, epic);
            });
            return p;
        }

        onDeleteEpic = (projectSlug, epic) => {
            var index;
            if (projectSlug in this.epicsByProject) {
                index = this.epicsByProject[projectSlug].indexOf(epic);
                this.epicsByProject[projectSlug].splice(index, 1);
                var ref = this.epicsByProject[projectSlug];
                for (var i = 0, len = ref.length; i < len; i++) {
                    var otherEpic = ref[i];
                    if (otherEpic.children != null) {
                        index = otherEpic.children.indexOf(epic);
                        if (index !== -1) {
                            otherEpic.children.splice(index, 1);
                        }
                    }
                }
            }
            index = this.nestedEpics.indexOf(epic);
            if (index !== -1) {
                this.nestedEpics.splice(index, 1);
            }
        }

        recordEpic(projectSlug, epic) {
            if (!(projectSlug in this.epicsByProject)) {
                this.epicsByProject[projectSlug] = [];
            }
            var existing = _.findWhere(this.epicsByProject[projectSlug], { id: epic.id });
            if (typeof existing !== "undefined" && existing !== null) {
                if(!angular.equals(epic, existing)){
                    return angular.copy(epic, existing);
                }
            } else {
                return this.epicsByProject[projectSlug].push(epic);
            }
        }

        saveEpic(organizationSlug, projectSlug, epic) {
            trace("EpicManager::saveEpic", epic);
            var p = epic.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug }).then((newEpic) => {
                //angular.copy(newEpic, epic);
                this.addIndents(this.epicsByProject[projectSlug], 2);
            });
            return p;
        }

        createEpic(organizationSlug, projectSlug, properties) {
            var newEpic = new this.Epic();
            _.extend(newEpic, properties);
            if ("id" in newEpic) {
                delete newEpic.id;
            }

            var p = newEpic.$create({ projectSlug: projectSlug, organizationSlug: organizationSlug });
            p.then((epic) => {
                this.recordEpic(projectSlug, epic);
                this.addIndents(this.epicsByProject[projectSlug], 2);
            });
            return p;
        }

        track(projectSlug, epic) {
            this.recordEpic(projectSlug, epic);
            if (projectSlug in this.epicsByProject) {
                return this.addIndents(this.epicsByProject[projectSlug], 2);
            }
        }

        
        loadEpic(organizationSlug, projectSlug, epicId) {
            var deferred;
            var existing = _.findWhere(this.epicsByProject[projectSlug], { id: epicId });
            if (existing != null) {
                deferred = this.q.defer();
                deferred.resolve(existing);
                return deferred.promise;
            } else {
                return this.Epic.load({ organizationSlug: organizationSlug, projectSlug: projectSlug, id:epicId }).$promise;
            }
        }

        private cachedEpicLoads = {};
        loadEpics(organizationSlug, projectSlug) {
            let key = organizationSlug + ":" + projectSlug;
            if (key in this.cachedEpicLoads) {
                return this.cachedEpicLoads[key];
            } else {
                var p = this.Epic.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
                p.then((epics) => {
                    this.addIndents(epics, 2);
                    this.epicsByProject[projectSlug] = epics;
                    for (var i = 0, len = epics.length; i < len; i++) {
                        let epic:Epic = epics[i];
                        this.epics[epic.id] = epic;
                    }
                });
                this.cachedEpicLoads[key] = p;
                return p;
            }
        }

        loadEpicStats(organizationSlug, projectSlug, epic_id = null) {
            var p;
            if(epic_id == null){
                p = this.EpicStats.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
            }else{
                p = this.EpicStats.query({ organizationSlug: organizationSlug, projectSlug: projectSlug, id: epic_id }).$promise;
            }
            return p;
        }

        sortKey(epic, epics) {
            /*
            Returns a key useful for sorting epics in their hierarchy:
            E1   1      001
              E2  1     001001
              E3  2     001002
                E4  1   001002001
            E5   2      002
            E6   3      003
              E7  1     003001

            Also, we will tack on the ID of the epic at the very end of the rank.This fixes
                a bug if multiple epics have the same rank (which shouldn't happen, but
                I've seen it a couple times now)
            */

            var rv = "";
            var id = epic.id;
            while (epic != null) {
                rv = pad(epic.order, 6) + pad(epic.id, 6) + rv;
                epic = _.findWhere(epics, { id: epic.parent_id });
            }

            return rv;
        }

        addIndents(source, count = 2) {
            // Sorts and creates indent & indentedSummary fields on the epics so we can render
            // a pretty indented list of epics.
            var epic, compare, ref;
            for (var i = 0, len = source.length; i < len; i++) {
                epic = source[i];
                epic.sortKey = this.sortKey(epic, source);
            }
            compare = function(a, b) {
                if (a.sortKey < b.sortKey) {
                    return -1;
                }
                if (a.sortKey > b.sortKey) {
                    return 1;
                }
                return 0;
            };

            source.sort(compare);
            ref = _.filter(source, (e) => e['parent_id'] === null);
            for (var i = 0, len = ref.length; i < len; i++) {
                epic = ref[i];
                this.indentEpic(source, epic, 0, count);
            }
            return;
        }

        indentEpic(source, epic, current, count) {
            epic.indent = Array((current + 1) * count).join(this.indentCharacter);
            epic.htmlIndentedSummary = this.sce.trustAsHtml((Array((current + 1) * count).join("&nbsp;")) + (epic.indent + "#E" + epic.number + " " + epic.summary));
            epic.indentedSummary = epic.indent + "#E" + epic.number + " " + epic.summary;

            var children = _.filter(source, (e) => e['parent_id'] == epic.id);
            for (var i = 0, len = children.length; i < len; i++) {
                var child = children[i];
                this.indentEpic(source, child, current + 1, count);
            }
        }
        
        // Takes a flat epics list and returns a nested version with a new "children" property on each.
        toNested(epics) {
            trace("epicManager::toNested");
            var result = [];
            var ref = _.filter(epics, (e) => e['parent_id'] === null);
            for (var i = 0, len = ref.length; i < len; i++) {
                var epic = ref[i];
                result.push(epic);
                this.nest(epics, epic);
            }
            this.nestedEpics = result;
            return result;
        }

        nest(epics, epic) {
            epic.children = [];
            var ref = _.filter(epics, (e) => e['parent_id'] === epic.id);
            for (var i = 0, len = ref.length; i < len; i++) {
                var child = ref[i];
                epic.children.push(child);
                this.nest(epics, child);
            }
        }
    }
}
