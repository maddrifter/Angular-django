/// <reference path='../../_all.ts' />

module scrumdo {
    export class NewTeamController {
        public static $inject: Array<string> = [
            "$scope",
            "teamManager",
            "organizationSlug",
            "$state",
            "mixpanel"
        ];

        private teamName: string;

        constructor(
            private scope,
            private teamManager: TeamManager,
            public organizationSlug: string,
            private state: ng.ui.IStateService,
            private mixpanel) {

            this.teamName = "";
        }

        createTeam() {
            if (this.teamName === '') {
                return;
            }
            this.teamManager.createTeam(this.organizationSlug, { name: this.teamName }).then(this.onTeamCreated);
        }

        onTeamCreated = (team) => {
            this.scope.teams.push(team);
            this.state.go("team", { teamid: team.id });
        }
    }
}