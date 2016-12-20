/// <reference path='../../_all.ts' />

module scrumdo {
    export class SettingsController {
        public static $inject: Array<string> = [
            "$scope",
            "$state",
            "confirmService",
            "organizationSlug",
            "API_PREFIX",
            "$http",
            "$uibModal",
            "urlRewriter",
            "projectManager",
            "alertService",
            "projectDatastore"
        ];

        private organization;
        private showForceSync: boolean;
        private state;
        private projectname: string;
        private busyMode: boolean;
        private project;

        constructor(
            private scope,
            private stateProvider: ng.ui.IStateService,
            public confirmService: ConfirmationService,
            private organizationSlug: string,
            private API_PREFIX,
            public http: ng.IHttpService,
            public modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter,
            private projectManager,
            public alertService: AlertService,
            public projectData: ProjectDatastore) {

            this.scope.$on('$stateChangeStart', this.onStateChange);
            this.scope.adminUrl = "/projects/project/" + projectData.currentProject.slug + "/admin";
            this.scope.deleteUrl = "/projects/project/" + projectData.currentProject.slug + "/delete/";
            this.state = stateProvider.current.name;
            this.showForceSync = true;
            http.get(API_PREFIX + "organizations/" + organizationSlug).then((result) => {
                this.organization = result.data;
            });
            this.projectname = "";
            this.scope.ctrl = this;
            this.scope.$root.currentProject = this.projectData.currentProject;
        }

        forceSync() {
            this.showForceSync = false;
            var payload = {
                action: 'forceSync'
            }
            this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + this.projectData.currentProject.slug + "/extras/github", payload);
        }

        onStateChange = (event, toState, toParams, fromState, fromParams) => {
            this.state = toState.name;
        }

        archive() {
            if(this.projectData.currentProject.project_type == 2){
                this.alertService.warn("Archive Portfolio", "This is a Portfolio. Archiving this Portfolio \
                    will also archive all the Workspaces in this portfolio.").then(this.onConfirmArchive);
            }else{
                this.onConfirmArchive();
            }
        }

        moveProject() {
            if(this.projectData.currentProject.project_type == 2){
                this.alertService.warn("Move Portfolio", "This is a Portfolio. Moving this Portfolio to another organization \
                    will also move all the Workspaces in this portfolio.").then(this.onConfirmMoveProject);
            }else{
                if(this.projectData.currentProject.portfolio_id != null){
                    this.alertService.warn("Move Portfolio Workspace", "This Workspace is in a Portfolio. Moving this Workspace to another \
                    organization would remove it from the Portfolio. It will also remove the relationship to its parent and child \
                    workspaces.").then(this.onConfirmMoveProject);
                }else{
                    this.onConfirmMoveProject();
                }
            }
        }

        onConfirmArchive = () => {
            this.confirmService.confirm("Archive Workspace?", "Are you sure you want to archive this workspace?", "No", "Yes", "secondary").then(() => {
                $("#archiveForm").submit();
            });
        }

        onConfirmMoveProject = () => {
            this.confirmService.confirm("Move Workspace?", "Are you sure you want to move this workspace?", "No", "Yes", "secondary").then(() => {
                $("#moveForm").submit();
            });
        }

        rebuildReports() {
            $("#rebuildForm").submit();
        }

        updateIndexes() {
            $("#updateIndexForm").submit();
        }

        resetBurnup() {
            this.confirmService.confirm("Reset burnup data?", "Are you sure you want to reset the burnup data on this workspace?", "No", "Yes", "secondary").then(() => {
                $("#resetForm").submit();
            });
        }

        deleteProject() {
            if(this.projectData.currentProject.project_type == 2){
                this.alertService.warn("Delete Portfolio", "This is a Portfolio. Deleting this Portfolio \
                    will also delete all the Workspaces in this portfolio.").then(this.onDeleteConfirm);
            }else{
                if(this.projectData.currentProject.portfolio_id != null){
                    this.alertService.warn("Delete Portfolio Workspace", "This Workspace is in a Portfolio. Deleting this Workspace \
                    would remove it from the Portfolio. It will also remove the relationship to its parent and child \
                    workspaces.").then(this.onDeleteConfirm);
                }else{
                    this.onDeleteConfirm();
                }
            }
        }

        onDeleteConfirm = () => {
            this.confirmService.confirm("Delete Workspace?", "Are you sure you want to delete this workspace?", "Cancel", "Delete Workspace", "tertiary").then(() => {
                this.confirmDelete();
            });
        }

        confirmDeleteProject() {
            this.busyMode = true;
            $("#deleteForm").submit();
        }

        confirmDelete() {
            this.projectname = "";
            this.projectManager.loadProject(this.organizationSlug, this.projectData.currentProject.slug).then((result) => {
                this.project = result;
                var dialog: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                    templateUrl: this.urlRewriter.rewriteAppUrl("board/settings/projectdeleteconfirm.html"),
                    scope: this.scope,
                    size: "",
                    backdrop: "static",
                    keyboard: false
                });
                return dialog;
            });
        }

        filterUserOrgs = (obj) => {
            if(obj.slug == this.organizationSlug){
                return false;
            }
            return true;
        }
    }
}