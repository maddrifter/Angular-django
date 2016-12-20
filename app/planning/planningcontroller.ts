/// <reference path='../_all.ts' />

var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module scrumdo {
    export class PlanningController {
        public static $inject: Array<string> = [
            "$rootScope",
            "organizationSlug",
            "storyManager",
            "epicWindowService",
            "iterationWindowService",
            "$q",
            "mixpanel",
            "releaseStatManager",
            "userService",
            "storyEditor",
            "confirmService",
            "storyPriorityService",
            "keyboardShortcutService",
            "$localStorage",
            "epicManager",
            "projectData",
            "$location",
            "$stateParams"
        ];

        private MODE_EPIC: number = 0;
        private MODE_LIST: number = 1;
        private MODE_BOARD: number = 2;
        private MODE_SAFE: number = 4;
        private sortOrder: any = 'rank';
        private epicSortOrder: any = 'epic_rank';
        private leftMode: number;
        private rightMode: number;
        private leftShowArchived: boolean;
        private rightShowArchived: boolean;
        private rightFilter: string;
        private leftFilter: string;
        private cardSize: string;

        private setupSortable;
        private sortables;
        private boardHover;
        private iterationStories;
        private iterations;
        private nestedEpics;
        private epics;
        private workIterations;
        private boardIteration;
        private iterationsOrNone;
        private leftIteration;
        private rightIteration;
        private element: ng.IAugmentedJQuery;
        private projectSlug: string;


        constructor(
            private scope,
            public organizationSlug: string,
            private storyManager: StoryManager,
            private epicWindowService: EpicWindowService,
            private iterationWindowService: IterationWindowService,
            private $q: ng.IQService,
            private mixpanel,
            private releaseStatManager: ReleaseStatManager,
            private userService: UserService,
            private storyEditor: StoryEditor,
            private confirmService: ConfirmationService,
            private storyPriorityService: StoryPriorityService,
            private keyboardShortcutService: KeyboardShortcutService,
            public localStorage,
            private epicManager: EpicManager,
            private projectData:ProjectDatastore,
            private $location: ng.ILocationService,
            public $stateParams: ng.ui.IStateParamsService) {

            this.leftMode = this.MODE_EPIC;
            this.rightMode = this.MODE_LIST;
            this.leftShowArchived = false;
            this.rightShowArchived = false;
            this.rightFilter = "";
            this.leftFilter = "";
            this.cardSize = 'list';

            this.setupSortable = _.debounce(this._setupSortable, 15);
            this.sortables = [];
            this.setupSortable();
            this.scope.selectedCount = 0;
            this.scope.$on("storiesChanged", this.setupSortable);
            this.scope.$on("selectionChanged", this.onSelectionChanged);
            this.scope.$on("singleStoryClicked", this.deselectAll);
            this.scope.$watch("epics", this.resetEpics, true);
            this.boardHover = {};
            this.mixpanel.track('View Planning Tool');
            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.scope.$root.$on('permalink', this.onPermalink);
            this.scope.$on('currentCardSizeChanged', this.onCardSizeChange);
            this.scope.$on('iterationDeleted', this.onIterationDeleted);
            this.iterationStories = [];
            this.element = angular.element('.scrumdo-planning-container');
            this.initData();
        }
        
       initData(){
           if(!this.projectData.currentProject.tab_planning){
               this.$location.path('/');
           }

           this.projectSlug = this.projectData.currentProject.slug;
           this.setIterations(this.projectData.iterations);
           this.setEpics(this.projectData.epics);
           this.scope.project = this.projectData.currentProject;
           this.scope.cells = this.projectData.cells;
           this.scope.headers = this.projectData.headers;
           this.scope.currentPlanningTool = 'planningcolumn';
           this.allLoaded();
           this.initLocalStorage();

           // Add new iteration if no active iterations found.
           if(!this.$stateParams['newIteration']) return;
           this.createnNewIteration();
        }

        createnNewIteration() {
            this.confirmService.confirm("No iteration found.", "Create new iteration.", "No", "Yes").then(() => {
               this.addIteration();
            });
        }


       initLocalStorage(){
           if(this.localStorage[this.projectSlug] == null){
                this.localStorage[this.projectSlug] = {};
            }
            if(this.localStorage[this.projectSlug].planningSortSelection == null) {
                this.localStorage[this.projectSlug].planningSortSelection = "rank";
            }
            if(this.localStorage[this.projectSlug].planningRightColumn == null) {
                this.localStorage[this.projectSlug].planningRightColumn = this.MODE_LIST;
            }
            if(this.localStorage[this.projectSlug].planningLeftColumn == null) {
                this.localStorage[this.projectSlug].planningLeftColumn = this.MODE_EPIC;
            }
            this.rightMode = this.localStorage[this.projectSlug].planningRightColumn;
            this.leftMode = this.localStorage[this.projectSlug].planningLeftColumn;

            this.scope.$root.currentSort = this.localStorage[this.projectSlug].planningSortSelection;
            if (this.scope.$root.currentSort != "rank") {
                this.scope.$root.highlightbtn = true;
                this.sortCards(this.scope.$root.currentSort);
            }else {
                this.sortOrder = this.scope.$root.currentSort;
            }
       }

        onIterationDeleted = (event, iteration) => {
            if(this.projectData.currentIteration != null && this.projectData.currentIteration.id == null){
                this.projectData.clearCurrentIteration();
            }
        }

        getStoryNumbers(stories) {
            var i, len, results, story;
            results = [];
            for (i = 0, len = stories.length; i < len; i++) {
                story = stories[i];
                results.push(story.number);
            }
            return results;
        }

        loadIterationStories() {
            this.iterationStories = [];
            var ref = this.iterations;
            for (var i = 0, len = ref.length; i < len; i++) {
                var iteration = ref[i];
                this.storyManager.loadIteration(this.projectSlug, iteration.id, '').then(this.setStories);
            }
        }

        setColumnMode(mode, column){
            if(column == 'right'){
                this.localStorage[this.projectSlug].planningRightColumn = mode;
            }else{
                this.localStorage[this.projectSlug].planningLeftColumn = mode;
            }
        }

        setStories = (stories) => {
            for (var i = 0, len = stories.length; i < len; i++) {
                var story = stories[i];
                this.iterationStories.push(story);
            }
        }

        onPermalink = (event, jqueryEvent) => {
            var i, story, story_id, url;

            try {
                url = jqueryEvent.target.getAttribute('href');
                i = url.indexOf('story_permalink/') + 16;
                story_id = url.substr(i);
                story = this.storyManager.getStory(story_id);
                if (story != null) {
                    this.storyEditor.editStory(story, this.scope.project);
                    jqueryEvent.preventDefault();
                }
            } catch (error) {
                trace('could not handle permalink, oh well');
            }
        }

        onSortChange = (event, sort) => {
            this.scope.$root.highlightbtn = false;
            this.localStorage[this.projectSlug].planningSortSelection = sort;
            this.sortCards(sort);
        }

        sortCards = (sort) => {
            if (sort === 'value_time') {
                this.sortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
                this.epicSortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
            } else if (sort === 'value_point') {
                this.sortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];;
                this.epicSortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];
            } else if (sort === 'wsjf_value') {
                this.sortOrder = calculateWSJFValue;
                this.epicSortOrder = calculateWSJFValue;
            } else if (sort !== "rank") {
                this.sortOrder = [sort, "rank"];
                this.epicSortOrder = [sort, "epic_rank"];
            } else {
                this.sortOrder = sort;
                this.epicSortOrder = "epic_rank";
            }
        }
        
        onCardSizeChange = (event, size) => {
            this.cardSize = size;
        }

        allLoaded = () => {
            this.scope.$root.$emit('fullyLoaded');
            this.keyboardShortcutService.removeShortcut("a e");
            this.keyboardShortcutService.removeShortcut("a c");
            this.keyboardShortcutService.removeShortcut("a w e");
            this.keyboardShortcutService.setupCardShortcuts(this.scope, this.scope.project, 0, this.iterations[0].id, this.projectData.canWrite());
        }

        commitRightSearch(filter) {
            this.rightFilter = filter;
        }

        commitLeftSearch(filter) {
            this.leftFilter = filter;
        }

        reorderEpics() {
            return this.epicWindowService.reorderEpics(this.scope.project, this.nestedEpics, this.epics);
        }

        addIteration() {
            return this.iterationWindowService.createIteration(this.organizationSlug, this.projectSlug, {});
        }

        addEpic() {
            return this.epicWindowService.createEpic(this.scope.project, {}, this.epics);
        }

        setHeaders = (headers) => {
            this.scope.headers = headers;
        }

        setCells = (cells) => {
            this.scope.cells = cells;
        }

        setProject = (project) => {
            this.scope.project = project;
        }

        resetEpics = () => {
            this.nestedEpics = this.epicManager.toNested(this.epics);
        }

        setEpics = (epics) => {
            this.scope.epics = epics;
            this.epics = epics;
            this.nestedEpics = this.epicManager.toNested(epics);
            trace("Set Epics", epics);
        }

        setIterations = (iterations) => {
            this.scope.iterations = iterations;
            this.iterations = iterations;
            this.workIterations = _.where(iterations, { iteration_type: 1 });

            if (this.workIterations.length > 0) {
                this.boardIteration = this.workIterations[0];
            } else {
                this.boardIteration = null;
            }

            this.iterationsOrNone = iterations.concat();
            var timePeriodLabel = pluralize(this.scope.$root['safeTerms'].current.time_period_name);
            var allIterations = { name: `All ${timePeriodLabel}`, id: -1, hidden: false };
            this.iterationsOrNone.unshift(allIterations);
            this.leftIteration = allIterations;
            this.rightIteration = allIterations;
            // do not load all Iteration's stories at once
            //this.loadIterationStories();
            trace("Set Iterations", iterations);
        }

        onDragStart = () => {
            this.scope.$root.$broadcast('cardDragStart');
        }

        dragStopped = () => {
            this.scope.$root.$broadcast('cardDragStop');
        }

        onSortStory = (event) => {
            var item = $(event.item);  // This is the html element that was dragged.
            this.dragStopped();
            var placeholder = $(event.placeholder);
            var parent = placeholder.parent();
            if (!((typeof parent !== "undefined" && parent !== null) && parent.length > 0)) {
                return;
            }
            var distance = Math.abs(placeholder.index() - item.index());
            if ((distance === 1) && (parent[0] === item.parent()[0])) {
                trace("Dropped an item above or below itself, skipping");
                placeholder.remove();
                return;
            }

            trace("PlanningController::onSortStory");

            var toContainerType = parent.attr("data-container-type");
            var fromContainerType = item.parent().attr("data-container-type");
            var stories, story, storyId;
            if (this.getSelectedCount() === 0) {
                storyId = parseInt(item.attr("data-story-id"));
                story = this._onSortSingleStory(storyId, item, parent, toContainerType, placeholder);
                stories = [story];
            } else {
                stories = this.getSelectedStories();
                if (fromContainerType === "epic-story-list") {
                    stories = _.sortBy(stories, (s: { epic_rank }) => { s.epic_rank; });
                } else {
                    stories = _.sortBy(stories, (s: { rank }) => { s.rank; });
                }
                var previousStory = null;
                for (var i = 0, len = stories.length; i < len; i++) {
                    var story = stories[i];
                    this._onSortSingleStory(story.id, item, parent, toContainerType, placeholder, previousStory);
                    previousStory = story;
                }
            }
            if (this.sortOrder === 'rank' && toContainerType === 'epic-story-list') {
                this.setAlternateRanks(stories, placeholder, 'epic_rank');
            }

            if (this.sortOrder === 'rank' && toContainerType === 'release-story-list') {
                this.setAlternateRanks(stories, placeholder, 'release_rank');
            }

            if (toContainerType === 'iteration-story-list') {
                this.storyManager.bulkSave(stories, stories[0].iteration_id);
            } else {
                this.storyManager.bulkSave(stories);
            }
            placeholder.remove();
            this.scope.$apply();
        }

        setAlternateRanks(stories, placeholder, rankType = 'epic_rank') {
            if (stories.length === 0) {
                return;
            }
            var insertIntoList, nextId, other, previousId, rank_after, rank_before, story_before;
            previousId = placeholder.prev(".cards").attr("data-story-id");
            nextId = placeholder.next(".cards").attr("data-story-id");
            insertIntoList = false;
            story_before = null;
            if (nextId) {
                other = this.storyManager.getStory(nextId);
                rank_after = other[rankType];
            } else {
                rank_after = 5000000;
            }

            if (previousId) {
                story_before = this.storyManager.getStory(previousId);
                rank_before = story_before[rankType];
            } else {
                rank_before = -5000000;
                insertIntoList = true;
            }

            var diff = rank_after - rank_before;
            var step_size = Math.floor(diff / (1 + stories.length));
            var movedStories = _.sortBy(stories, (story) => { story[rankType] });
            if (step_size > 1) {
                // This means the stories fit between the ones where they were dragged.
                trace("card fit between two others");
                for (var i = 0, len = movedStories.length; i < len; i++) {
                    var story = movedStories[i];
                    rank_before += step_size;
                    story[rankType] = rank_before;
                }
            } else {
                // There wasn't enough room to put the card between the other two.
                // This is a bit of a problem!  The solution is to re-order the cards
                var rank = -5000000;
                var allStories;
                if (rankType === 'epic_rank') {
                    if (movedStories[0]['epic'] != null) {
                        allStories = _.sortBy(this.storyManager.storiesByEpic[movedStories[0]['epic'].id], (story) => { story[rankType] });
                    } else {
                        allStories = _.sortBy(this.storyManager.storiesByEpic[-1], (story) => { story[rankType] });
                    }
                } else {
                    allStories = _.sortBy(this.storyManager.storiesByRelease[movedStories[0]['release'].id], (story) => { story[rankType] });
                }
                step_size = Math.floor(10000000 / (1 + allStories.length));

                for (i = 0, len = allStories.length; i < len; i++) {
                    story = allStories[i];
                    if (insertIntoList) {
                        for (var j = 0, len1 = movedStories.length; j < len1; j++) {
                            var movedStory = movedStories[j];
                            rank += step_size;
                            movedStory[rankType] = rank;
                        }
                        insertIntoList = false;
                    }
                    if (!(indexOf.call(movedStories, story) >= 0)) {
                        rank += step_size;
                        story[rankType] = rank;
                        stories.push(story);
                        if (story_before === story) {
                            insertIntoList = true;
                        }
                    }
                }
                if (insertIntoList) {
                    for (i = 0, len = movedStories.length; i < len; i++) {
                        movedStory = movedStories[i];
                        rank += step_size;
                        movedStory[rankType] = rank;
                    }
                }
            }
            return;
        }

        _onSortSingleStory(storyId, item, parent, dragType, placeholder, previousStory = null) {
            // Sets appropriate properties on a story when it's dropped
            var skipRank = (dragType === 'cells') || (dragType === 'release-story-list');
            var story = this.storyManager.getStory(storyId);
            if (typeof story === "undefined" || story === null) {
                return;
            }

            if (parent.attr("data-iteration-id")) {
                var iterationId = parseInt(parent.attr("data-iteration-id"));
                if (iterationId !== -1) {
                    this.storyManager.moveToIteration(story, iterationId);
                }
            }

            if (parent.attr("data-epic-id")) {
                var epicId = parseInt(parent.attr("data-epic-id"));
                epicId = epicId === -1 ? null : epicId;
                this.storyManager.moveToEpic(story, epicId);
            }

            if (parent.attr("data-release-id")) {
                var releaseId = parseInt(parent.attr("data-release-id"));
                this.storyManager.moveToRelease(story, releaseId);
            }

            if (dragType === 'cells') {
                if ((this.boardHover.cell != null) && this.boardHover.cell.id) {
                    this.storyManager.moveToIteration(story, this.boardIteration.id);
                    story.cell_id = this.boardHover.cell.id;
                }
            }

            if (!skipRank) {
                // We're in a list and should have before/after fields.
                this._addRankFields(story, item, parent, 0, placeholder, previousStory);
            }
            // We're saving up a level so we can bulk-save multiple stories at once.
            this.scope.$broadcast('storyModified', story);
            return story
        }

        _addRankFields(story, item, parent, offset = 0, placeholder = null, previousStory = null) {
            /*
            # Finds the stories before & after where we dropped story
            # and sets the following properties on story:
            #   story_id_before
            #   story_id_after
            #   rank(A temp value we can use until we get a server response)
            # The first two are used by the server to calculate the actual rank.

            # If you pass previousStory, that will be used at the previousId no matter what
            #   card is in the dom relative to the placeholder.This is useful when
            #   dragging multiple cards around.
            */
            if (this.sortOrder !== 'rank') {
                delete story.story_id_after;
                delete story.story_id_before;
                return;
            }

            var previousId;

            if (typeof previousStory !== "undefined" && previousStory !== null) {
                previousId = previousStory.id;
            } else {
                previousId = placeholder.prev(".cards").attr("data-story-id");
            }

            var nextId = placeholder.next(".cards").attr("data-story-id");
            if (nextId) {
                story.story_id_after = nextId;
                var other = this.storyManager.getStory(story.story_id_after);
                story.rank = other.rank - 0.1 + offset;
            } else {
                story.story_id_after = -1;
            }

            if (previousId) {
                story.story_id_before = previousId;
                var other = this.storyManager.getStory(story.story_id_before);
                story.rank = other.rank + 0.1 + offset;
            } else {
                story.story_id_before = -1;
                // If we get here, the user either dragged to an empty list, where rank wont matter
                // or they dragged to the beginning of the list.If they did the beginning, and if
                // they selected more than one card to drag at once, we need to make some extra room
                // for those other cards to fit in.
                story.rank -= 100;
            }
            return;
        }
        /*
        _addLastRankFields(story) {
            //This is used when dropping in the empty space below a cell.
            // Need to find other stories in the cell, and set it after those.
            var others = _.where(this.scope.boardStories, { cell_id: story.cell_id });
            var sortedOthers = _.sortBy(others, (story) => story['rank']);
            var biggestRank = _.last(sortedOthers);
            if (biggestRank['id'] === story.id) {
                return; // We are last already
            }
            story.story_id_before = biggestRank['id'];
            story.story_id_after = -1;  // nothing after this one
            story.rank = biggestRank['rank'] + 1;
            return;
        }
        */

        getSelectedCount() {
            return this.getSelectedStories().length;
        }

        getSelectedStories() {
            return this.storyManager.getSelectedStories();
        }

        onSelectionChanged = () => {
            this.scope.selectedCount = this.getSelectedCount();
            trace(this.scope.selectedCount + " cards selected");
        }

        deselectAll = () => {
            var ref = this.getSelectedStories();
            for (var i = 0, len = ref.length; i < len; i++) {
                var story :any = ref[i];
                story.selected = false;
            }

            this.scope.selectedCount = 0;
        }

        _setupSortable = () => {
            if (!this.userService.canWrite(this.projectSlug)) {
                return;
            }
            var ref = this.sortables;
            for (var i = 0, len = ref.length; i < len; i++) {
                var s = ref[i];
                s.destroy();
            }
            this.sortables = [];
            this.element.find(".kanban-story-list").unbind("sortablestart", this.onDragStart);
            this.element.find(".kanban-story-list").bind("sortablestart", this.onDragStart);

            ref = this.element.find(".kanban-story-list");
            for (i = 0, len = ref.length; i < len; i++) {
                var el = ref[i];
                s = new Sortable(el, {
                    group: 'stories',
                    filter: ".no-drag, .embedded-task-window, .task-view",
                    draggable: ".cards",
                    onEnd: this.dragStopped,
                    onAdd: this.onSortStory,
                    onUpdate: this.onSortStory
                });
                this.sortables.push(s);
            }
        }
    }
}