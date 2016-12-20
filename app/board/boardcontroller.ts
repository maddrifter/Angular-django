/// <reference path='../_all.ts' />
indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
declare var TEAM_LAYOUT: number;

module scrumdo {

    TEAM_LAYOUT = 9;

    export class BoardController {
        public static $inject: Array<string> = [
            "boardProject",
            "$scope",
            "storyEditor",
            "$timeout",
            "storyManager",
            "storyBulkOperations",
            "$sce",
            "$localStorage",
            "$stateParams",
            "$location",
            "initialBoardService",
            "userService",
            "ngToast",
            "mixpanel",
            "confirmService",
            "iterationWindowService",
            "scrumdoTerms",
            "teamAssignService",
            "keyboardShortcutService"
        ];

        public sortables: Array<any> = [];
        public firstLoad: boolean = true;
        public sortOrder: any = 'rank';
        public setupSortable;
        public resize;
        public originalDragParent;
        public originalDragIndex;
        public element: any;
        private workItemName: string;

        constructor(
            public boardProject: BoardProject,
            public scope,
            public storyEditor: StoryEditor,
            public timeout: ng.ITimeoutService,
            public storyManager: StoryManager,
            public storyBulkOperations: StoryBulkOperations,
            public $sce: ng.ISCEService,
            public localStorage,
            public routeParams: ng.ui.IStateParamsService,
            public location: ng.ILocationService,
            public initialBoardService: InitialBoardService,
            public userService: UserService,
            public ngToast,
            public mixpanel,
            public confirmService: ConfirmationService,
            public iterationWindowService: IterationWindowService,
            public scrumdoTerms: ScrumDoTerms,
            public teamAssignService: TeamAssignService,
            public keyboardShortcutService: KeyboardShortcutService) {

            trace("BoardController");
            this.element = angular.element(".kanbanboard-wrapper");
            this.setupSortable = _.debounce(this._setupSortable, 100);
            this.resize = _.debounce(this._resize, 25);
            $(window).resize(this.resize);
            scope.ctrl = this;

            scope.$root.selectedCount = 0;
            scope.$root.kiosk = new Kiosk();
            scope.$on("$destroy", this.onDestroy);
            scope.$watch("boardProject.uiState.backlogOpen", this.onBacklogOpenChanged);
            scope.$on("boardProject.uiState.archiveOpen", this.onArchiveOpenChanged);

            scope.$watch("boardStories.length", this.onStoriesChanged);
            scope.$on("projectLoaded", this.onProjectLoaded);
            scope.$on("iterationsLoaded", this.setInitialIterations);
            scope.$on("tableRendered", this.onTableRendered);
            scope.$on("selectionChanged", this.onSelectionChanged);
            scope.$on("singleStoryClicked", this.deselectAll);
            scope.$on("backlogChanged", this.setupSortable);
            scope.$on("storiesChanged", this.setupSortable);
            scope.$on('accessChanged', this.setupSortable);
            scope.$on('storyEditWindowClosed', this.setupSortable);
            scope.$on("moveSelectedToCell", this.moveCardsToCell);

            scope.$on('bulkDelete', this.onBulkDelete);
            scope.$on('bulkMoveCell', this.onBulkMoveCell);
            scope.$on('bulkAssign', this.onBulkAssign);
            scope.$on('bulkMove', this.onBulkMove);
            scope.$on('$stateChangeStart', this.onStateChange);

            scope.$on('sortOrderChanged', this.onSortChange);
            scope.$root.$on('permalink', this.onPermalink);

            scope.to_trusted = (html_code) => {
                return $sce.trustAsHtml(html_code);
            }
            if (!this.localStorage[this.boardProject.projectSlug]) {
                this.localStorage[this.boardProject.projectSlug] = { };
            }
            if (!this.localStorage[this.boardProject.projectSlug].boardSortSelection) {
                this.localStorage[this.boardProject.projectSlug].boardSortSelection = "rank";
            }
            scope.$root.currentSort = this.localStorage[this.boardProject.projectSlug].boardSortSelection;
            if (scope.$root.currentSort != "rank") {
                scope.$root.highlightbtn = true;
                this.sortBoard(scope.$root.currentSort);
            }else {
                this.sortOrder = scope.$root.currentSort;
            }

            if(this.scope.$root['safeTerms'] == null){
                this.workItemName = "Card";
            }else{
                this.workItemName = this.scope.$root['safeTerms'].current.work_item_name;
            }
        }

