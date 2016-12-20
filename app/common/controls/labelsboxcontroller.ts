/// <reference path='../../_all.ts' />

module scrumdo {
    export class SDLabelsBoxController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        private name: string;
        private element: HTMLElement;
        private ngModel: ng.INgModelController;

        constructor(public scope) {
            this.scope.ctrl = this;
            this.name = 'SDLabelsBoxController';
        }

        init(element, ngModel) {
            this.element = element;
            this.ngModel = ngModel;
            this.scope.currentValue = ngModel.$modelValue;
            var t = this;
            this.ngModel.$render = () => {
                t.scope.currentValue = ngModel.$modelValue;
            }
        }
    }
}