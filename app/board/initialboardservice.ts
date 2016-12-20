/// <reference path='../_all.ts' />

// This service handles the case when the user has loaded up a completely empty board and it's time
// for them to choose what to do with it.

module scrumdo {
    export class InitialBoardService {
        public static $inject: Array<string> = [
            "boardProject",
            "urlRewriter",
            "$uibModal"
        ];

        public dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            public boardProject,
            public urlRewriter: URLRewriter,
            public modal: ng.ui.bootstrap.IModalService) {

        }

        startInitializeWizard() {
            this.boardWizard();  // Let's try forcing the wizard.
            /*
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("board/welcomedialog.html"),
                windowClass: "scrumdo-modal primary welcome fade",
                controller: "WelcomeDialogController",
                controllerAs: "ctrl",
                backdrop: "static",
                keyboard: false
            });
            */
            this.dialog.result.then(this.dialogClosed);
        }

        dialogClosed = (action) => {
            if (action === 'wizard') {
                this.boardWizard();
            } else if (action === 'template') {
                this.templatePicker();
            } else if (action === 'reset') {
                this.startInitializeWizard();
            }
        }

        templatePicker() {
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("boardwizard/boardtemplatepicker.html"),
                windowClass: "scrumdo-modal primary board-wizard",
                controller: "BoardTemplatePickerController",
                controllerAs: "ctrl",
                backdrop: "static",
                keyboard: false,
                windowTemplateUrl: this.urlRewriter.rewriteAppUrl("boardwizard/boardwizardholder.html")
            });

            this.dialog.result.then(this.dialogClosed);
        }

        boardWizard() {
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("boardwizard/boardwizard.html"),
                windowClass: "scrumdo-modal primary board-wizard",
                controller: "BoardWizardController",
                controllerAs: "ctrl",
                backdrop: "static",
                keyboard: false,
                windowTemplateUrl: this.urlRewriter.rewriteAppUrl("boardwizard/boardwizardholder.html")
            });

            this.dialog.result.then(this.dialogClosed);
        }
    }
}