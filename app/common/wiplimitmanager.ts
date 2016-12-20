/// <reference path='../_all.ts' />

module scrumdo {

    export interface Limits {
        featureLimit:number;
        featurePointLimit:number;
        cardLimit?:number;
        cardPointLimit?:number;
    }

    export class WIPLimitManager {
        public static $inject:Array<string> = [
            "$http", "organizationSlug", "API_PREFIX"
        ];

        constructor(private $http:ng.IHttpService,
                    private organizationSlug:string,
                    private API_PREFIX:string) {

        }

        private url(projectSlug:string, iterationId:number):string {
            return `${this.API_PREFIX}organizations/${this.organizationSlug}/projects/${projectSlug}/iterations/${iterationId}/wiplimit/`;
        }
        
        public getLimits(projectSlug:string, iterationId:number):ng.IHttpPromise<Limits> {
            return this.$http.get(this.url(projectSlug, iterationId));
        }

        public setLimits(projectSlug:string, iterationId:number, limits:Limits):ng.IHttpPromise<Limits> {
            return this.$http.post(this.url(projectSlug, iterationId), limits);
        }


    }
}