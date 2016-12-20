/// <reference path='../../_all.ts' /> 

module scrumdo {
    export class MoveToProjectWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "projectManager",
            "iterationManager",
            "defaultProject"
        ];

        private iteration;
        private loading:boolean;

        constructor(
            private scope,
            public organizationSlug: string,
            private projectManager,
            private iterationManager: IterationManager,
            private defaultProject) {

            this.scope.selectedProject = null;
            this.scope.ctrl = this;
            this.scope.selectedIteration = null;
            this.scope.$watch("selectedProject", this.onSelectedProjectChanged);
            scope = this.scope;
            this.loading = true;
            projectManager.loadProjectsForOrganization(organizationSlug).then((projects) => {
                scope.projects = projects;
                return scope.selectedProject = defaultProject;
            });
        }

        onSelectedProjectChanged = () => {
            var t = this;
            var scope = this.scope;
            this.loading = true;
            scope.iterations = null;
            scope.selectedIteration = null;
            if (this.scope.selectedProject == null) {
                return;
            }
            this.iterationManager.loadIterations(this.organizationSlug, this.scope.selectedProject.slug).then((iterations) => {
                if (iterations.length > 0) {
                    scope.selectedIteration = iterations[0].id;
                    this.iteration = iterations[0]
                }
                this.loading = false;
                return scope.iterations = iterations;
            });
        }

        onIterationSelected(){
            this.scope.selectedIteration = this.iteration.id;
        }

        ok() {
            this.scope.$close([this.scope.selectedProject.slug, this.scope.selectedIteration]);
        }
    }
}