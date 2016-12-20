/// <reference path='../_all.ts' />

module scrumdo {
    export class EpicWindowService {
        public static $inject: Array<string> = [
            "organizationSlug",
            "projectSlug",
            "$uibModal",
            "urlRewriter",
            "epicManager",
            "userService"
        ];

        private dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            private organizationSlug: string,
            private projectSlug: string,
            public modal: ng.ui.bootstrap.IModalService,
            private urlRewriter,
            private epicManager: EpicManager,
            private userService) {

        }

        reorderEpics(project, nestedEpics, flatEpics) {
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("epic/epicreorderwindow.html"),
                controller: 'EpicReorderWindowController',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    project: () => project,
                    nestedEpics: () => nestedEpics,
                    flatEpics: () => flatEpics
                }
            });
        }

        editEpic(project, epic, epics) {
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("epic/epicwindow.html"),
                controller: 'EpicWindowController',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    epic: () => epic,
                    project: () => project,
                    user: () => this.userService.me,
                    epics: () => epics
                }
            });
        }

        createEpic(project, initialParams = {}, epics) {
            var epic = _.extend({
                archived: false,
                short_name: "",
                detail_html: "",
                number: -1,
                detail: "",
                parent_id: null,
                points: "?",
                story_count: 0,
                id: -1,
                summary: "",
                order: 0
            }, initialParams);

            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("epic/epicwindow.html"),
                controller: 'EpicWindowController',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    epic: () => epic,
                    project: () => project,
                    user: () => this.userService.me,
                    epics: () => epics
                }
            });
        }
    }
}