/// <reference path='../_all.ts' />

module scrumdo {

    /**
     * An abrieviated version of an iteration used in the program increment calls.
     */
    export interface IncrementIteration {
        project_name: string,
        project_slug: string,
        project_icon?:string;
        project_color?:string;
        iteration_name: string,
        iteration_id: number,
        cards_in_progress: number,
        cards_total: number,
        cards_completed: number,
    }

    export interface ProgramIncrementSchedule {
        id:number;
        start_date: string,
        end_date: string,
        default_name: string,
        iterations: Array<IncrementIteration>;
    }

    export interface ProgramIncrement extends ng.resource.IResource<ProgramIncrement> {
        id: number,
        iteration_id: number,
        name:string,
        start_date:string,
        end_date:string,
        schedule:Array<ProgramIncrementSchedule>;

        $save();
        $create(options):ng.IPromise<ProgramIncrement>;
    }

    interface ProgramIncrementResource extends ng.resource.IResourceClass<ProgramIncrement> {
        load(options): any,
        byIteration(options):any;
    }

    export class ProgramIncrementManager {
        public static $inject:Array<string> = [
            "organizationSlug",
            "$resource",
            "API_PREFIX"
        ];

        private incrementApi:ProgramIncrementResource;
        private incrementScheduleApi: ng.resource.IResourceClass<any>;

        constructor(private organizationSlug,
                    private resource:ng.resource.IResourceService,
                    private API_PREFIX:string) {

            this.incrementApi = <ProgramIncrementResource> this.resource(
                this.API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/increment/:incrementId",
                {
                    incrementId: "@id",
                    projectSlug: "@project_slug",
                    organizationSlug: this.organizationSlug
                },
                {
                    byIteration: {
                        method: "GET",
                        url: this.API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/increment_by_iteration/:iterationId",
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    load: {
                        method: 'GET',
                        isArray: false,
                        params: {
                            organizationSlug: this.organizationSlug,
                        }
                    },
                    "delete": {
                        method: "DELETE",
                        params: {
                            incrementId: "@id",
                            organizationSlug: this.organizationSlug
                        }
                    },
                    create: {
                        method: "POST",
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    save: {
                        method: "PUT",
                        params: {
                            incrementId: "@id",
                            organizationSlug: this.organizationSlug
                        }
                    }
                });

            this.incrementScheduleApi = this.resource(
                this.API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/increment/:incrementId/schedule/:scheduleId",
                {
                    scheduleId: "@id",
                    organizationSlug: this.organizationSlug
                },
                {
                    create: {
                        method: "POST",
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    save: {
                        method: "PUT",
                        params: {
                            scheduleId: "@id",
                            organizationSlug: this.organizationSlug
                        }
                    },
                    "delete": {
                        method: "DELETE",
                        params: {
                            scheduleId: "@id",
                            organizationSlug: this.organizationSlug
                        }
                    },
                });
        }

        public getIncrementByIteration(projectSlug:string, iterationId:number):ng.IPromise<any> {
            return this.incrementApi.byIteration({projectSlug:projectSlug, iterationId:iterationId}).$promise;
        }

        public deleteIncrement(increment):ng.IPromise<any> {
            return increment.$delete();
        }

        public updateIncrement(increment):ng.IPromise<any> {
            return increment.$save();
        }

        public createIncrement(projectSlug:string, incrementProperties):ng.IPromise<ProgramIncrement> {
            let increment:ProgramIncrement = new this.incrementApi();
            _.extend(increment, incrementProperties);
            return increment.$create({projectSlug: projectSlug});
        }

        public loadIncrements(projectSlug:string):ng.IPromise<any> {
            return this.incrementApi.get({projectSlug:projectSlug}).$promise;
        }

        public loadIncrement(projectSlug:string, incrementId:number):ng.IPromise<any> {
            return this.incrementApi.load({projectSlug:projectSlug, incrementId:incrementId}).$promise;
        }

        public createIncrementSchedule(projectSlug:string, incrementId:number, scheduleProperties):ng.IPromise<any>{
            let schedule = new this.incrementScheduleApi();
            _.extend(schedule, scheduleProperties);
            return schedule.$create({projectSlug: projectSlug, incrementId:incrementId});
        }

        public updateIncrementSchedule(projectSlug:string, incrementId:number, scheduleProperties):ng.IPromise<any>{
            let schedule = new this.incrementScheduleApi();
            _.extend(schedule, scheduleProperties);
            return schedule.$save({projectSlug: projectSlug, incrementId:incrementId});
        }

        public deleteIncrementSchedule(projectSlug:string, incrementId:number, scheduleProperties):ng.IPromise<any>{
            let schedule = new this.incrementScheduleApi();
            _.extend(schedule, scheduleProperties);
            return schedule.$delete({projectSlug: projectSlug, incrementId:incrementId});
        }
    }
}