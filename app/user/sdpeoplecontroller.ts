/// <reference path='../_all.ts' /> 

module scrumdo {
    export class SDPeopleController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        private element: HTMLElement;
        private ngModel: ng.INgModelController;

        constructor(private scope) {
            
        }

        init(element, ngModel) {
            this.element = element;
            this.ngModel = ngModel;
            this.scope.ctrl = this;
            var t = this;
            ngModel.$render = () => {
                t.scope.currentValue = ngModel.$modelValue;
            }
        }

        select($event, newValue) {
            this.ngModel.$setViewValue(newValue);
            this.scope.currentValue = newValue;
            $event.preventDefault();
        }
    }
}