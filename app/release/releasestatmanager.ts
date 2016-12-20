/// <reference path='../_all.ts' />

module scrumdo {
    
    interface ReleaseChildStatsResource extends ng.resource.IResourceClass<any> {
        getCihldIterationIds(options):any;
    }

    export class ReleaseStatManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ]; 

        private Stats: ng.resource.IResourceClass<any>;
        private ProjectStats: ng.resource.IResourceClass<any>;
        private ReleaseStats: ng.resource.IResourceClass<any>;
        private ProjectIterationStats: ng.resource.IResourceClass<any>;
        private ReleaseChildStats: ReleaseChildStatsResource;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string) {

            this.Stats = this.resource(API_PREFIX + "organizations/:organizationSlug/releasestats");
            this.ProjectStats = this.resource(API_PREFIX + "organizations/:organizationSlug/releasestats/project/:projectSlug");
            this.ProjectIterationStats = this.resource(API_PREFIX + "organizations/:organizationSlug/releasestats/project/:projectSlug/iteration/:iterationId");
            this.ReleaseStats = this.resource(API_PREFIX + "organizations/:organizationSlug/releasestats/:releaseId/all");
            this.ReleaseChildStats = <ReleaseChildStatsResource> this.resource(
                API_PREFIX + "organizations/:organizationSlug/releasestats/project/:projectSlug/iteration/:iterationId/childstats", 
                {

                },
                {
                    getCihldIterationIds: {
                        method: 'GET',
                        isArray: false
                    }
                }
                );
        }

        loadStats(organizationSlug: string, releaseId = null): ng.IPromise<any> {
            if (typeof releaseId === "undefined" || releaseId === null) {
                return this.Stats.query({ organizationSlug: organizationSlug }).$promise;
            } else {
                return this.ReleaseStats.query({ organizationSlug: organizationSlug, releaseId: releaseId }).$promise;
            }
        }

        loadProjectStats(organizationSlug: string, projectSlug: string): ng.IPromise<any> {
            return this.ProjectStats.query({ organizationSlug: organizationSlug , projectSlug: projectSlug}).$promise;
        }

        loadIterationStats(organizationSlug: string, projectSlug: string, iterationId: number): ng.IPromise<any> {
            return this.ProjectIterationStats.query({ organizationSlug: organizationSlug , projectSlug: projectSlug, iterationId: iterationId}).$promise;
        }

        // this one is to featch the info about the child stories 
        // having release set for a specific iteration
        loadReleaseChildStats(organizationSlug: string, projectSlug: string, iterationId: number): ng.IPromise<any> {
            return this.ReleaseChildStats.getCihldIterationIds({ organizationSlug: organizationSlug , projectSlug: projectSlug, iterationId: iterationId}).$promise;
        }
    }
}