/// <reference path='../_all.ts' />

module scrumdo {
    export class TeamAssignService {
        public static $inject:Array<string> = ["milestoneAssignmentManager","$uibModal","urlRewriter"];

        constructor(private milestoneAssignmentManager:MilestoneAssignmentManager,
                    private modal:angular.ui.bootstrap.IModalService,
                    private urlRewriter:URLRewriter) {
                       
        }

        public assignTeam(milestones:Array<Story>, project:Project) {
            this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("board/teamassignmentwindow.html"),
                controller: 'TeamAssignmentController',
                controllerAs: 'ctrl',
                size: "lg",
                backdrop: "static",
                keyboard: true,
                resolve: {
                    milestones: function(){return milestones;},
                    project: function(){return project;}
                }
            }).result.then((slugs) => {this.onAssigned(milestones, project, slugs)});
        }

        private onAssigned(milestones:Array<Story>, project:Project, projectSlugs:Array<string>) {
            milestones.map( (milestone) => {
                this.milestoneAssignmentManager.setAssignments(project.slug, milestone.id, projectSlugs)
            });

        }
    }
}