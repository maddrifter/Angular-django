/// <reference path='../_all.ts' />

module scrumdo {
    export class ProjectSummaryController {
        public static $inject:Array<string> = ["$scope",
                                               "organizationSlug",
                                               "boardCellManager",
                                               "boardHeadersManager",
                                               "reportManager",
                                               "iterationManager",
                                               "$window"];

        public loading:boolean = true;



        public cfdData:any;
        public leadData:any;
        public iterations:Array<Iteration>;

        public project:Project;

        constructor($scope, organizationSlug:string,
                    boardCellManager, boardHeadersManager,
                    reportManager, iterationManager,
                    private $window:ng.IWindowService) {

            this.project = $scope.gctrl.project;


            var reportOptions = {
                cfd_show_backlog: false,
                detail: false,
                enddate: moment().format("YYYY-MM-DD"),
                startdate: moment().subtract(1, 'months').format("YYYY-MM-DD"),
                interval: -1
                //&yaxis=1
                //interval=1,
                //lead_end_step:=142945
                //lead_start_step=142937
            }

            iterationManager.loadCurrentIterations(organizationSlug, this.project.slug).then( (result) => {
                this.iterations = result;
            });

            reportManager.loadCFD(organizationSlug, this.project.slug, -1, reportOptions).then( (result) => {
                this.cfdData = result.data.data
            });

            reportManager.loadLead(organizationSlug, this.project.slug, -1, reportOptions).then( (result) => {
                this.leadData = result.data
            });



        }

        public goToCFD() {
            this.$window.location.href = `/projects/${this.project.slug}#/reports/cfd`;

        }

        public goToLead() {
            this.$window.location.href = `/projects/${this.project.slug}#/reports/lead_time`;
        }

    }
}