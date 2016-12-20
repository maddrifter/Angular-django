/// <reference path='../_all.ts' />


module scrumdo {

    interface StoryFeatureScope extends ng.IScope{
        project: Project;
        story: Story;
        layout: string;
        ctrl: Object;
    }

    export class StoryFeatureController {
        public static $inject: Array<string> = [
            "$scope",
            "$attrs",
            "$element",
            "$timeout",
            "urlRewriter",
            "teamAssignService",
            "organizationSlug",
            "userService",
            "storyManager",
            "storyAssignmentManager"
        ];

        public templateName: string;
        public popoverTemplate: string;
        public listLayout: boolean;
        public releaseStats;
        public featureStories: Array<Story>;
        public loadingFeatureStories:boolean;

        constructor(
            public scope: StoryFeatureScope,
            public attrs,
            public element: ng.IAugmentedJQuery,
            public timeout: ng.ITimeoutService,
            public urlRewriter: URLRewriter,
            public teamAssignService: TeamAssignService,
            public organizationSlug: string,
            public userService: UserService,
            public storyManager: StoryManager,
            public storyAssignmentManager: StoryAssignmentManager) {

            this.scope.ctrl = this;
            this.templateName = '';
            this.setLayout();
            this.setPopoverTemplate();
            this.releaseStats = this.scope.$root["releaseStats"];
            this.loadingFeatureStories = false;
        }

        setLayout = () => {
            var layout = this.scope.layout;
            if (layout == null) {
                layout = 'feature';
            }

            this.templateName = this.urlRewriter.rewriteAppUrl("story/story_" + layout + ".html");
            this.listLayout = layout === 'list';
        }

        setPopoverTemplate(){
            this.popoverTemplate = this.urlRewriter.rewriteAppUrl("story/story_feature_list_popover.html");
        }

        story() : Story{
            return this.scope.story;
        }

        todoPercentage(stats) {
            var todo = stats.cards_total - stats.cards_completed - stats.cards_in_progress
            return this.percentage(todo, stats.cards_total);
        }

        percentage(val, total) {
            return Math.round(100 * val / total);
        }

        loadFeatureStories(){
            this.loadingFeatureStories = true;
            this.storyManager.loadStoriesByReleaseId(this.scope.project.slug, this.scope.story.id).then((stories) => {
                this.loadingFeatureStories = false;
                this.featureStories = stories;
            })
        }
    }
}
