/// <reference path='../../_all.ts' />

module scrumdo {
    export class AllMembersController {
        public static $inject: Array<string> = [
            '$scope',
            'teamManager',
            '$stateParams',
            'organizationSlug',
            'confirmService',
            "$q"
        ];

        private allMembers;

        constructor(
            private scope,
            private teamManager: TeamManager,
            private stateParams: ng.ui.IStateParamsService,
            public organizationSlug: string,
            private confirmService: ConfirmationService,
            private q: ng.IQService) {

            this.scope.$watch('teams', this.setAllMembers);
        }

        setAllMembers = () => {
            if (this.scope.teams == null) {
                return;
            }
            var members = [];
            var ref = this.scope.teams;
            for (var i = 0, len = ref.length; i < len; i++) {
                var team = ref[i];
                members = members.concat(team.members);
            }
            members = _.sortBy(members, (user) => user.username);
            this.allMembers = _.uniq(members, false, (user) => user.username);
        }

        removeUser(user) {
            this.confirmService.confirm("Are you sure?",
                "Do you wish to completely remove " + user.username + " from the organization?",
                'No',
                'Yes').then(() => {
                    this.onConfirm(user);
                });
        }

        onConfirm = (user) => {
            var removes = [];
            var ref = this.scope.teams;
            for (var i = 0, len = ref.length; i < len; i++) {
                var team = ref[i];
                if (_.findWhere(team.members, { username: user.username })) {
                    removes.push(this.teamManager.removeUser(this.organizationSlug, team, user.id));
                }
            }
            this.q.all(removes).then(this.setAllMembers);
        }
    }
}