/// <reference path='../_all.ts' />

module scrumdo {
    import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
    import IModalService = angular.ui.bootstrap.IModalService;


    export class ProjectPickerService {
        public static $inject:Array<string> = [
            "$uibModal",
            "urlRewriter",
            "$q",
            "projectManager",
            "organizationSlug"
        ];

        protected dialog:IModalServiceInstance;

        constructor(private $modal:IModalService,
                    private urlRewriter:URLRewriter,
                    private $q:ng.IQService,
                    private projectManager:ProjectManager,
                    private organizationSlug:string) {

        }


        public pickProject() {
            return this.projectManager.loadProjectsForOrganization(this.organizationSlug)
                .then((projects) => {
                    this.dialog = this.$modal.open({
                        templateUrl: this.urlRewriter.rewriteAppUrl("project/projectpickerwindow.html"),
                        windowClass: 'project-picker-window',
                        controller: 'ProjectPickerWindowController',
                        controllerAs: 'ctrl',
                        size: "md",
                        backdrop: "static",
                        keyboard: true,
                        resolve: {
                            projects: () => projects
                        }
                    });

                    return this.dialog.result;
                });
        }
    }
}