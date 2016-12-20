/// <reference path='../../_all.ts' />

module scrumdo {
    export class EmailCardExtraController {
        public static $inject: Array<string> = [
            "$scope",
            "API_PREFIX",
            "$http",
            "boardProject"
        ];

        private extraConfig;

        constructor(
            private scope,
            private API_PREFIX,
            public http: ng.IHttpService,
            private boardProject) {

            this.http.get(this.API_PREFIX + "organizations/" + this.boardProject.organizationSlug +
                "/projects/" + this.boardProject.projectSlug + "/extras/emailcard").then((result) => {
                    this.extraConfig = result.data;
                });
        }
    }
}