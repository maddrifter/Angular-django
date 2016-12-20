/// <reference path='../_all.ts' />

module scrumdo {
    export class ReleasesController {
        public static $inject: Array<string> = [
            "$scope",
            "projectManager",
            "organizationSlug",
            "storyManager",
            "storyEditor",
            "$stateParams",
            "confirmService",
            "$state"
        ];

        private project;
        private releases;
        private currentRelease;

        constructor(
            private scope,
            private projectManager,
            public organizationSlug: string,
            private storyManager,
            private storyEditor,
            private stateParams: ng.ui.IStateParamsService,
            private confirmService: ConfirmationService,
            private state: ng.ui.IStateService) {

            this.scope.$on('$stateChangeStart', this.onStateChange);
            this.projectManager.loadProject(this.organizationSlug, "__releases__").then((project) => {
                this.project = project;
                this.loadCards();
            });
        }

        loadCards() {
            var backlogId = this.project.kanban_iterations.backlog;
            this.storyManager.loadIteration(this.project.slug, backlogId).then((stories) => {
                this.releases = stories;
                if ('id' in this.state.params) {
                    this.setCurrentRelease(this.state.params);
                } else {
                    if (this.releases.length > 0) {
                        this.state.go('app.releases.release', {
                            id: this.releases[0].id
                        });
                    }
                }
            });
        }

        newRelease() {
            this.storyEditor.createStory(this.project, {}, true).result.then((release) => {
                if (typeof release !== "undefined" && release !== null) {
                    this.state.go("app.releases.release", {
                        id: release.id
                    });
                }
            });
        }

        setCurrentRelease(params) {
            this.currentRelease = _.findWhere(this.releases, { id: parseInt(params.id) });
        }

        onStateChange = (event, toState, toParams, fromState, fromParams) => {
            if (toState.name === 'app.releases.release') {
                this.setCurrentRelease(toParams);
            } else {
                this.currentRelease = null;
            }
        }
    }
}