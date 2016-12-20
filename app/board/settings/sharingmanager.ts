/// <reference path='../../_all.ts' />

module scrumdo {
    export class SharingManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "organizationSlug"
        ];

        private Share: ng.resource.IResourceClass<any>;

        constructor(
            private resource: ng.resource.IResourceService,
            private API_PREFIX,
            private organizationSlug: string) {

            this.Share = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/share/:id",
                {
                    id: '@id',
                    organizationSlug: this.organizationSlug,
                    projectSlug: 'projectSlug'
                },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "project_slug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "project_slug",
                            id: "@id"
                        }
                    }
                });
        }

        updateShare(share, projectSlug) {
            return share.$save({ projectSlug: projectSlug });
        }

        deleteShare(share, projectSlug) {
            return share.$delete({ projectSlug: projectSlug });
        }

        loadShares(projectSlug) {
            return this.Share.query({ projectSlug: projectSlug }).$promise;
        }

        createShare(properties, projectSlug) {
            var share = new this.Share();
            _.extend(share, properties);
            return share.$create({ projectSlug: projectSlug });
        }
    }
}