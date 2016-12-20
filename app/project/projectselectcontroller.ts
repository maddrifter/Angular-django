/// <reference path='../_all.ts' />

module scrumdo {
    interface ProjectSelectScope extends ng.IScope {
        currentValue: any;
    }

    export class ProjectSelectController {
        public static $inject: Array<string> = ["$scope", "$rootScope"];

        public ngModel:ng.INgModelController;

        constructor(private scope: ProjectSelectScope, public rootScope) {

        }

        public init = (ngModel:ng.INgModelController) => {
            this.ngModel = ngModel;
            if (this.ngModel.$modelValue) {
                this.scope.currentValue = this.ngModel.$modelValue;
            }

            this.ngModel.$render = () => {
                return this.scope.currentValue = this.ngModel.$modelValue;
            };
        }

        public select($event, project) {
            this.ngModel.$setViewValue(project);
            this.scope.currentValue = project;
            this.rootScope.$broadcast("projectSelectionChanged");
            return $event.preventDefault();
            
        }

    }
}