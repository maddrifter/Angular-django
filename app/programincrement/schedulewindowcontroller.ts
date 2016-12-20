/// <reference path='../_all.ts' />

module scrumdo {
    export class IncrementScheduleWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "programIncrementManager",
            "iterationId",
            "increment",
            "projectSlug",
            "organizationSlug",
            "incrementSchedule",
            "confirmService",
            "scrumdoTerms"
        ];

        private startOpened: boolean;
        private endOpened: boolean;
        private busyMode: boolean;
        private validDate: boolean;

        constructor(
            private scope,
            private programIncrementManager: ProgramIncrementManager,
            private iterationId:number,
            private increment: ProgramIncrement,
            public projectSlug: string,
            public organizationSlug: string,
            public incrementSchedule,
            private confirmService: ConfirmationService,
            private scrumdoTerms: ScrumDoTerms) {

            this.scope.ctrl = this;
            this.busyMode = false;
            this.validDate = true;
            this.scope.incrementSchedule = angular.copy(this.incrementSchedule);
            this.scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };
        }

        checkDates() {
            this.validDate = this.scope.incrementSchedule.start_date <= this.scope.incrementSchedule.end_date &&
                               (this.scope.incrementSchedule.start_date != null && this.scope.incrementSchedule.end_date != null)  ;
        }
        
        deleteIncrementSchedule() {
            this.confirmService.confirm("Are you sure?",
                "This will delete the "+ this.scope.$root.safeTerms.children.time_period_name +".  Are you sure?",
                "Cancel",
                "Delete",
                "btn-warning").then(this.onDeleteConfirm);
        }
        
        onDeleteConfirm = () => {
            this.programIncrementManager.deleteIncrementSchedule(this.projectSlug, this.increment.id, this.incrementSchedule).then(()=>{
                this.scope.$dismiss("deleted");
                this.broadcastMessage(this.increment);
            });
        }
        
        save() {
            this.busyMode = true;
            angular.copy(this.scope.incrementSchedule, this.incrementSchedule);

            if(this.increment.iteration_id == null){
                var incrementData = {
                    iteration_id: this.iterationId, 
                    schedule: [this.incrementSchedule]  
                }
                this.programIncrementManager.createIncrement(this.projectSlug, incrementData).then((increment:ProgramIncrement) => {
                    this.broadcastMessage(increment);
                    this.scope.$close();
                })
            }else{
                if(this.incrementSchedule.id == -1){
                    trace("creating new schedule");
                    delete this.incrementSchedule.id
                    this.programIncrementManager.createIncrementSchedule(this.projectSlug, this.increment.id, this.incrementSchedule).then(() => {
                        this.broadcastMessage(this.increment);
                        this.scope.$close();
                    });
                }else{
                    trace("updating schedule");
                    this.programIncrementManager.updateIncrementSchedule(this.projectSlug, this.increment.id, this.incrementSchedule).then(() => {
                        this.broadcastMessage(this.increment);
                        this.scope.$close();
                    });
                }
            }
        }

        private broadcastMessage(increment){
            this.scope.$root.$broadcast("ProjectIncrementChanged", increment);
        }
        
    }
}