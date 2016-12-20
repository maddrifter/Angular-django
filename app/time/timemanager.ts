/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TimeManager { 
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "organizationSlug",
            "$http",
            "$q"
        ];

        private OrgTimeEntry: ng.resource.IResourceClass<any>;
        private ProjectTimeEntry;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public organizationSlug: string,
            private http: ng.IHttpService,
            private q: ng.IQService) {

            this.OrgTimeEntry = this.resource(API_PREFIX + "organizations/:organizationSlug/time_entries/:id", {
                id: '@id',
                organizationSlug: this.organizationSlug
            });

            this.ProjectTimeEntry = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/time_entries/:id",
                {
                    id: '@id',
                    organizationSlug: this.organizationSlug
                },
                {
                    forCard: {
                        method: 'GET',
                        isArray: true,
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@projectSlug",
                            storyId: "@storyId"
                        },
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/time_entries/story/:storyId"
                    },
                    get: {
                        method: 'GET',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@projectSlug",
                            id: "@id"
                        }
                    },
                    remove: {
                        method: 'DELETE',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@projectSlug",
                            id: "@id"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@projectSlug",
                            id: "@id"
                        }
                    },
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@projectSlug"
                        }
                    }
                }
            );
        }

        getTimeEntriesForCard(projectSlug: string, storyId): ng.IPromise<any> {
            return this.ProjectTimeEntry.forCard({ projectSlug: projectSlug, storyId: storyId }).$promise;
        }

        getTimeEntries(projectSlug: string, userId, startDate, endDate): ng.IPromise<any> {
            startDate = moment(startDate).format("YYYY-MM-DD");
            endDate = moment(endDate).format("YYYY-MM-DD");
            if (typeof projectSlug !== "undefined" && projectSlug !== null) {
                return this.ProjectTimeEntry.query({ projectSlug: projectSlug, user: userId, start: startDate, end: endDate }).$promise;
            } else {
                return this.OrgTimeEntry.query({ organizationSlug: this.organizationSlug, user: userId, start: startDate, end: endDate }).$promise;
            }
        }

        deleteEntry(entry) {
            // added {projectSlug: entry.project_slug}
            // had issue while deleting the entry after slecting any project
            return entry.$remove({projectSlug: entry.project_slug});
        }

        create(projectSlug: string, iterationId, storyId, taskId, date, minutes, notes) {
            var entry = new this.ProjectTimeEntry();
            entry.projectSlug = projectSlug;
            entry.iteration_id = iterationId;
            entry.story_id = storyId;
            entry.task_id = taskId;
            entry.notes = notes;
            entry.date = moment(date).format("YYYY-MM-DD");
            entry.minutes_spent = minutes;
            return entry.$create();
        }
    }
}