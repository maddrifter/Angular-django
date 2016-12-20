/// <reference path='../../_all.ts' />

module scrumdo {
    import IPromise = angular.IPromise;
    export class AlertService {
        constructor(public modal, public urlRewriter, public rootScope) {
        }

        public alert = (title, body) => {
            var scope;
            var dialog: ng.ui.bootstrap.IModalServiceInstance;
            scope = this.rootScope.$new();
            scope.title = title;
            scope.body = body;
            
            dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("common/alert/alertwindow.html"),
                scope: scope
            });
            return dialog.closed;
        }

        public warn(title:string = "Are you sure?",
                      prompt:string = "This will do somethin bad"):IPromise<string> {
            var dialog;
            dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("common/alert/warnwindow.html"),
                controller: "PromptWindowController",
                windowTopClass: "confirm-window",
                resolve: {
                    title: () => title,
                    prompt: () => prompt,
                    cancelText: () => "Cancel",
                    okText: () => "Ok",
                    okClass: () => null,
                }
            });
            return dialog.result;
        }
    }
}