        onDestroy = () => {
            this.scope.$root.kiosk = null;
        }

        setupShortcuts() {
            if (   (this.boardProject != null)
                && (this.boardProject.boardCells != null )
                && this.boardProject.boardCells.length > 0) {
                this.keyboardShortcutService.setupCardShortcuts(this.scope,
                    this.boardProject.project,
                    this.boardProject.boardCells[0].id,
                    this.boardProject.iteration.id,
                    this.scope.canWrite);
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

        onSortChange = (event, sort) => {
            this.scope.$root.highlightbtn = false;
            this.localStorage[this.boardProject.projectSlug].boardSortSelection = sort;
            this.sortBoard(sort);
        }

        sortBoard = (sort) => {
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

        onPermalink = (event, jqueryEvent) => {
            var error, i, story, story_id, url;
            try {
                url = jqueryEvent.target.getAttribute('href');
                i = url.indexOf('story_permalink/') + 16;
                story_id = url.substr(i);
                story = this.storyManager.getStory(story_id);
                if (story != null) {
                    this.storyEditor.editStory(story, this.boardProject.project);
                    jqueryEvent.preventDefault();
                }
            } catch (error) {
                trace('could not handle permalink, oh well');
            }
        }

        onBulkDelete = (event) => {
            return this.storyBulkOperations["delete"](this.getSelectedStories(), false, this.workItemName);
        }

        onBulkMoveCell = (event) => {
            return this.storyBulkOperations.moveToCell(this.getSelectedStories(), this.boardProject.boardCells, this.boardProject.boardHeaders);
        }

        onBulkAssign = (event) => {
            return this.storyBulkOperations.assign(this.getSelectedStories(), this.boardProject.project.members);
        }

        onBulkMove = (event) => {
            return this.storyBulkOperations.moveToProject(this.getSelectedStories(), this.boardProject.project);
        }

        onStateChange = (event, toState, toParams, fromState, fromParams) => {
            this.setupSortable();
        }

        moveCardsToCell = (event, cell) => {
            var i, len, stories, story;
            stories = this.getSelectedStories();
            if (stories.length === 0) {
                this.ngToast.create("Select some cards by holding shift and clicking on them first.");
                return;
            }
            for (i = 0, len = stories.length; i < len; i++) {
                story = stories[i];
                story.cell_id = cell.id;
            }
            return this.storyManager.bulkSave(stories);
        }

        selectedIterations() {
            return _.where(this.boardProject.iterations, { selected: true });
        }

        editMode() {
            this.boardProject.editMode = true;
        }

        onArchiveOpenChanged = () => {
            if (this.boardProject.uiState.archiveOpen) {
                this.mixpanel.track('View Archive on Board 2');
                this.boardProject.loadArchive();
            }

            this.resize();
            this.setupSortable();
        }

        onBacklogOpenChanged = () => {
            if (this.boardProject.uiState.backlogOpen) {
                this.boardProject.loadBacklog();
            } else {
                this.boardProject.uiState.backlogSize = 0;
            }

            this.resize();
            this.setupSortable();
            this.onSelectionChanged();
        }

        toggleArchive() {
            this.boardProject.uiState.archiveOpen = !this.boardProject.uiState.archiveOpen;
            if (this.boardProject.uiState.archiveOpen) {
                this.boardProject.loadArchive();
            }

            this.resize();
            this.setupSortable();
        }

        onSelectionChanged = () => {
            this.scope.$root.selectedCount = this.getSelectedCount();
            trace(this.scope.selectedCount + " cards selected");
        }

        getSelectedCount() {
            return this.getSelectedStories().length;
        }

        getSelectedStories() {
            var boardStories = _.where(this.scope.boardStories, {
                selected: true
            });
            if (this.scope.boardProject.uiState.backlogOpen) {
                return boardStories.concat(_.where(this.scope.boardProject.backlogStories, { selected: true }));
            }
            return boardStories;
        }

        deselectAll = () => {
            var i, len, ref, story;
            ref = this.getSelectedStories();
            for (i = 0, len = ref.length; i < len; i++) {
                story = ref[i];
                story.selected = false;
            }
            return this.scope.$root.selectedCount = 0;
        }

        onProjectLoaded = () => {
            if (this.boardProject.boardCells.length === 0) {
                this.initialBoardService.startInitializeWizard();
            }
            this.setupShortcuts();
        }

        onTableRendered = () => {
            // Upped this to 1500 to try and sort out a ff issue, but no idea if it'll help.
            this.timeout(this.setupSortable, 1500)
            this.resize();
        }

        onStoriesChanged = () => {
            var i, len, ref, story;
            if (this.scope.boardStories == null) {
                return;
            }
            ref = this.scope.boardStories;
            for (i = 0, len = ref.length; i < len; i++) {
                story = ref[i];
                if (!story.cell_id || story.cell_id === null) {
                    story.cell_id = this.getDefaultCellId();
                }
            }
            this.resize();
            if (this.firstLoad && "storyid" in this.routeParams && (this.storyManager.getStory(this.routeParams["storyid"]) != null)) {
                this.firstLoad = false;
                this.storyEditor.editStory(this.storyManager.getStory(this.routeParams["storyid"]), this.scope.project);
            }
        }

        getDefaultCellId() {
            if (this.boardProject.boardCells != null) {
                return this.boardProject.boardCells[0].id;
            }
            return null;
        }

        setInitialIterations = () => {
            // Sets the initial iterations to display on the board following these rules:
            // If INITIAL_KANBAN_ITERATION is set, that's our intial
            // If we have a saved iteration list, and it's valid, use that.
            // If we have a single current iteration, return it(total iterations= 3)
            // If we have iterations with current dates, return those
            // Otherwise, pick the latest iteration
            // If all else fails, return the first one.
            
            _.forEach(this.boardProject.iterations, (i: any) => i.selected = false);
            if ("iterationid" in this.routeParams) {
                var result = (function() {
                    var j, len, ref, results;
                    ref = this.boardProject.iterations;
                    results = [];
                    for (j = 0, len = ref.length; j < len; j++) {
                        var iteration = ref[j];
                        if (String(iteration.id) === this.routeParams["iterationid"]) {
                            results.push(iteration);
                        }
                    }
                    return results;
                }).call(this);

                if (result.length > 0) {
                    _.forEach(result, (i: any) => { return i.selected = true; });
                    return;
                }
            }
            
            // For continuous flow projects that have exactly 3 or 4 iterations, 
            // based on trashbin created or not, so pick the work iteration.
            // if trashbin created need to match total of 4 Otherwise 3
            
            var trashbin = _.findWhere(this.boardProject.iterations, { iteration_type: 3});
            var totalToCheck: number = 3;
            if(trashbin != null){
                totalToCheck = 4;
            }
            if (this.boardProject.iterations.length === totalToCheck) {
                result = _.where(this.boardProject.iterations, { iteration_type: 1});
                _.forEach(result, (i: any) => { return i.selected = true; });
                return;
            }

            var today = moment().format("YYYY-MM-DD");
            
            
            // If there are Current iterations, those are great candidates to display.
            var current = _.filter(this.boardProject.iterations, (iter: any) => {
                return (!iter.hidden) && (iter.iteration_type === 1) && ((iter.start_date <= today && today <= iter.end_date));
            })

            if (current.length > 0) {
                _.forEach(current, function(i) { return i.selected = true; });
                return;
            }
            
            
            // If there are no current iterations, grab the most recent non-archived one.
            current = _.filter(this.boardProject.iterations, (iter: any) => (!iter.hidden) && (iter.iteration_type === 1));

            if (current.length > 0) {
                current = _.sortBy(current, (iteration) => { iteration.end_date; });
                current[current.length - 1].selected = true;
                return;
            }
            
            // Finally, if all else fails, take any work iteration.
            result = _.where(this.boardProject.iterations, { hidden: false, iteration_type: 1 });  //last-chance to find one
            if (result.length > 0) {
                result[0].selected = true;
                return;
            }
            
            // Still no iteration picked?  Prompt to create one.
            this.scope.$root.$emit('fullyLoaded');
            var cancelText, okClass, okText, prompt, title;
            this.confirmService.confirm(title = "Default Iteration",
                prompt = "It looks like you don't have an iteration set up.  Please create one in the next dialog.",
                cancelText = 'Cancel',
                okText = "Ok",
                okClass = "secondary").then(() => {
                    return this.iterationWindowService.createIteration(this.boardProject.organizationSlug, this.boardProject.projectSlug, {});
                });
        }

        _setupSortable = () => {
            if(isMobileDevice()){
                return;
            }
            if (!this.userService.canWrite(this.boardProject.projectSlug)) {
                return;
            }
            var ref = this.sortables;
            for (var i = 0, len = ref.length; i < len; i++) {
                var s = ref[i];
                s.destroy();
            }
            this.sortables = [];

            var dragElements = ".scrumdo-epic-heading, .kanban-story-list, .regular-cell, .kanban-cell";
            
            this.element.find(dragElements).unbind("sortablestart", this.onDragStart);
            this.element.find(dragElements).bind("sortablestart", this.onDragStart);

            var ref1 = this.element.find(dragElements);
            for (i = 0, len = ref1.length; i < len; i++) {
                var el = ref1[i];
                this.sortables.push(new Sortable(el, {
                    group: 'stories',
                    filter: ".task-view, .no-drag, .embedded-task-window, .task-view",
                    draggable: ".cards",
                    onEnd: this.dragStopped,
                    onAdd: this.onSortStory,
                    onUpdate: this.onSortStory
                }));
            }

            trace("Setting up drag & drop " + this.sortables.length);
        }

        dragStopped = () => {
            this.scope.$root.$broadcast('cardDragStop');
        }

        onDragStart = (evt, dragEl) => {
            trace("onDragStart");
            this.scope.$root.$broadcast('cardDragStart');
            this.originalDragParent = dragEl.parentElement;
            this.originalDragIndex = $(dragEl).index();
            var count = this.getSelectedCount();
            if (count === 0) {
                // There weren't any others selected, so don't worry.
                return true;
            }

            var storyId = parseInt($(dragEl).attr("data-story-id"));
            var story = this.storyManager.getStory(storyId);

            if (story.selected) {
                // This story was selected in our group, yay
                return true;
            }
            
            // If we get here, there are cells selected, but the one we're trying
            // to drag is NOT selected.  In that case, we should deselect all.
            this.deselectAll();
            //return true;
        }

        onSortStory = (event) => {
            trace("BoardController::onSortStory");
            this.dragStopped();
            
            // This is the html element that was dragged.
            // for single select, it is the story view
            // for multi select, it doesn't matter, get story id's from selected stories.
            var item = $(event.item);
            var placeholder = $(event.placeholder);
            var parent = placeholder.parent();

            if (!((parent != null) && parent.length > 0)) {
                return;
            }

            var cellId = parseInt(parent.attr("data-cell-id"));
            var iterationId = parseInt(parent.attr("data-iteration-id"));
            var storyId = parseInt(item.attr("data-story-id"));
            var distance = Math.abs(placeholder.index() - item.index());

            if ((distance === 1) && (parent[0] === item.parent()[0])) {
                trace("Dropped an item above or below itself, skipping");
                placeholder.remove();
                return;
            }

            if ((storyId == null) || isNaN(storyId)) {
                trace("ERROR: Dragged an element without a data-story-id");
                return;
            }

            if (cellId == null) {
                trace("ERROR: Dragged to container with no cell id");
            }

            if (iterationId == null) {
                trace("ERROR: Dragged to container with no cell id");
            }
            var story, stories;
            if (this.getSelectedCount() === 0) {
                story = this._onSortSingleStory(storyId, item, parent, cellId, iterationId, placeholder);
                stories = [story];
                this.storyManager.saveStory(story);
            } else {
                stories = this.getSelectedStories();
                stories = _.sortBy(stories, (s: any) => s.rank);
                var previousStory = null;
                for (var i = 0, len = stories.length; i < len; i++) {
                    story = stories[i];
                    this._onSortSingleStory(story.id, item, parent, cellId, iterationId, placeholder, previousStory);
                    previousStory = story;
                }
                this.storyManager.bulkSave(stories, iterationId);
            }

            placeholder.remove();

            var cell: any = this.boardProject.getCell(cellId);
            if ((typeof cell !== "undefined" && cell !== null) && cell.layout === TEAM_LAYOUT) {
                // stop this action no need to show team assignment options
                //this.teamAssignService.assignTeam(stories, this.boardProject.project);
            }
            this.scope.$apply();
        }

        removeStoryFromList(story, list) {
            var target = _.findWhere(list, { id: story.id });
            // We want to match by ID, not by reference to make sure we get it
            if (target === null) {
                return;
            }
            var index = _.indexOf(list, target);
            if (index === -1) {
                return;
            }
            list.splice(index, 1);
        }

        _moveIntoArchive(story) {
            // If not in archive list, adds to that list and removes it from backlog & board lists
            if (_.findWhere(this.boardProject.archiveStories, { id: story.id })) {
                return;
            }
            this.boardProject.archiveStories.push(story);
            this.removeStoryFromList(story, this.boardProject.backlogStories);
            this.removeStoryFromList(story, this.boardProject.boardStories);
        }

        _moveIntoBacklog(story) {
            // Just like _moveIntoArchive, but different
            if (_.findWhere(this.boardProject.backlogStories, { id: story.id })) {
                return;
            }
            this.boardProject.backlogStories.push(story);
            this.removeStoryFromList(story, this.boardProject.boardStories);
            this.removeStoryFromList(story, this.boardProject.archiveStories);
        }

        _moveIntoCurrentList(story) {
            // Just like _moveIntoArchive, but different
            trace("moving into current list");
            if (_.findWhere(this.boardProject.boardStories, { id: story.id })) {
                trace("nevermind, it was already there");
                return;
            }
            this.boardProject.boardStories.push(story);
            this.removeStoryFromList(story, this.boardProject.backlogStories);
            this.removeStoryFromList(story, this.boardProject.archiveStories);
        }

        _onSortSingleStory(storyId, item, parent, cellId, iterationId, placeholder, previousStory = null) {
            /* Sets appropriate properties on a story when it's dropped
            # Things that could change:
            #   cell_id
            #   labels
            #   epic
            #   cell_id
            #   iteration
            #   rank(before / after)
            */
            var skipRank = parent.attr("data-skip-rank");
            var story = this.storyManager.getStory(storyId);
            if (typeof story === "undefined" || story === null) {
                trace("in _onSortSingleStory, but no story found");
                return;
            }

            if (parent.attr("data-label")) {
                var labelId = parseInt(parent.attr("data-label"));
                if (labelId === -1) {
                    story.labels = [];
                } else if (indexOf.call(_.pluck(story.labels, 'id'), labelId) < 0) {
                    story.labels.push({ id: labelId });
                }
            }

            if (parent.attr("data-epic-id")) {
                story.epic = { id: parseInt(parent.attr("data-epic-id")) };
            }

            if (iterationId === this.boardProject.archiveIterationId()) {
                story.cell_id = null;
                this._moveIntoArchive(story);
            } else if (iterationId === this.boardProject.backlogIterationId()) {
                story.cell_id = null;
                this._moveIntoBacklog(story);
            } else {
                story.cell_id = cellId;
                this._moveIntoCurrentList(story);
            }

            story.iteration_id = iterationId;

            if (!skipRank) {
                this._addRankFields(story, item, parent, 0, placeholder, previousStory);
            } else {
                this._addLastRankFields(story);
            }

            return story;

        }

        _addRankFields(story, item, parent, offset = 0, placeholder = null, previousStory = null) {
            /* Finds the stories before & after where we dropped story
            # and sets the following properties on story:
            #   story_id_before
            #   story_id_after
            #   rank(A temp value we can use until we get a server response)
            # The first two are used by the server to calculate the actual rank.
            */
            var nextId, other, previousId;

            if (this.sortOrder !== 'rank') {
                delete story.story_id_after;
                delete story.story_id_before;
                return;
            }

            if (typeof previousStory !== "undefined" && previousStory !== null) {
                previousId = previousStory.id;
            } else {
                previousId = placeholder.prev(".cards").attr("data-story-id");
            }

            nextId = placeholder.next(".cards").attr("data-story-id");

            if (nextId) {
                story.story_id_after = nextId;
                other = this.storyManager.getStory(story.story_id_after);
                story.rank = other.rank - 0.1 + offset;
            } else {
                story.story_id_after = -1;
            }

            if (previousId) {
                story.story_id_before = previousId;
                other = this.storyManager.getStory(story.story_id_before);
                story.rank = other.rank + 0.1 + offset;
            } else {
                // If we get here, the user either dragged to an empty list, where rank wont matter
                // or they dragged to the beginning of the list.If they did the beginning, and if
                // they selected more than one card to drag at once, we need to make some extra room
                // for those other cards to fit in.
                story.story_id_before = -1;
                story.rank -= 100;
            }
        }

        _addLastRankFields(story) {
            // This is used when dropping in the empty space below a cell.
            // Need to find other stories in the cell, and set it after those.
            var others = _.where(this.scope.boardStories, { cell_id: story.cell_id });
            var sortedOthers = _.sortBy(others, (story: any) => story.rank);
            var biggestRank = _.last(sortedOthers);
            if ((typeof biggestRank === "undefined" || biggestRank === null) || (biggestRank.id === story.id)) {
                // We are last already
                return;
            }
            story.story_id_before = biggestRank.id;
            
            // nothing after this one
            story.story_id_after = -1;
            story.rank = biggestRank.rank + 1;
        }

        _resize = () => {
            var archivePos, height, holderHeight, holderWidth, holderX, w, width;
            width = 500;
            height = 500;
            height += 150;
            height = Math.max(height, this.element.find(".kanban-board").height());
            archivePos = width;

            this.element.find(".kanban-board").width(Math.max($(window).width(), width));
            this.element.find(".kanban-board").height(Math.max($(window).height(), height));

            holderWidth = $(".toolbar").width();
            holderHeight = $(window).height() - 96;
            holderX = 0;

            if (this.boardProject.uiState.backlogOpen) {
                trace("backlog viisble");
                w = this.element.find(".kanban-backlog").width() + 15;
                holderWidth -= w;
                holderX = w;
            }

            if (this.boardProject.uiState.archiveOpen) {
                w = this.element.find(".kanban-archive").width();
                $(".kanban-archive").css("left", "");
                holderWidth -= w - $(".main-sidebar").width();
            }

            $(".kanban-board-holder").css("left", holderX + "px");
            $(".kanban-board-holder").css("height", holderHeight + "px");
            $(".kanban-board-holder").css("width", holderWidth + "px");
        }
    }
}