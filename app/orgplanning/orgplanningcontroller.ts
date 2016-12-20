/// <reference path='../_all.ts' />

module scrumdo {
    export class OrgPlanningController {
        public static $inject: Array<string> = [
            "$scope",
            "$state",
            "$http",
            "API_PREFIX",
            "organizationSlug",
            "projectManager",
            "$window"
        ];

        private organization;

        constructor(
            private scope,
            private state: ng.ui.IStateService,
            private http: ng.IHttpService,
            public API_PREFIX: string,
            public organizationSlug: string,
            private projectManager,
            public window: ng.IWindowService) {

            this.scope.$on("accessChanged", this.checkAccess);
            this.scope.navType = "planning";
            this.http.get(API_PREFIX + "organizations/" + organizationSlug).then((result) => {
                this.organization = result.data;
                this.checkAccess();
            });
        }

        enableReleases() {
            this.http.put(this.API_PREFIX + "organizations/" + this.organizationSlug, { planning_mode: 'release' }).then((result) => {
                this.state.go('releases');
            });
        }

        enablePortfolio() {
            this.http.put(this.API_PREFIX + "organizations/" + this.organizationSlug, { planning_mode: 'portfolio' }).then((result) => {
                this.goToPortfolio();
            });
        }

        checkAccess = () => {
            var mode, ref, ref1;

            if ((this.scope.user != null) && (this.organization != null)) {
                this.scope.$root.$emit('fullyLoaded');
                if (!this.organization.subscription.plan.premium_plan) {
                    return this.state.go('upgrade');
                }
                if (this.state.current.name === '') {
                    mode = (ref = this.scope.user) != null ? (ref1 = ref.organization) != null ? ref1.planning_mode : void 0 : void 0;
                    if (mode === 'unset') {
                        this.state.go('setup');
                    } else if (mode === 'release') {
                        this.state.go('releases');
                    } else if (mode === 'portfolio') {
                        this.goToPortfolio();
                    }
                }
            }
        }

        goToPortfolio() {
            // TODO - we can probably do this more efficiently than loading the project an extra time.
            this.projectManager.loadProject(this.organizationSlug, "__releases__").then((project) => {
                window.location.assign("/projects/" + project.slug + "/board");
            });
        }
    }
}