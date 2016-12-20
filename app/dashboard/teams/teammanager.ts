/// <reference path='../../_all.ts' />

module scrumdo {

    interface ProjectTeamsResource extends ng.resource.IResourceClass<any>{
        getTeams: any;
    }

    export class TeamManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "$http"
        ];

        private teams;
        private teamLists: Array<any>;
        private AllUsers: ng.resource.IResourceClass<any>;
        private Team: ng.resource.IResourceClass<any>;
        private ProjectTeams: ProjectTeamsResource;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            private http: ng.IHttpService) {

            this.teams = {};
            this.teamLists = [];
            this.AllUsers = this.resource(this.API_PREFIX + "organizations/:organizationSlug/users");
            this.Team = this.resource(this.API_PREFIX + "organizations/:organizationSlug/teams/:id",
                {
                    id: '@id',
                    organizationSlug: 'organizationSlug'
                },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: 'organizationSlug'
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: 'organizationSlug',
                            id: "@id"
                        }
                    }
                }
            );
            this.ProjectTeams = <ProjectTeamsResource> this.resource(this.API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/teams", {}, {
                'getTeams': {
                    isArray: false
                }
            });
        }

        allUsers(organizationSlug: string): ng.IPromise<any> {
            return this.AllUsers.query({ organizationSlug: organizationSlug }).$promise;
        }

        deleteTeam(organizationSlug: string, team) {
            var p = team.$delete({ organizationSlug: organizationSlug });
            var teamId = team.id;
            p.then(() => {
                this.onTeamDeleted(teamId);
            });
            return p;
        }

        onTeamDeleted = (teamid) => {
            delete this.teams[teamid];
            var badEntries, i, j, len, ref, teamList;
            ref = this.teamLists;
            for (i = 0, len = ref.length; i < len; i++) {
                teamList = ref[i];
                badEntries = _.filter(teamList, (t) => t['id'] == null);
                for (j = 0, len = badEntries.length; j < len; j++) {
                    var entry = badEntries[j];
                    i = teamList.indexOf(entry);
                    teamList.splice(i, 1);
                }
            }
        }

        createTeam(organizationSlug: string, properties) {
            var team = new this.Team();
            _.extend(team, properties);
            var p = team.$create({ organizationSlug: organizationSlug });
            p.then(this.onTeamChanged);
            return p;
        }

        updateTeam(organizationSlug: string, team) {
            var p = team.$save({ organizationSlug: organizationSlug });
            p.then(this.onTeamChanged);
            return p;
        }

        addProject(organizationSlug: string, team, projectSlug: string) {
            return this.http.post(this.API_PREFIX + "organizations/" + organizationSlug + "/teams/" + team.id + "/addproject", {
                project_slug: projectSlug
            }).success(this.onTeamChanged);
        }

        removeProject(organizationSlug: string, team, projectSlug: string) {
            return this.http.post(this.API_PREFIX + "organizations/" + organizationSlug + "/teams/" + team.id + "/removeproject", {
                project_slug: projectSlug
            }).success(this.onTeamChanged);
        }

        removeUser(organizationSlug: string, team, userId) {
            return this.http.post(this.API_PREFIX + "organizations/" + organizationSlug + "/teams/" + team.id + "/removeuser", {
                user_id: userId
            }).success(this.onTeamChanged);
        }

        inviteUser(organizationSlug: string, team, users) {
            var p = this.http.post(this.API_PREFIX + "organizations/" + organizationSlug + "/teams/" + team.id + "/inviteuser", {
                users: users
            });
            p.success((response) => {
                this.onInvited(response, users);
            });
            return p;
        }

        onInvited = (response, users) => {
            this.onTeamChanged(response.team);
        }

        onTeamChanged = (team) => {
            var oldTeam = this.getTeam(team.id);
            if (typeof oldTeam !== "undefined" && oldTeam !== null) {
                if (team !== oldTeam) {
                    angular.copy(team, oldTeam);
                }
            } else {
                this.teams[team.id] = team;
            }
        }

        getTeam(teamId) {
            return this.teams[teamId];
        }

        loadTeams(organizationSlug: string) {
            var p = this.Team.query({ organizationSlug: organizationSlug }).$promise;
            p.then((teams) => {
                for (var i = 0, len = teams.length; i < len; i++) {
                    var team = teams[i];
                    this.teams[team.id] = team;
                }
                this.teamLists.push(teams);
            });
            return p;
        }

        loadProjectTeams(organizationSlug:string, projectSlug:string){
            var p = this.ProjectTeams.getTeams({organizationSlug:organizationSlug, projectSlug:projectSlug}).$promise;
            return p;
        }
    }
}