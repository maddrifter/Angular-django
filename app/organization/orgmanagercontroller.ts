/// <reference path='../_all.ts' />

module scrumdo {
    export class orgManagerController {
        public static $inject: Array<string> = [
            "$scope",
            "$http",
            "organizationSlug",
            "confirmService",
            "API_PREFIX"
        ];

        constructor(
            private scope,
            private http: ng.IHttpService,
            public organizationSlug: string,
            public confirmService: ConfirmationService,
            public API_PREFIX: string) {

            this.scope.ctrl = this;
            this.scope.deleteOrgUrl = "/organization/" + organizationSlug + "/delete/"; 
        }

        deleteProject() {
            this.confirmService.confirm("DANGER: Delete Organization?",
                "Are you really sure you want to delete this organization and all of it's projects?",
                "Cancel",
                "Delete Organization",
                "tertiary").then(() => {
                    $("#deleteForm").submit();
                });
        }
    }
}