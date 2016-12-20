/// <reference path='../_all.ts' />

module scrumdo {
    export class TeamAssignmentController {
        public static $inject:Array<string> = ["userService",
                                               "$scope",
                                               "milestones",
                                               "milestoneAssignmentManager"];

        public projectList:Array<MiniProjectList>;
        public selectedProjects:Array<string> = [];

        constructor(public userService:UserService,
                    public $scope:angular.ui.bootstrap.IModalScope,
                    milestones:Array<Story>,
                    milestoneAssignmentManager:MilestoneAssignmentManager) {
            this.projectList = userService.projectList();

            milestones.map((milestone:Story) => {
                milestoneAssignmentManager.getCached(milestone.id).map((assignment:MilestoneAssignment)=>{
                    var slug:string = assignment.assigned_project.slug;
                    if(assignment.active && this.selectedProjects.indexOf(slug)==-1 ){
                        this.selectedProjects.push(slug);
                    }
                });
            });

        }



        public toggleSelection(slug:string) {
            var idx:number = this.selectedProjects.indexOf(slug);

            if (idx > -1) {
                this.selectedProjects.splice(idx, 1);
            }
            else {
                this.selectedProjects.push(slug);
            }
            console.log(this.selectedProjects);
        }

        public save() {
            this.$scope.$close(this.selectedProjects);
        }

    }
}