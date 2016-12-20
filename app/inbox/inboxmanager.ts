/// <reference path='../_all.ts' />

module scrumdo {

    export interface InboxEntry {
        status: number;
        body: any;
        subject: string;
        created: string;
    }

    export interface InboxGroupStatic {
        id:number;
        date: string;
        story:Story;
        entries:Array<InboxEntry>;
        projectSummary:boolean;
    }

    export interface InboxGroup extends InboxGroupStatic, ng.resource.IResource<InboxGroup>  {
    }

    export interface PagedInboxGroup extends ng.resource.IResource<PagedInboxGroup> {
        items:Array<InboxGroup>;
        max_page: number;
        count: number;
        current_page: number;
    }

    interface PagedInboxGroupResource extends ng.resource.IResourceClass<PagedInboxGroup> {
    }

    export class InboxManager {

        public static $inject:Array<string> = ["$resource",
            "API_PREFIX",
            "$q",
            "organizationSlug",
            "$rootScope",
            "storyManager"];


        private inboxApi:PagedInboxGroupResource
        public groups:{} = {};


        constructor(public resource:ng.resource.IResourceService,
                    public API_PREFIX:string,
                    public $q:ng.IQService,
                    public organizationSlug:string,
                    public $rootScope:ng.IScope,
                    protected storyManager) {

            this.inboxApi = <PagedInboxGroupResource> this.resource(API_PREFIX +
                "organizations/:organizationSlug/projects/:projectSlug/inbox/:groupId",
                {
                    projectSlug: "@slug",
                    groupId: "@groupId",
                    organizationSlug: this.organizationSlug
                });

            $rootScope.$on('storyModified', this.onStoryModified);

        }

        protected findStory(storyId:number):Array<Story> {
            var rv:Array<Story> = [];
            for(var k in this.groups) {
                var group:InboxGroup = this.groups[k];
                if(group.story && group.story.id == storyId) {
                    rv.push(group.story);
                }
            }

            return rv;
        }

        protected onStoryModified = (event, story) => {
            for(var oldStory of this.findStory(story.id)) {
                _.extend(oldStory, story);
            }
        }

        public deleteGroup(projectSlug:string, group:InboxGroup) {
            this.inboxApi.delete({projectSlug:projectSlug, groupId:group.id})
            delete this.groups[group.id];
            this.$rootScope.$broadcast('inboxGroupDeleted', group.id);
        }

        public loadInbox = (projectSlug:string, lastRecord=0)=> {
            var promise = this.inboxApi.get({projectSlug:projectSlug, perPage:15, lastRecord:lastRecord}).$promise;
            promise.then((result)=>{
                result.items.forEach((group:InboxGroup)=>{
                    this.groups[group.id] = group;
                });
            });

            return promise;
        }


        public addCachedGroup(group:InboxGroupStatic) {
            this.groups[group.id] = group;
        }

        public getCachedGroup(id:number):InboxGroup {
            if(id in this.groups) {
                return this.groups[id];
            } else {
                return null;
            }
        }

    }
}