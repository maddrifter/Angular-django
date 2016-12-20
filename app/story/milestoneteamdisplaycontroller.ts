/// <reference path='../_all.ts' />

module scrumdo {

    interface MilestoneTeamDisplayControllerScope extends ng.IScope {
        project:Project;
        story:Story;
        ctrl:MilestoneTeamDisplayController;
    }

    export class MilestoneTeamDisplayController {
        public static $inject:Array<string> = ["milestoneAssignmentManager", "$scope", "userService"];

        public assignments:Array<MilestoneAssignment>;


        constructor(private milestoneAssignmentManager:MilestoneAssignmentManager,
                    private $scope:MilestoneTeamDisplayControllerScope,
                    private userService:UserService) {
            this.loadAssignments()
        }

        public tooltip(milestone:MilestoneAssignment):string {

            return this.userService.me.milestone_statuses[milestone.status];
        }

        private loadAssignments() {
            this.assignments = this.milestoneAssignmentManager.getAssignments(this.$scope.project.slug, this.$scope.story.id);
        }

        public projectName(slug):string {
            return this.userService.me.project_access[slug].name;
        }

        public percentage(val, total):number {
            if(total==0){return 0;}
            return Math.round(100 * val / total);
        }


    }
}
