/// <reference path='../../_all.ts' />
module scrumdo {

    export interface DependencyLink {
        story: number;
        dependency: number;
    }

    export interface DependencyStory {
        time_criticality: string;
        rank: number;
        assignee: Array<User>;
        iteration_id: number;
        id: number;
        blocked: boolean;
        category: string;
        risk_reduction: string;
        has_external_links: boolean;
        task_counts: string;
        points_value: number;
        detail: string;
        cell: any;
        comment_count: number;
        labels: Array<Label>;
        tags: string;
        epic_label: string;
        business_value: number;
        created: string;
        iteration: Iteration,
        modified: string;
        summary:  string;
        project: {
            id: number;
            slug: string;
            name: string;
            prefix: string;
        },
        points:  string;
        extra_1: string;
        extra_2: string;
        extra_3: string;
    }

    export interface DependencyResult {
        dependent_on:Array<DependencyStory>;
        dependent_to:Array<DependencyStory>;
    }

    export class DependencyManager {
        public static $inject: Array<string> = [
            "$http",
            "API_PREFIX",
            "organizationSlug"
        ];

        constructor(private $http:ng.IHttpService,
                    private API_PREFIX: string,
                    private organizationSlug:string) {
        }

        addDependencies(storyId:number, stories:Array<{id:number}>):ng.IHttpPromise<DependencyResult> {
            let url = this.API_PREFIX + `dependencies/story/${storyId}/dependency/`;
            return this.$http.post(url, {dependencies:stories});
        }

        removeDependency(storyId:number, dependentStoryId:number):ng.IHttpPromise<DependencyResult> {
            let url = this.API_PREFIX + `dependencies/story/${storyId}/dependency/${dependentStoryId}`;
            return this.$http.delete(url);
        }

        loadDependencies(storyId: number):ng.IHttpPromise<DependencyResult> {
            let url = this.API_PREFIX + `dependencies/story/${storyId}/dependency/`;
            return this.$http.get(url);
        }

        loadIncrementDependencies(incrementId: number):ng.IHttpPromise<Array<DependencyLink>> {
            let url = this.API_PREFIX +
                `organizations/${this.organizationSlug}/increment/${incrementId}/dependencies/`;

            return this.$http.get(url);
        }

    }
}