/// <reference path='../_all.ts' />

module scrumdo {
    export class PlanningIterationController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "projectSlug",
            "organizationSlug",
            "storyEditor",
            "iterationWindowService",
            "$localStorage"
        ];

        private sortOrder: any = "rank";
        private isExpanded: boolean;
        private stories: Array<any>;
        private totalPoints: number;
        private totalMinutes: number;
        private businessValue: number;

        constructor(
            private scope,
            private storyManager,
            public projectSlug: string,
            public organizationSlug: string,
            private storyEditor,
            private iterationWindowService: IterationWindowService,
            public localStorage        ) {

            this.isExpanded = false;
            this.scope.$watch("autoOpen", this.onAutoOpen);
            this.scope.$watch("filter", this.onFilterChanged);
            this.scope.$on('storyModified', this.setTotals);
            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.onAutoOpen();
            this.sortCards(this.localStorage[this.projectSlug].planningSortSelection);
        }

        onSortChange = (event, sort) => {
            this.sortCards(sort);
        }

        sortCards = (sort) => {
            if (sort === 'value_time') {
                this.sortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
            } else if (sort === 'value_point') {
                this.sortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];
            } else if (sort === 'wsjf_value') {
                this.sortOrder = calculateWSJFValue;
            } else if (sort !== "rank") {
                this.sortOrder = [sort, "rank"];
            } else {
                this.sortOrder = sort;
            }
        }

        editIteration() {
            return this.iterationWindowService.editIteration(this.organizationSlug, this.projectSlug, this.scope.iteration);
        }

        addCard() {
            this.storyEditor.createStory(this.scope.project, { iteration_id: this.scope.iteration.id });
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
            if (this.scope.iteration == null) {
                return;
            }
            this.storyManager.loadIteration(this.projectSlug, this.scope.iteration.id, this.scope.filter).then(this.setStories);
        }

        setStories = (stories) => {
            this.stories = stories;
            this.setTotals();
            this.scope.$emit("storiesChanged");
        }

        setTotals = () => {
            var ref = getStoryTotals(this.storyManager.iterationMap[this.scope.iteration.id]);
            this.totalPoints = ref[0];
            this.totalMinutes = ref[1];
            this.businessValue = ref[2];
        }
    }
}