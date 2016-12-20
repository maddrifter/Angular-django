/// <reference path='../_all.ts' />

module scrumdo {

    interface SavedReportPopupScope extends ng.IScope {
        iterations: Array<Iteration>;
        selectedIteration: Iteration;
    }


    export class SavedReportPopupController {

        public static $inject: Array<string> = ["$scope", "savedReportManager", "organizationSlug", "project", "report"];

        public loading: boolean = true;
        public cfdReportData: any = null;
        public burnReportData: any = null;
        public leadReportData: any = null;
        public agingReportData: any = null;
        public blockersClusterData: any = null;
        public blockersFreqData: any = null;
        public blockersReportData: any = null;
        public reportData: any = null;
        public workflow: Workflow;
        public allIterations: boolean;
        public isRefreshed: boolean;
        public selectedIteration: Iteration;
        public reportsLocked: boolean;

        constructor(protected $scope: SavedReportPopupScope,
            protected savedReportManager: SavedReportManager,
            protected organizationSlug: string,
            protected project: Project,
            public report: SavedReport) {
            this.allIterations = !report.iteration_id;
            if (!this.allIterations && this.$scope.iterations.length > 0) {
                this.selectedIteration = this.$scope.selectedIteration;
            }
            this.isRefreshed = false;
            this.loadReport();
        }

        public iterationChanged() {
            this.loadReport();
        }

        public loadReport() {
            if (this.allIterations || !this.selectedIteration) {
                this.savedReportManager.loadReport(this.organizationSlug,
                    this.project.slug,
                    this.report, this.isRefreshed).$promise.then(this.onLoaded);
            } else {
                this.savedReportManager.loadReport(this.organizationSlug,
                    this.project.slug,
                    this.report,
                    this.isRefreshed, this.selectedIteration.id
                ).$promise.then(this.onLoaded);
            }
        }

        public onLoaded = (result) => {
            this.loading = false;
            this.reportData = result;
            console.log(this.reportData)
            this.reportsLocked = false;
            switch (result.report_type) {
                case 'lead':
                    this.reportsLocked = result.locked !=null ? true: false; 
                    this.leadReportData = result.data;
                    break;
                case 'cfd':
                    this.reportsLocked = result.locked !=null ? true: false; 
                    this.cfdReportData = result.data.data;
                    break;
                case 'aging':
                    this.reportsLocked = result.locked !=null ? true: false; 
                    this.agingReportData = result;
                    break;
                case 'burn':
                    this.burnReportData = result;
                    break;
                case 'block':
                    this.blockersClusterData = result;
                    break;
                case 'blockfreq':
                    this.blockersFreqData = result;
                    break;
                case 'blocklist':
                    this.blockersReportData = result;
                    break;
            }
            console.log(this.reportsLocked);
        }

        public getReportManager() {
            return this.savedReportManager.getReportManager();
        }

        public getReportFilters() {
            var filters = {
                enddate: this.report.enddate,
                startdate: this.report.startdate,
                tag: this.report.tag,
                label: this.report.label_id,
                assignee: this.report.assignee_id,
                epic: this.report.epic_id
            }
            return filters;
        }

        public refreshSavedReport = () => {
            this.isRefreshed = true;
            this.loadReport();
        }

    }
}