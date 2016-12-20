/// <reference path='../_all.ts' />

module scrumdo {
    export class UpgradeWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "project",
            "$http",
            "API_PREFIX",
            "organizationSlug",
            "$window"
        ];

        private mode: string;
        private busyMode: boolean;

        constructor(
            private scope,
            private project,
            private http: ng.IHttpService,
            public API_PREFIX: string,
            public organizationSlug: string,
            public window: ng.IWindowService) {

            this.mode = "try";
            this.busyMode = false;
        }

        upgrade() {
            //this.busyMode = true;
            var url = this.API_PREFIX + "organizations/" + this.organizationSlug + "/classic/projects";
            this.http.post(url, { action: 'upgrade', mode: this.mode, project_slug: this.project.slug }).then(this.onUpgradeStared);
        }

        onUpgradeStared = (result) => {
            this.window.location.assign("/projects/wait/" + result.data.job_id + "?redirect_url=" + (encodeURIComponent(this.window.location.href)));
        }
    }
}