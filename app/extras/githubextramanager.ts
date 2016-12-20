/// <reference path='../_all.ts' />

module scrumdo {
    export class GithubExtraManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "organizationSlug",
            "$http"
        ];

        private Github;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public organizationSlug: string,
            private http: ng.IHttpService) {

            this.Github = this.resource(API_PREFIX + "organizations/:organizationSlug/extras/github",
                { organizationSlug: this.organizationSlug },
                {
                    load: {
                        method: 'GET',
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    loadByProject: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/extras/github",
                        method: 'GET',
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    syncNow: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    }
                });
        }

        syncNow() {
            return this.Github.syncNow({ action: 'sync' }).$promise;
        }

        removeRepoFromProject(projectSlug: string, bindingId) {
            var data = {
                action: 'removeRepo',
                binding: bindingId
            }
            return this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/extras/github", data);
        }

        addRepoToProject(projectSlug: string, form) {
            var data = {
                action: 'addRepo',
                repo: form.name,
                upload_issues: form.upload_issues,
                download_issues: form.download_issues,
                close_on_delete: form.close_on_delete,
                commit_messages: form.commit_messages
            };
            return this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/extras/github", data);
        }

        importProject(form) {
            var data = {
                action: 'importProject',
                project_slug: form.name,
                upload_issues: form.upload_issues,
                download_issues: form.download_issues,
                close_on_delete: form.close_on_delete,
                commit_messages: form.commit_messages
            };
            return this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/extras/github", data);
        }

        save(settings) {
            return settings.$save();
        }

        loadOrganization() {
            return this.Github.load().$promise;
        }

        loadProject(projectSlug: string) {
            return this.Github.loadByProject({ projectSlug: projectSlug }).$promise;
        }
    }
}