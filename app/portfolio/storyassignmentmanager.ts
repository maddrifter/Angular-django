/// <reference path='../_all.ts' />

module scrumdo {

    export interface PagedMiniReleaseResponse {
        max_page: number;
        count: number;
        current_page: number;
        items: Array<MiniRelease>;
    }


    export class StoryAssignmentManager {
        public static $inject:Array<string> = [
            "$http",
            "API_PREFIX",
            "organizationSlug"
        ];

        constructor(private $http:ng.IHttpService,
                    private API_PREFIX:string,
                    private organizationSlug:string) {
        }

        public loadPossibleAssignments(projectSlug:string,
                                       storyId:number,
                                       parentSlug:string,
                                       query:string='',
                                       pageSize:number=100,
                                       pageToLoad:number=1):ng.IHttpPromise<PagedMiniReleaseResponse> {
            let url = API_PREFIX + `organizations/${this.organizationSlug}/projects/${projectSlug}/stories/assignmentoption/${storyId}/`;

            return this.$http.get(url,{
                params:{
                    parent: parentSlug,
                    query: query,
                    page:pageToLoad,
                    perPage:pageSize
                }
            });
        }

        public loadAssignments(incrementId:number,
                               teamSlug:string):ng.IHttpPromise<Array<number>> {
            let url = API_PREFIX + `organizations/${this.organizationSlug}/projects/${teamSlug}/increment/${incrementId}/assignments`;
            return this.$http.get(url);
        }

        public createAssignment(incrementId:number,
                                 teamSlug:string,
                                 storyId:number):ng.IHttpPromise<Array<number>> {
            let url = API_PREFIX + `organizations/${this.organizationSlug}/projects/${teamSlug}/increment/${incrementId}/assignments/${storyId}`;
            return this.$http.post(url, {});
        }

        public removeAssignment(incrementId:number,
                                 teamSlug:string,
                                 storyId:number):ng.IHttpPromise<Array<number>> {
            let url = API_PREFIX + `organizations/${this.organizationSlug}/projects/${teamSlug}/increment/${incrementId}/assignments/${storyId}`;
            return this.$http.delete(url);
        }

    }
}