/// <reference path='../_all.ts' />

module scrumdo {
    export class StoryBlockersController {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "$scope",
            "story",
            "project",
            "blocker",
            "organizationSlug",
            "storyManager",
            "userService",
            "$uibModalInstance"
        ];

        public blockedReason: string;
        public busyMode:boolean = false;
        public blockedReasons: Array<string> = [];
        public Blocker: ng.resource.IResourceClass<any>;
        public isExternal: boolean = false;

        constructor(
            public resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public scope,
            public story,
            public project,
            public blocker: StoryBlocker,
            public organizationSlug: string,
            public storyManager: StoryManager,
            public userService: UserService,
            public blockModal: ng.ui.bootstrap.IModalServiceInstance) {

            this.blockedReason = '';

            if (this.blocker != null) {
                this.blocker.resolution = '';
            }else{
                this.busyMode = true;
                this.loadBlockerReasons();
            }

            this.Blocker = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/blockers/blocker",
                {
                    organizationSlug: this.organizationSlug
                }, {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug",
                            storyId: "storyId"
                        }
                    },
                    save: {
                        method: 'PUT',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/blockers/:blocker_id",
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug",
                            storyId: "storyId",
                            blocker_id: "@id"
                        }
                    }
                }
            );
        }

        loadBlockerReasons() {
            this.storyManager.blockerReasons(this.story).then((result) => {
                this.blockedReasons = result;
                this.busyMode = false;
            });
        }

        blockStory() {
            var blocker = new this.Blocker();
            this.busyMode = true;
            _.extend(blocker, { reason: this.blockedReason, external:this.isExternal });
            var p = blocker.$create({ storyId: this.story.id, projectSlug: this.story.project_slug, organizationSlug: this.organizationSlug });
            p.then(() => {
                this.blockModal.close();
                this.scope.$root.$broadcast('blockerEntryCreated', {});
                this.story.blocked = true;
            });
        }

        resolveBlocker() {
            var blocker = new this.Blocker();
            this.busyMode = true;
            _.extend(blocker, this.blocker);
            var p = blocker.$save({ storyId: this.story.id, projectSlug: this.story.project_slug, organizationSlug: this.organizationSlug });
            p.then((result) => {
                this.blockModal.close();
                this.scope.$root.$broadcast('blockerEntryCreated', {});
            });
        }
    }
}