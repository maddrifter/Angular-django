/// <reference path='../../_all.ts' /> 

module scrumdo {
    export class AssignWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "projectMembers"
        ];

        private assignees: Array<any>;

        constructor(
            private scope,
            private projectMembers) {

            this.assignees = [];
            this.scope.members = projectMembers;
            this.scope.assignMode = 'add';
            this.scope.ctrl = this;
        }

        ok() {
            this.scope.$close([
                (function() {
                    var i, len, ref, results;
                    ref = this.assignees;
                    results = [];
                    for (i = 0, len = ref.length; i < len; i++) {
                        var a = ref[i];
                        results.push(a.username);
                    }
                    return results;
                }).call(this), this.scope.assignMode
            ]);
        }
    }
}