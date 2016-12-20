/// <reference path='../_all.ts' />

module scrumdo {
    export class EpicWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "epic",
            "project",
            "user",
            "epics",
            "epicManager",
            "organizationSlug",
            "confirmService",
            "mixpanel",
            "alertService"
        ];

        private parent;

        constructor(
            private scope,
            private epic,
            private project,
            private user,
            private epics,
            private epicManager: EpicManager,
            private organizationSlug: string,
            private confirmService: ConfirmationService,
            public mixpanel,
            public alertService: AlertService) {

            this.scope.ctrl = this;
            this.scope.busyMode = false;
            this.scope.epic = angular.copy(this.epic);
            if (this.epic.parent_id && this.epic.parent_id !== -1) {
                this.parent = _.findWhere(this.epics, { id: epic.parent_id });
            } else {
                this.parent = null;
            }
        }

        deleteEpic() {
            if(this.scope.epic.children.length > 0){
                this.alertService.alert("Parent Collection", "You cannot delete the Collection having child collections.");
            }else{
                this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this collection?", "No", "Yes").then(this.onDeleteConfirm);
            }
        }

        onDeleteConfirm = () => {
            this.scope.busyMode = true;
            this.epicManager.deleteEpic(this.organizationSlug, this.project.slug, this.epic).then(this.onEpicDeleted);
        }

        save() {
            this.scope.busyMode = true;
            angular.copy(this.scope.epic, this.epic);
            if ((this.parent != null) && (this.parent.id != null)) {
                this.epic.parent_id = this.parent.id;
            } else {
                if ((this.epic.id != null) && this.epic.id !== -1) {
                    this.epic.parent_id = null;
                }
            }

            if ((this.epic.id != null) && this.epic.id !== -1) {
                this.epicManager.saveEpic(this.organizationSlug, this.project.slug, this.epic).then(this.onEpicSaved);
            } else {
                this.epicManager.createEpic(this.organizationSlug, this.project.slug, this.epic).then(this.onEpicCreated);
                this.mixpanel.track('Create Epic', {
                    subepic: (this.parent != null) && (this.parent.id != null)
                });
            }
        }

        onEpicDeleted = (epic) => {
            this.scope.$dismiss('deleted', epic);
        }

        onEpicCreated = (epic) => {
            this.scope.$dismiss('created', epic);
        }

        onEpicSaved = (epic) => {
            this.scope.$dismiss('saved', epic);
        }

    }
}