/// <reference path='../../_all.ts' />

module scrumdo {
    export class BusinessValueController {
        public static $inject: Array<string> = [
            "$scope",
            "$filter"
        ];

        public element: HTMLElement;
        public ngModel: ng.INgModelController;
        public currentValue: string;
        public pointValue;
        public renderMode:number = 0;
        public pointScale:Array<any>;

        constructor(
            public scope,
            public filter: ng.IFilterService) {
            this.scope.$watch("pointScale", this.onPointScaleChanged);
            if(this.scope.renderMode != null){
                this.renderMode = this.scope.renderMode;
            }
        }

        init(element, ngModel) {
            this.element = element;
            this.ngModel = ngModel;
            this.setDisplayValue();
            this.ngModel.$render = this.setDisplayValue;
        }
        
        onPointScaleChanged = () => {
            if(this.scope.pointScale == null){
                return;
            }
            if(this.renderMode == 1){
                this.pointScale = _.filter(this.scope.pointScale, (s) => s[0].toLowerCase() != "inf");
                this.setDisplayPointScale();
            }
        }

        onChange() {
            if (this.currentValue === '') {
                this.ngModel.$setViewValue(null);
            } else {
                var val: number = parseFloat(this.currentValue.replace(/,/g, ''));
                if (val === 0) {
                    this.currentValue = '';
                }
                if (val > 1000000000) {
                    val = 1000000000;
                }
                if (isNaN(val)) {
                    val = null;
                }
                // prevent user not to enter more than 2 decimal place value
                val = Math.round(val * 100) / 100;
                this.ngModel.$setViewValue(val);
                this.currentValue = this.filter('number')(val);
            }
        }
        
        onChangePoint(){
            if(this.pointValue[0] == "?"){
                this.ngModel.$setViewValue(null);
            }else{
                this.ngModel.$setViewValue(this.pointValue[0]);
            }
        }

        onBlur() {
            this.onChange();
            this.setDisplayValue();
        }

        setDisplayValue = () => {
            if(this.renderMode == 0) {
                if ((this.ngModel.$modelValue === 0) || (this.ngModel.$modelValue === null) || (isNaN(this.ngModel.$modelValue))) {
                    this.currentValue = "";
                } else {
                    this.currentValue = this.filter('number')(this.ngModel.$modelValue);
                }
            }
        }
        
        setDisplayPointScale = () => {
            if(this.ngModel.$modelValue == null){
                if(this.pointScale[0][0] != "?"){
                    this.pointValue = ["?", "?", "? Point"];
                }else{
                    this.pointValue = this.pointScale[0];
                }
            }else{
                this.pointValue = _.find(this.pointScale, (p) => p[1] == this.ngModel.$modelValue);
                if (this.pointValue == null) {
                    this.pointValue = [this.ngModel.$modelValue, this.ngModel.$modelValue, this.ngModel.$modelValue+" Points"]
                }
            }
        }
    }
}