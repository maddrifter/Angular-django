/// <reference path='../_all.ts' />

module scrumdo {


    interface IterationSelectScope extends ng.IScope {
        currentValue: any;
        iterationSortOrder: Array<any>;
        defaultLabel: string;
        iterations: Array<Iteration>;
        timePeriodName: string;
    }

    export class IterationMultiSelectController {
        public static $inject:Array<string> = ["$scope","$rootScope", "$timeout"];

        public showArchived:boolean = false;
        public ngModel:ng.INgModelController;
        public defaultLabel :string;
        public allIteration : { name: string, id: number, hidden: boolean };
        private iterationTree:any;
        private haveParents:boolean;
        private menuOpen:boolean;
        public timePeriodName: string;

        constructor(private scope:IterationSelectScope, public rootScope, public timeout) {

            scope.iterationSortOrder = ['hidden', 'iteration_type', this.hasNullEnd, '-end_date','name'];
            this.defaultLabel = "None Selected";
            if(scope.defaultLabel != null){
                this.defaultLabel = scope.defaultLabel;
            }
            this.menuOpen = false;
            this.scope.$on("hideDropDown", this.hideDropDown);
            this.haveParents = false;
            this.buildIterationTree();
            this.timePeriodName = "Iteration";
            if(scope.timePeriodName != null){
                this.timePeriodName = scope.timePeriodName;
            }
            this.allIteration = { name: 'All '+this.timePeriodName, id: -1, hidden: false };
        }

        hideDropDown = () => {
            if(this.menuOpen == true){
                this.menuOpen = !this.menuOpen;
            }
        }

        toggleMenu($event: MouseEvent) {
            $event.preventDefault();
            $event.stopPropagation();
            this.menuOpen = !this.menuOpen;
        }

        private buildIterationTree(){
            this.iterationTree = {};
            this.iterationTree[-1] = [];
            _.forEach(this.scope.iterations, (itr:Iteration) => {
                if(itr.increment != null){
                    this.haveParents = true;
                    if(this.iterationTree[itr.increment.id] == null){
                        this.iterationTree[itr.increment.id] = [itr];
                    }else{
                        this.iterationTree[itr.increment.id].push(itr);
                    }
                }else{
                    this.iterationTree[-1].push(itr);
                }
            });
        }

        private hasNullEnd(iteration):boolean {
            return iteration.end_date != null;
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


        public displayArchived($event) {
            this.showArchived = !this.showArchived;
            $event.stopPropagation();
            $event.preventDefault();
        }


        public filterIteration = (iteration) => {
            if(iteration == this.scope.currentValue) {return true;}
            return this.showArchived || ! iteration.hidden;
        }

        public isSelected(obj) {
            if (this.scope.currentValue == null) {
                return false;
            }
            return _.find(this.scope.currentValue, (v:any) => { return v.id == obj.id });
        }
        
        public unselectAll(){
            if(_.find(this.scope.currentValue, (v:any) => { return v.id == -1 })){
                var firstMatch = _.find(this.scope.currentValue, (obj:any) => { return -1 == obj.id });
                var index = this.scope.currentValue.indexOf(firstMatch);
                this.scope.currentValue.splice(index, 1);
            }
        }

        public select($event, newValue) {	
            $event.preventDefault();
            $event.stopPropagation();
            var t = this;
            if(newValue.id == -1){
                this.scope.currentValue = [newValue];
            }else{
                this.unselectAll();
                if (this.isSelected(newValue)) {
                    var firstMatch = _.find(this.scope.currentValue, (obj:any) => { return newValue.id == obj.id });
                    var index = this.scope.currentValue.indexOf(firstMatch);
                    this.scope.currentValue.splice(index, 1);
                } else {
                    this.scope.currentValue.push(newValue);
                }
            }
            this.ngModel.$setViewValue(this.scope.currentValue);
            this.scope.$emit("multiIterationSelected", this.scope.currentValue);
            return $event.preventDefault();
        }

    }
}
