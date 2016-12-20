/// <reference path='../_all.ts' />

module scrumdo {
    export class GithubProjectController {
        public static $inject: Array<string> = [
            "$scope",
            "$state",
            "boardProject",
            "githubExtraManager",
            "alertService"
        ];


        private githubImport: {
            name: string,
            commit_messages: boolean,
            upload_issues: boolean,
            download_issues: boolean,
            close_on_delete: boolean
        };
        private cellNames:Array<string>;
        private extraConfig;

        constructor(
            private scope,
            private state,
            public boardProject,
            private githubExtraManager: GithubExtraManager,
            public alertService: AlertService) {

            this.githubExtraManager.loadProject(this.boardProject.projectSlug).then((result) => {
                this.onLoaded(result);
                this.loadBoardCells();
            });
            this.githubImport = {
                name: '',
                commit_messages: true,
                upload_issues: false,
                download_issues: false,
                close_on_delete: false
            };
        }

        loadBoardCells() {
            this.cellNames = (function() {
                var i, len, ref, results;
                ref = this.boardProject.boardCells;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var cell = ref[i];
                    results.push(cell.label);
                }
                return results;
            }).call(this);

            this.cellNames = _.uniq(this.cellNames.concat((function() {
                var i, len, ref, results;
                ref = this.boardProject.boardCells;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var cell = ref[i];
                    results.push(cell.full_label);
                }
                return results;
            }).call(this)));
        }

        removeBinding(bindingId) {
            this.githubExtraManager.removeRepoFromProject(this.boardProject.projectSlug, bindingId).then((result) => {
                this.extraConfig = result.data;
            });
        }

        addRepo(config) {
            this.githubExtraManager.addRepoToProject(this.boardProject.projectSlug, config).then((result) => {
                this.extraConfig = result.data;
            });
        }

        onLoaded = (result) => {
            this.extraConfig = result
        }
    }
}