/// <reference path='../../_all.ts' />

module scrumdo {
    import IPromise = angular.IPromise;
    export class ConfirmationService {

        constructor(public modal, public urlRewriter) { }

        public prompt(title:string = "Are you sure?",
                      prompt:string = "This will do somethin bad",
                      cancelText:string = "Cancel",
                      okText:string = "Ok",
                      okClass:string = "secondary"):IPromise<string> {
            var dialog;
            dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("common/alert/promptwindow.html"),
                controller: "PromptWindowController",
                windowTopClass: "confirm-window",
                resolve: {
                    title: () => title,
                    prompt: () => prompt,
                    cancelText: () => cancelText,
                    okText: () => okText,
                    okClass: () => okClass,


                }
            });
            return dialog.result;
        }

        public confirm(title:string = "Are you sure?",
                       prompt:string = "This will do somethin bad",
                       cancelText:string = "Cancel",
                       okText:string = "Ok",
                       okClass:string = "secondary"):IPromise<string> {
            var dialog;
            dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("common/alert/confirmationwindow.html"),
                controller: "ConfirmationWindowController",
                resolve: {
                    title: () => title,
                    prompt: () => prompt,
                    cancelText: () => cancelText,
                    okText: () => okText,
                    okClass: () => okClass
                }
            });
            return dialog.result;
        }
    }



    export class PromptWindowController {
        constructor(public scope, title, prompt, cancelText, okText, okClass) {
            this.scope.ctrl = this;
            this.scope.title = title;
            this.scope.prompt = prompt;
            this.scope.cancelText = cancelText;
            this.scope.okText = okText;
            this.scope.okClass = okClass;
            this.scope.promptText = "";
        }

        public ok() {
            return this.scope.$close(this.scope.promptText);
        }
    }



    export class ConfirmationWindowController {
        constructor(public scope, title, prompt, cancelText, okText, okClass, hotkeys) {
            var cancelShortcut, okShortcut;
            this.scope.ctrl = this;
            this.scope.title = title;
            this.scope.prompt = prompt;
            this.scope.cancelText = cancelText;
            this.scope.okText = okText;
            this.scope.okClass = okClass;

            okShortcut = okText.substr(0, 1).toLowerCase();
            cancelShortcut = cancelText.substr(0, 1).toLowerCase();
            if (okShortcut !== cancelShortcut && /[a-z]/.test(okShortcut) && /[a-z]/.test(cancelShortcut)) {
                this.scope.okText = "<u>" + okText.substr(0, 1) + "</u>" + okText.substr(1);
                this.scope.cancelText = "<u>" + cancelText.substr(0, 1) + "</u>" + cancelText.substr(1);
                hotkeys.bindTo(this.scope).add({
                    combo: okShortcut,
                    description: okText,
                    callback: this.ok
                }).add({
                    combo: cancelShortcut,
                    description: cancelText,
                    callback: this.cancel
                });
            }
        }

        public cancel = () => {
            return this.scope.$dismiss("canceled");
        }

        public ok = () => {
            return this.scope.$close(true);
        }
    }

}