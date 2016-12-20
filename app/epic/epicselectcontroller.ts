/// <reference path='../_all.ts' />

module scrumdo {

    interface EpicSelectScope extends ng.IScope {
        currentValue: any;
        epics: Array<any>;
        epic: any;
        noepictitle: string;
        ctrl: EpicSelectController;
    }

    export class EpicSelectController {
        public static $inject:Array<string> = ["$scope"];

        public element:Element;
        public ngModel:ng.INgModelController;
        public showArchived:boolean = false;
        public filterQuery: string;
        public menuOpen: boolean;

        constructor(private scope:EpicSelectScope) {
            if(typeof(this.scope.noepictitle) == 'undefined'){
                this.scope.noepictitle = "No Collection";
            }
            this.menuOpen = false;
            this.filterQuery = "";
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
        }

        public init = (element:Element, ngModel:ng.INgModelController) => {
            this.element = element;
            this.ngModel = ngModel;
            if (this.ngModel.$modelValue) {
                this.scope.currentValue = this.ngModel.$modelValue;
            }

            this.ngModel.$render = () => {
                return this.scope.currentValue = this.ngModel.$modelValue;
            };
        }

        public displayArchived($event) {
            this.showArchived = true;
            $event.stopPropagation();
            $event.preventDefault();
        }

        private epicArchived(epic:Epic):boolean {
            if(epic.archived){
                return true;
            }
            var parent:Epic = _.findWhere(this.scope.epics, {id:epic.parent_id})
            if(parent != null) {
                // If the epic's parent is archived, we're not going to show it either.
                return this.epicArchived(parent)
            }
            return false;
        }

        public filterEpic = (epic:Epic) : boolean => {
            if( epic == this.scope.currentValue ) {return true;}
            return this.showArchived || ! this.epicArchived(epic);
        }

        public getIndent(epic:Epic):any {
            if ((epic != null) && (epic.indent != null)) {
                return {
                    "margin-left": "" + ((epic.indent.length - 1) * 5) + "px"
                };
            } else {
                return {};
            }
        }

        public select($event, epic) {
            this.ngModel.$setViewValue(epic);
            this.scope.currentValue = epic;
            return $event.preventDefault();
        }
        
        doFilterQuery = (epic) => {
            var v: string;
            if(this.scope.epic != null && this.scope.epic.id == epic.id) return false;
            if (this.filterQuery == "") return true;
            var hashValue: string = "#" + epic.number;
            v = hashValue + " " + epic.summary.toLowerCase();
            return v.indexOf(this.filterQuery.toLowerCase()) !== -1;
        }
    }
}