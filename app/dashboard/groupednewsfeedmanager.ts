/// <reference path='../_all.ts' />

module scrumdo {
    export class GroupedNewsfeedManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ];

        private News: ng.resource.IResourceClass<any>;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string) {

            this.News = this.resource(API_PREFIX + "organizations/:organizationSlug/newsfeed/grouped/:start/:end");
        }

        loadNewsForOrganization(organizationSlug: string, start, end): ng.IPromise<any> {
            return this.News.query({ organizationSlug: organizationSlug, start: start, end: end }).$promise;
        }
    }
}