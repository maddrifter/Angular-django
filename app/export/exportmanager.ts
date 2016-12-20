/// <reference path='../_all.ts' />

module scrumdo {
    export class ExportManager {
        public static $inject: Array<string> = [
            "$http",
            "API_PREFIX",
            "urlRewriter",
            "$sce",
            "$uibModal",
            "organizationSlug"
        ];

        constructor(
            public http: ng.IHttpService,
            public API_PREFIX: string,
            public urlRewriter,
            public sce: ng.ISCEService,
            public modal: ng.ui.bootstrap.IModalService,
            public organizationSlug: string) {

        }

        checkJob(jobId) {
            return this.http.get(this.API_PREFIX + "job/" + jobId);
        }

        exportProject(projectSlug, filename) {
            if (filename == null || filename == "") {
                filename = "export";
            }
            var data = { filename: filename };
            return this.http.post(API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/export/", data);
        }

        exportIteration(projectSlug, iterationId, filename) {
            if (filename == null || filename == "") {
                filename = "export";
            }
            var data = { filename: filename };
            return this.http.post(API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/export/" + iterationId, data);
        }

        exportTeamPlanning(projectSlug, iterationId, teamSlug, filename){
            if (filename == null || filename == "") {
                filename = "export";
            }
            var data = { filename: filename };
            return this.http.post(API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/export/" + iterationId + "/planning/" + teamSlug, data);
        }

        startProjectExport(project) {
            var modalInstance: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("export/exportdialog.html"),
                controller: 'ExportDialogController',
                backdrop: 'static',
                resolve: {
                    project: () => project,
                    exportType: () => "Workspace",
                    iterationId: () => -1,
                    team: () => null,
                }
            });
        }

        startIterationExport(project, iterationId) {
            var modalInstance: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("export/exportdialog.html"),
                controller: 'ExportDialogController',
                backdrop: 'static',
                resolve: {
                    project: () => project,
                    exportType: () => "Iteration",
                    iterationId: () => iterationId,
                    team: () => null,
                }
            });
        }

        startTeamPlanningExport(project, team, iterationId) {
            console.log(team)
            var modalInstance: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("export/exportdialog.html"),
                controller: 'ExportDialogController',
                backdrop: 'static',
                resolve: {
                    project: () => project,
                    exportType: () => "Team Planning",
                    team: () => team,
                    iterationId: () => iterationId
                }
            });
        }

        startIterationImport(project, iterationId) {
            var modalInstance: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("export/importdialog.html"),
                controller: 'ImportDialogController',
                backdrop: 'static',
                resolve: {
                    project: () => project,
                    iterationId: () => iterationId
                }
            });
        }
    }
}