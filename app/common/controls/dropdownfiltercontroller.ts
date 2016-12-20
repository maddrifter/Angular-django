/// <reference path='../../_all.ts' />

module scrumdo {
    export class DropdownFilterController {
        public static $inject: Array<string> = [
            "$scope",
            "$timeout"
        ];

        public ngModel: ng.INgModelController;
        public query: string;
        public element: HTMLElement

        constructor(public scope, public $timeout) {
            this.query = "";
        }

        init(ngModel: ng.INgModelController, element: ng.IAugmentedJQuery) {
            this.ngModel = ngModel;
            this.element = <HTMLElement> element[0].querySelector('.dropdownfilter');
            //add some delay to focus
            setTimeout( () => {
                $(this.element).focus();
            },200);
            
            this.ngModel.$render = () => {
                this.query = "";
                this.ngModel.$setViewValue(this.query);
            }
        }

        select($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        onChange = () => {
            this.ngModel.$setViewValue(this.query);
        }
        
        onkeyup(event){
            this.clearClass(event);
            if(this.query != ""){
                var elem = this.getFirstOption(event);
                if(elem != null){
                    elem.addClass('toselect');
                }
            }
        }
        
        onEnter(event){
            if(this.query == "") return;
            event.preventDefault();
            event.stopPropagation();
            var elem = this.getFirstOption(event);
            if(elem != null){
                this.$timeout(() => {
                    elem.triggerHandler('click');
                    this.scope.$root.$broadcast("hideDropDown", {});
                }, 100);
            }
        }
        
        clearClass(event){
            var inputElem = angular.element(event.target).parents('dropdown-filter');
            var optionElem = inputElem.next();
            $('a', optionElem).removeClass('toselect');
        }
        
        getFirstOption(event){
            var inputElem = angular.element(event.target).parents('dropdown-filter');
            var optionElem = inputElem.next();
            if(optionElem.children('li').length > 0){
                var first = optionElem.children('li').first();
                var second = optionElem.children('li').eq(1);
                var a = first.children('a');
                var b = second.children('a');
                if((a.text() == "No Epic" || a.text() == "None") && optionElem.children('li').length >1){
                    if(second.hasClass('divider')) return a;
                    return b;
                }
                return a;
            }
            return null;
        }
    }
}