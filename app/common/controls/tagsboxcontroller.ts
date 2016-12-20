/// <reference path='../../_all.ts' />
module scrumdo {
    export class SDTagsBoxController {
        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter",
            "mixpanel"
        ];

        public name: string;
        public listValues: Array<any> = [];
        public ngModel: ng.INgModelController;
        public element: HTMLElement;

        constructor(
            public scope,
            public urlRewriter: URLRewriter,
            public mixpanel) {

            this.scope.ctrl = this;
            this.name = 'SDTagsBoxController';
            this.scope.currentTypedValue = "";
            this.scope.template = this.urlRewriter.rewriteAppUrl("common/controls/tagcompletebody.html");
        }

        init(element, ngModel: ng.INgModelController) {
            this.element = element;
            this.ngModel = ngModel;
            this.listValues = ngModel.$modelValue;
            this.ngModel.$render = () => {
                this.listValues = ngModel.$modelValue;
            }
        }

        updateCurrentValue(item) {
            this.scope.currentTypedValue = item.name;
            this.setCurrentValue();
        }

        setCurrentValue() {
            if (this.scope.currentTypedValue !== '') {
                this.ngModel.$setViewValue(this.listValues.concat(this.scope.currentTypedValue));
            } else {
                this.ngModel.$setViewValue(this.listValues);
            }
            trace(this.ngModel.$modelValue, this.ngModel.$viewValue);
        }

        removeTag(tag) {
            var i: number = this.listValues.indexOf(tag);
            if (i !== -1) {
                this.listValues.splice(i, 1);
            }
            this.setCurrentValue();
        }

        addTag() {
            var val = this.scope.currentTypedValue;
            if (typeof val !== "string") {
                val = val.name;
            }
            val = val.replace(/#+(?!$)/, '');
            val = val.trim();
            if (val === '') {
                return;
            }
            this.listValues.push(val);
            this.scope.currentTypedValue = "";
            this.setCurrentValue();
            this.mixpanel.track('Add Tag', {
                name: val
            });
        }
    }
}