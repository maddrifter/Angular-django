/// <reference path='../_all.ts' />

module scrumdo {
    interface IterationResource extends ng.resource.IResourceClass<any> {
        getBlockers:any;
    }
    export class IterationManager {
        public static $inject: Array<string> = [
            "$rootScope",
            "$resource",
            "API_PREFIX",
            "$q"
        ];

        private iterations: {};
        private iterationById: {};
        private IterationStats: ng.resource.IResourceClass<any>;
        private Iteration: IterationResource;
        private CurrentIterations: ng.resource.IResourceClass<any>;

        constructor(
            private rootScope,
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            private q: ng.IQService) {

            this.iterations = {};
            this.iterationById = {};
            this.IterationStats = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iteration_stats/:id", {},
                {
                    get: {
                        method: 'GET'
                    },
                    query: {
                        method: 'GET',
                        isArray: true
                    }
                });

            this.Iteration = <IterationResource> this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:id",
                { id: '@id' },
                {
                    get: {
                        method: 'GET'
                    },
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: "organizationSlug",
                            projectSlug: "projectSlug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: "organizationSlug",
                            projectSlug: "projectSlug"
                        }
                    },
                    getBlockers: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:iterationId/blockers",
                        isArray: true
                    },
                });

            this.CurrentIterations = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/current/iterations",
                this.rootScope.$on('iterationCounts', this.onIterationCounts));
        }

        onIterationCounts = (event, message) => {
            var k, ref, v;
            ref = message.payload;
            for (k in ref) {
                v = ref[k];
                k = parseInt(k);
                if (k in this.iterationById) {
                    this.iterationById[k].story_count = v;
                }
            }
            return;
        }

        deleteIteration(organizationSlug: string, projectSlug: string, iteration) {
            var p = iteration.$remove({ organizationSlug: organizationSlug, projectSlug: projectSlug });
            var iterationId = iteration.id;
            p.then((result) => {
                if (!(projectSlug in this.iterations)) {
                    return;
                }
                var iterationList = this.iterations[projectSlug];
                var i: number = iterationList.indexOf(iteration);
                if (i !== -1) {
                    iterationList.splice(i, 1);
                }
                //location.replace("/projects/" + projectSlug + "/board#/view");
            });

            return p;
        }

        createIteration(organizationSlug: string, projectSlug: string, iteration) {
            var newIteration = new this.Iteration();
            _.extend(newIteration, iteration);
            if ("id" in newIteration) {
                delete newIteration.id;
            }

            var p = newIteration.$create({ projectSlug: projectSlug, organizationSlug: organizationSlug });
            p.then((iteration) => {
                this.iterationById[iteration.id] = iteration;
                this.iterations[projectSlug].push(iteration);
            });

            return p;
        }

        saveIteration(organizationSlug: string, projectSlug: string, iteration) {
            return iteration.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }

        loadStats(organizationSlug: string, projectSlug: string) {
            return this.IterationStats.query({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }

        loadStatsForIteration(organizationSlug: string, projectSlug: string, iterationId): ng.IPromise<any> {
            return this.IterationStats.get({ organizationSlug: organizationSlug, projectSlug: projectSlug, id: iterationId }).$promise;
        }

        loadIteration(organizationSlug: string, projectSlug: string, iterationId) {
            return this.Iteration.get({ organizationSlug: organizationSlug, projectSlug: projectSlug, id: iterationId });
        }

        loadCurrentIterations(organizationSlug: string, projectSlug: string): ng.IPromise<any> {
            return this.CurrentIterations.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
        }

        private cachedIterationLoads = {};
        loadIterations(organizationSlug: string, projectSlug: string, reload = false): ng.IPromise<any> {
            let key = organizationSlug + ":" + projectSlug;

            if (key in this.cachedIterationLoads && reload == false) {
                return this.cachedIterationLoads[key];
            } else {
                let p = this.Iteration.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
                p.then((iterations) => {
                    for (var i = 0, len = iterations.length; i < len; i++) {
                        let iteration:Iteration = iterations[i];
                        this.iterationById[iteration.id] = iteration;
                    }

                    this.iterations[projectSlug] = iterations;
                });
                this.cachedIterationLoads[key] = p;
                return p;
            }
        }

        public getBlockers(organizationSlug:string, projectSlug:string, iterationId:number){
            return this.Iteration.getBlockers({organizationSlug: organizationSlug, projectSlug: projectSlug, iterationId: iterationId}).$promise;
        }
    }
}