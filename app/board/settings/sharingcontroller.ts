/// <reference path='../../_all.ts' />

module scrumdo {
    export class SharingController {
        public static $inject: Array<string> = [
            "$scope",
            "boardProject",
            "sharingManager"
        ];

        private shares: Array<any>;
        private selectedIteration;

        constructor(
            private scope,
            private boardProject,
            private sharingManager:SharingManager) {

            this.shares = [];
            if ((this.boardProject.iteration != null) && this.boardProject.iteration.length > 0) {
                this.selectedIteration = this.boardProject.iterations[0];
            }
            this.sharingManager.loadShares(this.boardProject.projectSlug).then(this.onSharesLoaded);
        }

        updateShare(share, form) {
            this.sharingManager.updateShare(share, this.boardProject.projectSlug).then(() => {
                form.$setPristine();
            });
        }

        unshare(share) {
            this.sharingManager.deleteShare(share, this.boardProject.projectSlug);
            var i: number = this.shares.indexOf(share);
            this.shares.splice(i, 1);
        }

        shareIteration() {
            var share = {
                iteration_id: this.selectedIteration.id,
                enabled: true,
                all_cards: false,
                tag: 'public'
            }
            this.sharingManager.createShare(share, this.boardProject.projectSlug).then(this.onShareCreated);
        }
        
        onSharesLoaded = (result) => {
            this.shares = result;
        }
        
        onShareCreated = (result) => {
            this.shares.push(result);
        }
    }
}