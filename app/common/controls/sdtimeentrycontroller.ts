/// <reference path='../../_all.ts' />

module scrumdo {
    export class SDTimeEntryController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        public currentValue: string;
        public element: HTMLElement;
        public ngModel: ng.INgModelController;

        constructor(public scope) {
            this.currentValue = '';
            if (this.scope.placeholder == null) {
                this.scope.placeholder = "Estimate (hh:mm)";
            }
        }

        init(element, ngModle: ng.INgModelController) {
            this.element = element;
            this.ngModel = ngModle;
            this.setDisplayValue();
            this.ngModel.$render = this.setDisplayValue;
        }

        onChange() {
            this.currentValue = this.currentValue.replace(/[^0-9:]+$/, '');
            if (this.currentValue === '') {
                this.ngModel.$setViewValue(0);
            } else {
                var pieces = this.currentValue.split(/[:,.]/);
                var hours, minutes;
                if (pieces.length === 2) {
                    hours = toIntWithEmpty(pieces[0]);
                    if (isNaN(hours)) {
                        hours = 0;
                    }
                    if (hours > 9999999) {
                        hours = 9999999;
                    }
                    minutes = toIntWithEmpty(pieces[1]);
                    if (isNaN(minutes)) {
                        minutes = 0;
                    }
                    var tminutes = hours * 60 + minutes;
                    var maxminutes = 9999999 * 60 + 59;
                    if(tminutes > maxminutes){
                        tminutes = maxminutes;
                    }
                    this.ngModel.$setViewValue(tminutes);
                }
                if (pieces.length === 1) {
                    hours = toIntWithEmpty(pieces[0]);
                    if (isNaN(hours)) {
                        hours = 0;
                    }
                    if (hours > 9999999) {
                        hours = 9999999;
                    }
                    this.ngModel.$setViewValue(hours * 60);
                }
            }
        }

        onBlur() {
            this.onChange();
            this.setDisplayValue();
        }

        setDisplayValue = () => {
            if ((this.ngModel.$modelValue === 0) || (this.ngModel.$modelValue === null) || (isNaN(this.ngModel.$modelValue))) {
                this.currentValue = "";
            } else {
                var ref = minutesToHoursMinutes(this.ngModel.$modelValue), hours = ref[0], minutes = ref[1];
                this.currentValue = hours + ":" + (pad(minutes, 2));
            }
        }
    }
}