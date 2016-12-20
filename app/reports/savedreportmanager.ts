/// <reference path='../_all.ts' />

module scrumdo {


    import IResourceArray = angular.resource.IResourceArray;

    export interface SavedReport extends ng.resource.IResource<SavedReport>  {
        id: number;
        name: string;
        report_type:string;
        iteration_id: number;
        date_format: number;
        cfd_show_backlog: boolean;
        enddate: string;
        aging_tags: string;
        startdate: string;
        views: number;
        burn_type: number;
        lead_end_step_id: number;
        interval: number;
        last_generated: string;
        aging_type: number;
        workflow_id: number;
        tag: string;
        y_axis: number;
        lead_start_step_id: number;
        project_id: number;
        creator: User;
        label_id: number;
        epic_id: number;
        assignee_id: number;
    }

    interface SavedReportResource extends ng.resource.IResourceClass<SavedReport> {
    }



    export class SavedReportManager {
        public static $inject:Array<string> = ["$resource",
                                               "API_PREFIX",
                                               "$q",
                                               "reportManager"];

        protected savedReportApi:SavedReportResource;
        protected runSavedReportApi:any;

        constructor(public resource:ng.resource.IResourceService,
                    public API_PREFIX:string,
                    public $q:ng.IQService,
                    protected reportManager) {
            // /api/v3/organizations/scrumdo/projects/scrumdo/saved_report
            this.savedReportApi = <SavedReportResource> this.resource(API_PREFIX +
                "organizations/:organizationSlug/projects/:projectSlug/saved_report/:reportId",
                {
                    reportId: "@id",
                });

            this.runSavedReportApi = this.resource(API_PREFIX +
                "organizations/:organizationSlug/projects/:projectSlug/saved_report/:reportId/run/:iterationId",
                {
                    reportId: "@id",
                });
        }

        public deleteSavedReport(organizationSlug:string, projectSlug:string, report:SavedReport) {
            return report.$delete({organizationSlug:organizationSlug, projectSlug:projectSlug});
        }

        public loadSavedReports(organizationSlug:string, projectSlug:string):IResourceArray<SavedReport> {
            return this.savedReportApi.query({organizationSlug:organizationSlug, projectSlug:projectSlug})
        }
        
        public loadReport(organizationSlug: string, projectSlug: string, report: SavedReport, isRefreshed: boolean, iterationId: number = null) {
            var r = this.runSavedReportApi.get({ organizationSlug: organizationSlug, projectSlug: projectSlug, reportId: report.id, iterationId: iterationId, refresh: isRefreshed });
            if (report.report_type == 'burn') {
                r.$promise.then((data) => {
                    this.reportManager.normalizeData(data);
                })
            }
            return r
        }

        public createReport(organizationSlug:string, projectSlug:string, report:any):SavedReport {
            return this.savedReportApi.save({organizationSlug:organizationSlug, projectSlug:projectSlug}, report);
        }
        
        public getReportManager(){
            return this.reportManager;
        }
    }
}