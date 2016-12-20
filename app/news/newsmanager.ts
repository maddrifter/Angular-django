/// <reference path='../_all.ts' />

module scrumdo {
    export class NewsManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ];

        private NewsByStory: ng.resource.IResourceClass<any>;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string) {

            this.NewsByStory = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/news/:newsId");
        }

        loadNewsForStory(organizationSlug: string, projectSlug: string, storyId): ng.IPromise<any> {
            return this.NewsByStory.query({ organizationSlug: organizationSlug, projectSlug: projectSlug, storyId: storyId }).$promise;
        }
    }
}