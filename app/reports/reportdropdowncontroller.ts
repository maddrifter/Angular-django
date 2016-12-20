/// <reference path='../_all.ts' />

module scrumdo {

    import IModalService = angular.ui.bootstrap.IModalService;
    import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

    interface ReportDropdownScope extends ng.IScope {
        project:Project;
    }

    export class ReportDropdownController {
        public static $inject:Array<string> = ["$scope",
                                               "organizationSlug",
                                               "savedReportManager",
                                               "$uibModal",
                                               "urlRewriter"];
        public savedReports:Array<any> = [];

        constructor(protected $scope:ReportDropdownScope,
                    protected organizationSlug:string,
                    protected savedReportManager:SavedReportManager,
                    protected $modal:IModalService,
                    protected urlRewriter:URLRewriter) {
                       
        }

        public loadSavedReports() {
            if(this.savedReports.length == 0) {
                this.savedReports = this.savedReportManager.loadSavedReports(this.organizationSlug, this.$scope.project.slug);
            }

        }

        public onLoadReport(report:SavedReport) {
            var dialog:IModalServiceInstance = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("reports/savedreportpopup.html"),
                controller: 'SavedReportPopupController',
                windowClass: 'saved-report-window',
                controllerAs: 'ctrl',
                size: "lg",
                scope: this.$scope,
                backdrop: "static",
                keyboard: true,
                resolve: {
                    project: () => this.$scope.project,
                    report: function(){return report;}
                }
            });
        }

    }
}