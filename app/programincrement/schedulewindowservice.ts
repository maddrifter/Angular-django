/// <reference path='../_all.ts' />

module scrumdo {
    export class IncrementScheduleWindowService {
        public static $inject: Array<string> = [
            "programIncrementManager",
            "$uibModal",
            "urlRewriter"
        ];

        private dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            private programIncrementManager: ProgramIncrementManager,
            private modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter) {

        }

        createSchedule(organizationSlug: string, projectSlug: string, iterationId:number, increment, initialParams) {
            var incrementSchedule = _.extend({
                default_name: "",
                id: -1,
                end_date: null,
                start_date: null
            }, initialParams);

            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("programincrement/schedulewindow.html"),
                controller: 'IncrementScheduleWindowController',
                size: "md",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    projectSlug: () => projectSlug,
                    iterationId: () => iterationId,
                    increment: () => increment,
                    incrementSchedule: () => incrementSchedule 
                }
            });
            return this.dialog;
        }
    }
}