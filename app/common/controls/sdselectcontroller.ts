/// <reference path='../../_all.ts' />

module scrumdo {
    export class SDSelectController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        public displayAll: boolean;
        public filterQuery: string;
        public showFilter: boolean = false;
        public menuOpen: boolean;
        public tooltip:string = "";
        public faIcon:string;

        constructor(public scope) {
            this.displayAll = false;
            this.scope.angular_equals = angular.equals;
            this.menuOpen = false;
            this.filterQuery = "";
            if(this.scope.showFilter != null){
                this.showFilter = this.scope.showFilter;
            }
            this.scope.$on("hideDropDown", this.hideDropDown);
        }
        
        hideDropDown = () =>{
            if(this.menuOpen == true){
                this.menuOpen = !this.menuOpen;
            }
        }
        
        toggleMenu($event: MouseEvent) {
            $event.preventDefault();
            $event.stopPropagation();
            this.menuOpen = !this.menuOpen;
            trace("Menu open: " + this.menuOpen);
            if(this.scope.iconTooltip != null){
                this.tooltip = this.scope.iconTooltip;
            }
            if(this.scope.faIcon != null){
                this.faIcon = this.scope.faIcon;
            }
        }

        filterOption = (option) => {
            if (this.scope.archiveProperty == null) {
                return true;
            }
            if (this.displayAll) {
                return true;
            }
            // Have to display it if it's our current selection.
            if (option === this.scope.currentValue) {
                return true;
            }
            return !option[this.scope.archiveProperty];
        }

        showAll($event: MouseEvent) {
            this.displayAll = true;
            $event.preventDefault();
            $event.stopPropagation();
        }

        hasFiltered() {
            if (this.displayAll) {
                return false;
            }
            return (_.filter(this.scope.options, (option) => option[this.scope.archiveProperty])).length > 0;

        }

        filteredCount() {
            if (!this.scope.archiveProperty) {
                return 0;
            }
            return (_.filter(this.scope.options, (option) => option[this.scope.archiveProperty])).length;
        }
        
        getFilterKey(){
            var option = '$';
            switch(this.scope.controlType){
                case 'releases':
                    option = 'summary';
                    break;
                case 'labels':
                    option = 'name';
                    break;
                default:
                    option = '$';
            }
            return option; 
        }
    }
}