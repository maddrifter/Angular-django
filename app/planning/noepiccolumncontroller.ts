/// <reference path='../_all.ts' />

module scrumdo {
    export class NoEpicColumnController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "projectSlug",
            "storyEditor",
            "epicWindowService",
            "$localStorage"
        ];

        private stories: Array<any>;
        private sortOrder: any = "rank";
        private epicSortOrder: any = "epic_rank";
        private isExpanded: boolean;

        constructor(
            private scope,
            private storyManager,
            public projectSlug: string,
            private storyEditor,
            private epicWindowService: EpicWindowService,
            public localStorage) {

            this.stories = [];
            this.scope.$root.noEpicShowArchiveFlag = false;
            this.scope.ctrl = this;
            this.scope.$watch("iteration", this.onIterationChanged);
            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.sortCards(this.localStorage[this.projectSlug].planningSortSelection);
        }

        onSortChange = (event, sort) => {
            this.sortCards(sort);
        }

         sortCards = (sort) => {
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

        showArchive(showArchiveFlag) {
            this.scope.$root.noEpicShowArchiveFlag = showArchiveFlag;
            this.loadStories();
        }

        addCard() {
            this.storyEditor.createStory(this.scope.project, { iteration_id: this.scope.iteration });
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

        toggleExpanded() {
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded && this.stories.length === 0) {
                this.loadStories();
            }
        }

        loadStories() {
            if (this.scope.iteration === -1) {
                this.storyManager.loadStoriesForNoEpic(this.projectSlug, -1, this.scope.$root.noEpicShowArchiveFlag | 0).then(this.onStoriesLoaded);
            } else {
                this.storyManager.loadStoriesForIterationEpic(this.projectSlug, this.scope.iteration, -1).then(this.onStoriesLoaded);
            }
        }
        
        onStoriesLoaded = (stories) => {
            this.stories = stories;
            this.scope.$emit("storiesChanged");
        }
        
        selectAll(event){
            this.scope.$broadcast("selectAll");
        }
        
        selectNone(event){
            this.scope.$broadcast("selectNone");
        }

    }
}