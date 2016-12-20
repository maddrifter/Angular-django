/// <reference path='../_all.ts' />

module scrumdo {
    export class CommentsController {
        public static $inject: Array<string> = [
            "$scope",
            "$sce"
        ];

        constructor(public scope,
            private sce: ng.ISCEService) {
            this.scope.to_trusted = function(html_code) {
                return this.sce.trustAsHtml(html_code);
            };
        }
    }
}