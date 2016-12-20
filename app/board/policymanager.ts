/// <reference path='../_all.ts' />

module scrumdo {
    export class PolicyManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ];

        public Policy: ng.resource.IResourceClass<any>;

        constructor(
            public resource: ng.resource.IResourceService,
            public API_PREFIX: string) {

            this.Policy = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/policy/:id",
                {
                    id: '@id',
                    organizationSlug: 'organizationSlug',
                    projectSlug: 'projectSlug'
                },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "project_slug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "project_slug",
                            id: "@id"
                        }
                    }
                }
            );
        }

        loadPolicies(organizationSlug: string, projectSlug: string): ng.IPromise<any> {
            return this.Policy.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
        }

        savePolicy(policy, organizationSlug: string, projectSlug: string) {
            var p = policy.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            return p;
        }

        createPolicy(properties, organizationSlug: string, projectSlug: string) {
            var policy = new this.Policy();
            _.extend(policy, properties);
            return policy.$create({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }
    }
}