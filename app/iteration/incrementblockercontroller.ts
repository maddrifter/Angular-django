/// <reference path='../_all.ts' />

module scrumdo {

    interface IncrementBlockersScope extends ng.IScope{
        increment: Iteration;
        project: Project;
    }

    export class IncrementBlockersController {

        public static $inject:Array<string> = [
            '$scope',
            "organizationSlug",
            "projectSlug",
            "iterationManager",
            "storyEditor"

        ];

        private blockers: Array<StoryBlocker>;
        private scrollbarConfig: {};

        constructor(public $scope:IncrementBlockersScope,
                    public organizationSlug:string,
                    public projectSlug: string,
                    public iterationManager: IterationManager,
                    public storyEditor:StoryEditor) {
            this.blockers = [];
            this.loadBlockers();
            this.scrollbarConfig = {
                autoHideScrollbar: false, 
                theme: 'dark-3',
                advanced:{
                    updateOnContentResize: true
                },
                scrollButtons: {
                    enable: true
                },
                setHeight: 200,
                scrollInertia: 500
            };
            var _reloadBlockers = _.debounce(this.loadBlockers, 500);
            this.$scope.$on("blockerEntryCreated", _reloadBlockers);
        }

        private loadBlockers = () => {
            this.iterationManager.getBlockers(this.organizationSlug, this.projectSlug, this.$scope.increment.id).then((blockers) => {
                this.blockers = blockers;
            });
        }

        public editStory(blocker: StoryBlocker) {
            this.storyEditor.editStory(blocker.card, this.$scope.project);
        }
    }
}