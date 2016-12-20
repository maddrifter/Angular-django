/// <reference path='../../_all.ts' /> 

module scrumdo {
    export class StatusWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "project"
        ];

        constructor(
            private scope,
            private project) {

            this.scope.project = project;
            this.scope.ctrl = this;
        }

        ok() {
            this.scope.$close(this.scope.selectedStatus);
        }
    }
}