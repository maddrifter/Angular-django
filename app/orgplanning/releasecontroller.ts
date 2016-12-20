/// <reference path='../_all.ts' />

module scrumdo {
    export class ReleaseController {
        public static $inject: Array<string> = [
            "$stateParams",
            "$scope",
            "storyManager",
            "confirmService",
            "$state",
            "storyEditor",
            "releaseStatManager",
            "organizationSlug"
        ];

        private stats;
        private currentStats;

        constructor(
            private $stateParams: ng.ui.IStateParamsService,
            private scope,
            private storyManager,
            public confirmService: ConfirmationService,
            private state: ng.ui.IStateService,
            private storyEditor,
            private releaseStatManager,
            public organizationSlug: string) {

            this.scope.$watch("releasesCtrl.currentRelease.id", this.loadStats);
        }

        loadStats = () => {
            var ref;
            if (((ref = this.scope.releasesCtrl) != null ? ref.currentRelease : void 0) != null) {
                this.releaseStatManager.loadStats(this.organizationSlug, this.scope.releasesCtrl.currentRelease.id).then(this.onStatsLoaded);
            }
        }

        onStatsLoaded = (stats) => {
            this.stats = stats;
            if (stats.length > 0) {
                this.currentStats = stats[stats.length - 1];
            } else {
                this.currentStats = {
                    'cards_total': 0,
                    'cards_completed': 0,
                    'cards_in_progress': 0
                };
            }
        }

        editRelease(release, project) {
            this.storyEditor.editStory(release, project, false, true);
        }

        deleteRelease(release) {
            this.confirmService.confirm("Are you sure?", "Do you wish to completely remove this release?", 'No', 'Yes').then(() => {
                this.storyManager.deleteStory(release);
                this.state.go('releases');
            });
        }
    }
}