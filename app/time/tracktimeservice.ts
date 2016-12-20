/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TrackTimeService {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$uibModal",
            "urlRewriter",
            "timeManager",
            "$rootScope"
        ];

        private dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            public organizationSlug: string,
            public modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter,
            private timeManager: TimeManager,
            private rootScope) {

        }

        trackTimeOnStory(project, iteration, story, projects) {
            if (this.rootScope.projectList != null) {
                projects = this.rootScope.projectList;
            } else {
                projects = null;
            }

            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("time/tracktimewindow.html"),
                controller: 'TrackTimeWindowController',
                controllerAs: 'ctrl',
                keyboard: true,
                resolve: {
                    story: () => story,
                    project: () => project,
                    iteration: () => iteration,
                    projects: () => projects,
                }
            });
            return this.dialog;
        }
    }
}