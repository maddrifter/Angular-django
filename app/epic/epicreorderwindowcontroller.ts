/// <reference path='../_all.ts' />

module scrumdo {
    export class EpicReorderWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "nestedEpics",
            "flatEpics",
            "epicManager",
            "organizationSlug",
            "projectSlug"
        ];

        private sortables: Array<any>;
        private dirty: boolean;
        private busyMode: boolean;
        private epicsToSave:Array<any>;
        private saveCount:number;

        constructor(
            private scope,
            private nestedEpics,
            private flatEpics,
            private epicManager: EpicManager,
            private organizationSlug: string,
            private projectSlug: string) {

            this.scope.ctrl = this;
            this.sortables = [];
            this.nestedEpics = angular.copy(this.nestedEpics);
            this.sortChildren(this.nestedEpics);
            this.scope.$watch("ctrl.nestedEpics", true)(() => this.dirty = true);
            this.dirty = false;
            this.busyMode = false;
        }

        sortChildren(epics) {
            epics.sort(function(a, b) { return a.order - b.order; });
            for (var i = 0, len = epics.length; i < len; i++) {
                var epic = epics[i];
                this.sortChildren(epic.children);
            }
        }

        save() {
            this.epicsToSave = [];
            this.checkEpicsToSave(this.nestedEpics, null);
            this.busyMode = true;
            this.saveCount = this.epicsToSave.length;
            this.saveNext();
        }

        saveNext = () => {
            if (this.epicsToSave.length === 0) {
                this.scope.$dismiss("saved");
                return;
            }
            var epic = this.epicsToSave.shift();
            this.epicManager.saveEpic(this.organizationSlug, this.projectSlug, epic).then(this.saveNext);
        }

        checkEpicsToSave(epics, parentId) {
            var lastOrder: number = -1;
            var dirty, epic, i, len, original;

            for (i = 0, len = epics.length; i < len; i++) {
                epic = epics[i];
                dirty = false;
                original = _.findWhere(this.flatEpics, {
                    id: epic.id
                });
                if (original.order > lastOrder) {
                    lastOrder = original.order;
                } else {
                    lastOrder += 1;
                    original.order = lastOrder;
                    epic.order = lastOrder;
                    dirty = true;
                }
                if (original.parent_id !== parentId) {
                    original.parent_id = parentId;
                    dirty = true;
                }
                if (dirty) {
                    this.epicsToSave.push(original);
                }
                if ((epic.children != null) && epic.children.length > 0) {
                    this.checkEpicsToSave(epic.children, epic.id);
                }
            }
        }
    }
}