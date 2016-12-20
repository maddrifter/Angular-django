/// <reference path='../_all.ts' />

module scrumdo {
    export class PlanningReleaseController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "projectSlug",
            "storyEditor",
            "projectManager",
            "organizationSlug",
            "userService"
        ];

        private project;
        private sortOrder;
        private isExpanded: boolean;
        private stories;
        private totalPoints: number;
        private totalMinutes: number;
        private businessValue: number;

        constructor(
            private scope,
            private storyManager,
            public projectSlug: string,
            private storyEditor,
            private projectManager,
            public organizationSlug: string,
            private userService: UserService) {

            this.isExpanded = false;
            this.scope.$watch("filter", this.onFilterChanged);
            this.scope.$on('storyModified', this.setTotals);
            this.scope.$on('sortOrderChanged', this.onSortChange);

            projectManager.loadProject(organizationSlug, '__releases__').then((project) => {
                this.project = project;
            });
        }

        onSortChange = (event, sort) => {
            if (sort === 'value_time') {
                this.sortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
            } else if (sort === 'value_point') {
                this.sortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];
            } else if (sort === 'wsjf_value') {
                this.sortOrder = calculateWSJFValue;
            } else if (sort !== "rank") {
                this.sortOrder = [sort, "release_rank"];
            } else if (sort === "rank") {
                this.sortOrder = "release_rank";
            } else {
                this.sortOrder = sort;
            }
        }

        editRelease() {
            this.storyEditor.editStory(this.scope.release, this.project, false, true).then((story) => {
                angular.copy(story, this.scope.release);
            });
        }

        addCard() {
            this.storyEditor.createStory(this.scope.project, { release: this.scope.release });
        }

        selectAll(event) {
            this.scope.$broadcast("selectAll");
        }

        selectNone(event) {
            this.scope.$broadcast("selectNone");
        }

        onAutoOpen = () => {
            if (this.scope.autoOpen && !this.isExpanded) {
                this.toggleExpanded();
            }
        }

        onFilterChanged = () => {
            if (!this.isExpanded) {
                return;
            }
            this.loadStories();
        }

        toggleExpanded() {
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded) {
                this.loadStories();
            }
        }

        loadStories() {
            if (this.scope.release == null) {
                return;
            }

            this.storyManager.loadStoriesForRelease(this.projectSlug, this.scope.release.id).then(this.setStories);
        }

        setStories = (stories) => {
            this.stories = stories;
            this.setTotals();
            this.scope.$emit("storiesChanged");
        }

        setTotals = () => {
            var ref = getStoryTotals(this.stories);
            this.totalPoints = ref[0];
            this.totalMinutes = ref[1];
            this.businessValue = ref[2];
        }

        todoPercentage(stats) {
            var todo = stats.cards_total - stats.cards_completed - stats.cards_in_progress;
            return this.percentage(todo, stats.cards_total);
        }

        percentage(val, total) {
            if (total === 0 || (typeof total === "undefined" || total === null)) {
                return 0;
            }
            return Math.round(100 * val / total);
        }
    }
}