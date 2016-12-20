/// <reference path='../../_all.ts' />

interface dashTeamStateParam extends ng.ui.IStateParamsService {
    teamid
}

module scrumdo {
    export class DashboardTeamController {
        public static $inject: Array<string> = [
            '$scope',
            'teamManager',
            '$stateParams',
            "STATIC_URL",
            'organizationSlug',
            'alertService',
            'ngToast',
            "confirmService",
            "$state",
            "mixpanel",
            "userService"
        ];

        private projectToAdd;
        private access_type;
        private allMembers;
        private safeProjectList;
        private isTeamAdmin: boolean;

        constructor(
            private scope,
            private teamManager: TeamManager,
            private stateParams: dashTeamStateParam,
            public STATIC_URL: string,
            public organizationSlug: string,
            public alertService: AlertService,
            public ngToast,
            private confirmService: ConfirmationService,
            private state: ng.ui.IStateService,
            private mixpanel,
            private userService: UserService) {

            this.scope.$watch('teams', this.setTeam);
            this.scope.STATIC_URL = STATIC_URL;
            this.scope.invitees = [{ 'name': "" }];
            this.scope.$watch("team.name", this.onTeamNameChanged);
            this.projectToAdd = null;
            this.scope.$watch("$parent.safeProjectsLists", this.buildSafeProjectList)
            this.isTeamAdmin = true;
        }

        buildSafeProjectList = (projects) => {
            if(projects == null) return;
            this.safeProjectList = projects;
        }

        onTeamNameChanged = (newValue, oldValue) => {
            if (typeof oldValue === "undefined" || oldValue === null) {
                return;
            }
            if (newValue === oldValue) {
                return;
            }
            this.teamManager.updateTeam(this.organizationSlug, this.scope.team);
        }

        setTeam = (newValue, oldValue) => {
            var team = this.teamManager.getTeam(parseInt(this.stateParams.teamid, 10));
            if (typeof team !== "undefined" && team !== null) {
                this.scope.team = team;
                this.access_type = team.access_type;
                var members = [];
                var ref = this.scope.teams;
                for (var i = 0, len = ref.length; i < len; i++) {
                    team = ref[i];
                    members = members.concat(team.members);
                }
                this.allMembers = _.uniq(members, false, (user) => user.username);
            }
        }

        deleteTeam() {
            if (this.scope.team.access_type === 'staff') {
                var staffTeams = _.filter(this.scope.teams, (team: { access_type }) => team.access_type == 'staff');
                if (staffTeams.length <= 1) {
                    this.alertService.alert('Account Owner Team', 'Can not delete, you need at least one account owner team.');
                    this.access_type = "staff";
                    return;
                }
            }
            this.confirmService.confirm("Are you sure?",
                "Do you wish to delete this entire team list?",
                'No',
                'Yes').then(this.deleteConfirm);
        }

        deleteConfirm = () => {
            this.teamManager.deleteTeam(this.organizationSlug, this.scope.team);
            this.state.go("teams");
            this.mixpanel.track('Delete Team');
        }

        updateAssignees() {
            this.teamManager.updateTeam(this.organizationSlug, this.scope.team);
        }

        updateAccess() {
            if (this.scope.team.access_type === 'staff' && this.access_type !== 'staff') {
                var staffTeams = _.filter(this.scope.teams, (team: { access_type }) => team.access_type == 'staff');
                if (staffTeams.length <= 1) {
                    this.alertService.alert('Account Owner Team', 'Can not save, you need at least one account owner team.');
                    this.access_type = "staff";
                    return;
                }
            }
            this.scope.team.access_type = this.access_type;
            this.teamManager.updateTeam(this.organizationSlug, this.scope.team);
        }

        addProject() {
            if (this.projectToAdd == null) {
                return;
            }
            this.teamManager.addProject(this.organizationSlug, this.scope.team, this.projectToAdd.slug);
        }

        selectProject(project){
            this.projectToAdd = project;
        }

        removeProject(project) {
            this.teamManager.removeProject(this.organizationSlug, this.scope.team, project.slug);
        }

        removeUser(user) {
            var cancelText, okClass, okText, prompt, title;
            if (this.scope.team.access_type === 'staff' && user.id === this.scope.user.id) {
                this.confirmService.confirm(title = "Warning, you could lose access.",
                    prompt = "If you remove yourself from teams, you could lose access to your organization.",
                    cancelText = "Cancel", okText = "Remove",
                    okClass = "btn btn-danger").then(() => {
                        this.confirmRemoveUser(user);
                    });

            } else {
                this.confirmRemoveUser(user);
            }
        }

        confirmRemoveUser(user) {
            this.teamManager.removeUser(this.organizationSlug, this.scope.team, user.id);
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
        }

        inviteeChanged() {
            var invitees = this.scope.invitees;
            if (invitees[invitees.length - 1].name.length > 0) {
                invitees.push({ 'name': "" });
            }
        }

        canAdminTeam = () => {
            console.log(this.userService.me)
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