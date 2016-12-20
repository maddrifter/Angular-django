/// <reference path='../_all.ts' />

module scrumdo {
    export class WelcomeDialogController {
        public static $inject: Array<string> = [
            "$scope",
            "confirmService",
            "$state",
            "mixpanel"
        ];

        constructor(
            public scope,
            public confirmationService: ConfirmationService,
            public state: ng.ui.IStateService,
            public mixpanel) {

        }


        template() {
            this.scope.$close("template");
        }

        wizard() {
            this.scope.$close("wizard");
        }

        scratch() {
            this.confirmationService.confirm("Start from scratch?",
                "This option is for advanced users who understand what they are doing.  We recommend the board wizard to most people.  Are you sure you want to start from scratch?",
                "No",
                "Yes",
                "btn-danger")
                .then(this.goToScratch);
        }

        goToScratch = () => {
            this.scope.$dismiss();
            this.state.go("settings.board")
            this.mixpanel.track("Start from Scratch");
        }
    }
}