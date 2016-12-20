/// <reference path='../_all.ts' />

module scrumdo {


    interface IterationSelectScope extends ng.IScope {
        currentValue: any;
        iterationSortOrder: Array<any>;
        defaultLabel: string;
        alignment: string;
        iterations: Array<Iteration>;
        timePeriodName: string;
    }

    export class IterationSelectController {
        public static $inject:Array<string> = ["$scope","$rootScope", "$timeout"];

        public showArchived:boolean = false;
        public ngModel:ng.INgModelController;
        public defaultLabel :string;
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
            scope.alignment = scope.alignment || "dropdown-menu-right";
            this.menuOpen = false;
            this.scope.$on("hideDropDown", this.hideDropDown);
            this.haveParents = false;
            this.buildIterationTree();
            this.timePeriodName = "Iteration";
            if(scope.timePeriodName != null){
                this.timePeriodName = scope.timePeriodName;
            }
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
            if(this.menuOpen){
                if($('#safe-iteration-select','.card-project-move-modal').length > 0){
                    $('.modal-body').css({overflow:'hidden'});
                    this.timeout( ()=> {
                        var dropdown = $('.iteration-dropdown', '#safe-iteration-select');
                        var toggleBtn = $('.safe-iteration-dropdown-toggle', '#safe-iteration-select');
                        dropdown.css({ position:'fixed', top:toggleBtn.offset().top, width:'100%' });
                        $('.modal-body').css({overflow:''});
                    },100);
                }
            }

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

        public sortByIncrements = (iteration:Iteration) => {
            if(iteration.increment == null){
                return 0;
            }else{
                return iteration.increment.id;
            }
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


        public select($event, iteration) {
            this.ngModel.$setViewValue(iteration);
            this.scope.currentValue = iteration;
            // TODO - MARC - The next two lines you merged in, need to understand them.
            this.scope.$emit("filterIterationChanged", iteration);
            this.rootScope.$broadcast("IterationSelected");
            return $event.preventDefault();
        }

    }
}
