/// <reference path='../../_all.ts' />

module scrumdo{

    interface ProjectTeamScope extends ng.IScope{
        accessLabel:string;
        team: any;
        accessby: string;
        invitees: Array<any>;
        STATIC_URL: string;
    }

    export class ProjectTeamController{
        public static $inject: Array<string> = [
            "$scope",
            "$rootScope",
            "teamManager",
            "organizationSlug",
            "ngToast",
            "confirmService",
            "userService",
            "STATIC_URL"
        ]

        private isTeamAdmin:boolean;

        constructor(public scope: ProjectTeamScope,
                    private rootScope: ng.IScope,
                    private teamManager: TeamManager,
                    private organizationSlug: string,
                    private ngToast,
                    private confirmService: ConfirmationService,
                    private userService: UserService,
                    private STATIC_URL: string){
                    
                    this.scope.invitees = [{ 'name': "" }];
                    this.scope.STATIC_URL = STATIC_URL;
                    this.isTeamAdmin = true;
        }

        removeUser(user) {
            this.confirmRemoveUser(user);
        }

        confirmRemoveUser(user) {
            this.teamManager.removeUser(this.organizationSlug, this.scope.team, user.id).then((response:any) => {
                this.scope.team.members = response.data.members;
            })
        }

        sendInvitations() {
            this.teamManager.inviteUser(this.organizationSlug, this.scope.team, this.scope.invitees).success(this.onInvite);
        }

        onInvite = (response) => {
            this.scope.invitees = _.filter(response.users, (user: { result }) => (user.result == null) || !user.result.success);
            var successCount = (_.filter(response.users, (user: { result }) => (user.result != null) && user.result.success)).length;
            var addedCount = (_.filter(response.users, (user: { result }) => (user.result != null) && user.result.reason === 'User Added')).length;

            if (successCount > 0 && addedCount === 0) {
                this.ngToast.create((successCount - addedCount) + " Invitations Sent");
            } else if (successCount > addedCount && addedCount > 0) {
                this.ngToast.create((successCount - addedCount) + " Invitations Sent, " + addedCount + " users added");
            } else if (addedCount > 0) {
                this.ngToast.create(addedCount + " users added");
            }
            this.scope.team.members = response.team.members;
        }

        inviteeChanged() {
            var invitees = this.scope.invitees;
            if (invitees[invitees.length - 1].name.length > 0) {
                invitees.push({ 'name': "" });
            }
        }

        canAdminTeam = () => {
            if(this.scope.team == null) return true;
            if(this.userService.me == null) return true;
            if(!this.userService.me.staff && this.scope.team.projects.length == 0){
                this.isTeamAdmin = false;
            }
            _.forEach(this.scope.team.projects, (p:any) => {
                if(!this.userService.canAdmin(p.slug)){
                    this.isTeamAdmin = false;
                }
            });
            return true;
        }
    }

}