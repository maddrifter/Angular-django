/// <reference path='../_all.ts' />

module scrumdo {
    export class IterationWindowService {
        public static $inject: Array<string> = [
            "iterationManager",
            "$uibModal",
            "urlRewriter"
        ];

        private dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            private iterationManager: IterationManager,
            private modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter) {

        }

        createIteration(organizationSlug: string, projectSlug: string, initialParams, windowType = "iteration") {
            var iteration = _.extend({
                hidden: false,
                include_in_velocity: true,
                locked: false,
                name: "",
                default_iteration: false,
                id: -1,
                iteration_type: 1,
                end_date: null,
                start_date: null
            }, initialParams);

            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("iteration/iterationwindow.html"),
                controller: 'IterationWindowController',
                size: "md",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    projectSlug: () => projectSlug,
                    iteration: () => iteration,
                    windowType: () => windowType
                }
            });
            return this.dialog;
        }

        editIteration(organizationSlug: string, projectSlug: string, iteration, windowType = "iteration") {
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("iteration/iterationwindow.html"),
                controller: 'IterationWindowController',
                size: "md",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    projectSlug: () => projectSlug,
                    iteration: () => iteration,
                    windowType: () => windowType
                }
            });
            return this.dialog;
        }
    }
}