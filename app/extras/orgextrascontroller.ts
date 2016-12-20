/// <reference path='../_all.ts' />

module scrumdo {
    export class OrgExtrasController {
        public static $inject: Array<string> = [
            "$scope",
            "$state",
            "githubExtraManager",
            "teamManager",
            "alertService",
            "organizationSlug",
            "$window"
        ];

        private state;
        private loaded: boolean;
        private showSync: boolean;
        private githubImport: {
            name: string,
            commit_messages: boolean,
            upload_issues: boolean,
            download_issues: boolean,
            close_on_delete: boolean
        };
        private teams;
        private orgExtra;
        private editOrg;

        constructor(
            private scope,
            public stateProvider,
            private githubManager: GithubExtraManager,
            private teamManager,
            public alertService: AlertService,
            private organizationSlug: string,
            private window) {

            this.scope.$on('$stateChangeStart', this.onStateChange);
            this.state = this.stateProvider.current.name;
            this.scope.$root.$emit('fullyLoaded');
            this.scope.navType = 'extras';
            this.loaded = false;
            this.showSync = true;
            this.githubImport = {
                name: '',
                commit_messages: true,
                upload_issues: false,
                download_issues: false,
                close_on_delete: false
            };
            this.githubManager.loadOrganization().then(this.onOrgLoaded);
        }

        onTeamsLoaded = (teams) => {
            this.teams = teams;
        }

        onOrgLoaded = (orgData) => {
            this.orgExtra = orgData;
            this.loaded = true;
            this.editOrg = orgData.github_organization_name == '';
        }

        setGithubOrganization() {
            this.saveSettings();
        }

        onStateChange = (event, toState, toParams, fromState, fromParams) => {
            this.state = toState.name;
        }

        saveTeams() {
            this.saveSettings();
        }

        saveSettings() {
            this.githubManager.save(this.orgExtra).then(this.onOrgLoaded);
        }

        translatePermission(permission) {
            if (permission === 'admin') {
                return 'Admin';
            }
            if (permission === 'pull') {
                return 'Read Only';
            }
            return 'Read/Write';
        }

        syncNow() {
            this.githubManager.syncNow();
            this.showSync = false;
        }
        
        importGithubProject(form) {
            this.githubManager.importProject(form).then(() => {
                this.alertService.alert('Project Imported', "You can now view this project in your organization dashboard.");
            });
        }

        public search = (query) => {
            var q, url;
            q = encodeURIComponent(query);
            url = "/projects/org/" + this.organizationSlug + "/search?q=" + q;
            return this.window.location.assign(url);
        }
    }
}