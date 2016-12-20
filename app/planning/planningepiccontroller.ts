/// <reference path='../_all.ts' />

module scrumdo {
    export class PlanningEpicController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "projectSlug",
            "storyEditor",
            "epicWindowService",
            "$localStorage"
        ];

        private sortOrder: any = "rank";
        private epicSortOrder: any = "epic_rank";
        private stories: Array<any>;
        private totalPoints: number;
        private totalMinutes: number;
        private businessValue: number;
        private isExpanded: boolean;

        constructor(
            private scope,
            private storyManager,
            public projectSlug: string,
            private storyEditor,
            private epicWindowService: EpicWindowService,
            public localStorage        ) {

            this.stories = [];
            this.scope.ctrl = this;
            this.scope.$watch("iteration", this.onIterationChanged);
            this.scope.$on('storyModified', this.setTotals);
            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.setTotals();
            this.epicSortOrder = this.localStorage[this.projectSlug].planningSortSelection;
        }

        onSortChange = (event, sort) => {
            if (sort === 'value_time') {
                this.sortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
                this.epicSortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
            } else if (sort === 'value_point') {
                this.sortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];
                this.epicSortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];
            } else if (sort === 'wsjf_value') {
                this.sortOrder = calculateWSJFValue;
                this.epicSortOrder = calculateWSJFValue;
            } else if (sort !== "rank") {
                this.sortOrder = [sort, "rank"];
                this.epicSortOrder = [sort, "rank"];
            } else {
                this.sortOrder = sort;
                this.epicSortOrder = 'epic_rank';
            }
        }

        todoPercentage(stats) {
            var todo = stats.cards_total - stats.cards_completed - stats.cards_in_progress
            return this.percentage(todo, stats.cards_total);
        }

        percentage(val, total) {
            return Math.round(100 * val / total);
        }

        setTotals = () => {
            var ref = getStoryTotals(this.storyManager.storiesByEpic[this.scope.epic.id]);
            this.totalPoints = ref[0];
            this.totalMinutes = ref[1];
            this.businessValue = ref[2];
        }

        addCard() {
            return this.storyEditor.createStory(this.scope.project, { epic: { id: this.scope.epic.id }, iteration_id: this.scope.iteration });
        }

        addEpic() {
            return this.epicWindowService.createEpic(this.scope.project, { parent_id: this.scope.epic.id }, this.scope.epics);
        }

        editEpic() {
            this.epicWindowService.editEpic(this.scope.project, this.scope.epic, this.scope.epics);
        }

        filterEpic = (epic) => {
            return this.scope.showArchived || !epic.archived;
        }

        onIterationChanged = () => {
            this.stories = [];
            if (!this.isExpanded) {
                return;
            }
            this.loadStories();
        }

        filterStory = (story) => {
            if (typeof story === "undefined" || story === null) {
                return false;
            }
            if (story.epic == null) {
                return false;
            }
            if (this.scope.iteration !== -1 && this.scope.iteration !== story.iteration_id) {
                return false;
            }
            return story.epic.id === this.scope.epic.id;
        }

        toggleExpanded() {
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded && this.stories.length === 0) {
                this.loadStories();
            }
        }

        loadStories() {
            if (this.scope.iteration === -1) {
                this.storyManager.loadStoriesForEpic(this.projectSlug, this.scope.epic.id).then(this.onStoriesLoaded);
            } else {
                this.storyManager.loadStoriesForIterationEpic(this.projectSlug, this.scope.iteration, this.scope.epic.id).then(this.onStoriesLoaded);
            }
        }

        onStoriesLoaded = (stories) => {
            this.stories = stories;
            this.scope.$emit("storiesChanged");
            this.setTotals();
        }

        selectAll(event) {
            this.scope.$broadcast("selectAll");
        }

        selectNone(event) {
            this.scope.$broadcast("selectNone");
        }
    }
}