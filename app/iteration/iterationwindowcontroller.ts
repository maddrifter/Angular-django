/// <reference path='../_all.ts' />

module scrumdo {
    export class IterationWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "iterationManager",
            "iteration",
            "projectSlug",
            "organizationSlug",
            "confirmService",
            "scrumdoTerms",
            "windowType",
            "projectManager",
            "programIncrementManager"
        ];

        private startOpened: boolean;
        private endOpened: boolean;
        private busyMode: boolean;
        private validDate: boolean;
        private parentProjects: Array<any>;
        private parentProject: any;
        private parentIterations: Array<any>;
        private parentIteration: any;
        private parentScedules: Array<any>;
        private parentScedule: any;
        private showAdvanceOptions: boolean;
        

        constructor(
            private scope,
            private iterationManager: IterationManager,
            private iteration,
            public projectSlug: string,
            public organizationSlug: string,
            private confirmService: ConfirmationService,
            private scrumdoTerms: ScrumDoTerms,
            private windowType: string,
            private projectManager: ProjectManager,
            private programIncrementManager: ProgramIncrementManager) {

            this.scope.ctrl = this;
            this.startOpened = false;
            this.endOpened = false;
            this.busyMode = false;
            this.validDate = true;
            this.scope.iteration = angular.copy(this.iteration);
            this.scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            this.parentProjects = [];
            this.setParentProjects();
            this.showAdvanceOptions = this.scope.iteration.increment != null;

            console.log(this.scope.iteration)
        }

        checkDates() {
            if ((this.scope.iteration.start_date == null) || !this.scope.iteration.end_date) {
                this.validDate = true;
                return;
            }
            this.validDate = this.scope.iteration.start_date <= this.scope.iteration.end_date;
        }

        openStartDatePicker = ($event: MouseEvent) => {
            trace("openStartDatePicker");
            this.startOpened = true;
            $event.preventDefault();
            $event.stopPropagation();
        }

        openEndDatePicker = ($event: MouseEvent) => {
            trace("openEndDatePicker");
            this.endOpened = true;
            $event.preventDefault();
            $event.stopPropagation();
        }

        deleteIteration() {
            this.confirmService.confirm("Are you sure?",
                "This will delete the iteration.  Any stories in it will be moved to your backlog.  Are you sure?",
                "Cancel",
                "Delete",
                "btn-warning").then(this.onDeleteConfirm);
        }

        onDeleteConfirm = () => {
            var iterationCopy = angular.copy(this.iteration);
            this.iterationManager.deleteIteration(this.organizationSlug, this.projectSlug, this.iteration).then(()=>{
                this.scope.$dismiss("deleted");
                // for planning app to set currentIteration to null if deleted same
                this.scope.$emit("iterationDeleted", iterationCopy);
            });
        }

        save() {
            this.busyMode = true;
            angular.copy(this.scope.iteration, this.iteration);
            if (this.iteration.id === -1) {
                this.iterationManager.createIteration(this.organizationSlug, this.projectSlug, this.iteration).then((iteration) => {
                    this.scope.$dismiss("created");
                    iteration.selected = true;
                });
            } else {
                this.iterationManager.saveIteration(this.organizationSlug, this.projectSlug, this.iteration).then(() => {
                    this.scope.$dismiss("saved");
                });
            }
        }

        private setParentProjects(){
            this.projectManager.loadProject(this.organizationSlug, this.projectSlug).then((project:Project) => {
                this.parentProjects = project.parents;
            });
        }

        private loadParentIterations(){
            if(this.parentProject == null){
                this.parentIterations = null;
                return;
            }
            this.iterationManager.loadIterations(this.organizationSlug, this.parentProject.slug).then( (iterations) =>{
                this.parentIterations = iterations;
            });
        }

        private loadIterationSchedules(){
            if(this.parentIteration == null){
                this.parentScedule = null;
                return;
            }
            this.programIncrementManager.getIncrementByIteration(this.parentProject.slug, this.parentIteration.id).then((increment) => {
                this.parentScedules = increment.schedule;
                console.log(this.parentScedules)
            });
        }

        private showOptions(){
            this.showAdvanceOptions = !this.showAdvanceOptions;
        }
    }
}