/// <reference path='../_all.ts' />

module scrumdo {
    export class ListColumnController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "organizationSlug",
            "projectSlug"
        ];

        private iterations;
        private autoOpen;

        constructor(
            private scope,
            private storyManager,
            public organizationSlug: string,
            public projectSlug: string) {

            this.scope.$watch("iteration", this.setIteration);
            this.scope.$watch("iterations", this.setIteration);
            this.setIteration();
        }

        setIteration = () => {
            if (this.scope.iteration === -1) {
                this.iterations = this.scope.iterations;
            } else {
                this.iterations = [_.findWhere(this.scope.iterations, { id: this.scope.iteration })];
            }
            this.autoOpen = (this.iterations != null) && this.iterations.length === 1;
        }
    }
}