/// <reference path='../_all.ts' />

module scrumdo {
    export class ExtrasManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "organizationSlug"
        ];

        private ExternalStoryMapping;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public organizationSlug: string) {

            this.ExternalStoryMapping = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/links/",
                { organizationSlug: this.organizationSlug },
                {
                    byStory: {
                        method: 'GET',
                        isArray: true,
                        params: {
                            organizationSlug: this.organizationSlug
                        },
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/links/"
                    }
                });
        }

        load(projectSlug: string) {
            return this.ExternalStoryMapping.query({ projectSlug: projectSlug }).$promise;
        }

        loadForStory(projectSlug: string, storyId: number) {
            return this.ExternalStoryMapping.byStory({ projectSlug: projectSlug, storyId: storyId }).$promise;
        }
    }
}