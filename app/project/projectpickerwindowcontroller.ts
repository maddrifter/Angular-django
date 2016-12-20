/// <reference path='../_all.ts' />

module scrumdo {
    export class ProjectPickerWindowController {
        public static $inject:Array<string> = [
            "$scope",
            "projects"
        ];

        constructor(private $scope, public projects:Array<Project>) {
                       
        }

        selectProject(project) {
            this.$scope.$close(project);
        }

        cancel() {
            this.$scope.$dismiss();
        }

    }
}