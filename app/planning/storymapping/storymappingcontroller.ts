/// <reference path='../../_all.ts' />

module scrumdo {
    export class StoryMappingController {
        public static $inject: Array<string> = [
            "$rootScope",
            "organizationSlug",
            "storyManager",
            "$q",
            "mixpanel",
            "userService",
            "storyEditor",
            "confirmService",
            "keyboardShortcutService",
            "epicWindowService",
            "hotkeys",
            "projectData",
            "epicManager",
            "$location",
            "$localStorage"
        ];

        public project;
        public iterations: Array<any>;
        public selectedIteration: Array<any> = [];
        public stories: Array<Story>;
        public workIterations;
        public boardIteration;
        public nestedEpics: Array<any>;
        public epics: Array<any>;
        public allEpics: Array<any>;
        public epicStats: any;
        public isExpanded: boolean;
        public rootEpic: { summary: string, id: number, children: Array<any>, isExpanded: boolean, listChild: boolean, listCards: boolean };
        public selectedEpic;
        public cardSize: string;
        private epicSortOrder: any = "epic_rank";
        private sortOrder: any = "rank";
        public searchQuery: string = "";
        private setupSortable;
        private sortables;
        private zoomLevel:number = 0;
        private maxZoomLevel:number = 6;
        private zoomClass: string = "";
        private element: ng.IAugmentedJQuery;
        private projectSlug: string;
        private iterationSortOrder: Array<any>;

        constructor(
            private scope,
            public organizationSlug: string,
            private storyManager: StoryManager,
            private $q: ng.IQService,
            private mixpanel,
            private userService: UserService,
            private storyEditor: StoryEditor,
            private confirmService: ConfirmationService,
            private keyboardShortcutService,
            public epicWindowService: EpicWindowService,
            public hotkeys:ng.hotkeys.HotkeysProvider,
            private projectData: ProjectDatastore,
            private epicManager: EpicManager,
            public $location: ng.ILocationService,
            public localStorage: any) {

            this.cardSize = 'list';
            this.rootEpic = { summary: 'All Collections', id: -1, children: null, isExpanded: true, listChild: true, listCards: false }
            this.element = angular.element('.scrumdo-planning-container');

            this.scope.$watch("epics", this.resetEpics, true);
            var _refreshEpicStats = _.debounce(this.refreshEpicStats, 500); 
            this.scope.$watch("epics.length", _refreshEpicStats, true); 

            this.setupSortable = _.debounce(this._setupSortable, 15);
            this.sortables = [];
            this.setupSortable();
            this.iterationSortOrder = ['hidden', 'iteration_type', this.hasNullEnd, '-end_date','name'];

            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.scope.$on('loadEpicCards', this.loadEpic);
            this.scope.$on('loadEpicStats', this.onLoadEpicStats);
            this.scope.$on('currentCardSizeChanged', this.onCardSizeChange);
            this.scope.$on("storyModified", _refreshEpicStats);
            this.scope.$on("onStoryAdded", _refreshEpicStats);
            this.scope.$on("selectionChanged", this.onSelectionChanged);
            this.scope.$on("singleStoryClicked", this.deselectAll);
            this.scope.$on("multiIterationSelected", this.selectedEpicChanged);
            this.scope.$root.$on("filter", this.onFilter);
            this.bindShortKeys();
            
            this.initData();
        }
        
        initData(){

            if(!this.projectData.currentProject.tab_planning){
                this.$location.path('/');
            }

            this.setIterations(this.projectData.iterations);
            this.setEpics(this.projectData.epics);
            this.setProject(this.projectData.currentProject);
            this.projectSlug = this.projectData.currentProject.slug;
            this.scope.currentPlanningTool = 'storymapping';
            this.epicManager.loadEpicStats(this.organizationSlug, this.projectSlug).then((stats) => {
                this.setEpicStats(stats);
                this.allLoaded();
                this.initLocalStorage();
            })
        }

        initLocalStorage(){
           if(this.localStorage[this.projectSlug] == null){
                this.localStorage[this.projectSlug] = {};
            }
            if(this.localStorage[this.projectSlug].planningSortSelection == null) {
                this.localStorage[this.projectSlug].planningSortSelection = "rank";
        }

            this.scope.$root.currentSort = this.localStorage[this.projectSlug].planningSortSelection;
            if (this.scope.$root.currentSort != "rank") {
                this.scope.$root.highlightbtn = true;
                this.sortCards(this.scope.$root.currentSort);
            }else {
                this.sortOrder = this.scope.$root.currentSort;
            }
       }


        allLoaded = () => {
            this.scope.$root.$emit('fullyLoaded');
            this.setSeperatorHeight();
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
            this.setSeperatorHeight();
        }

        onFilter = (event, query, filterName) => {
            trace("Story Map Filter changed");
            this.searchQuery = query;
            if (this.searchQuery != "") {
                this.loadStoriesForFilter();
            }
        }

        setIterations = (iterations) => {
            this.scope.iterations = iterations;
            this.iterations = iterations;
            var timePeriodLabel = pluralize(this.scope.$root['safeTerms'].current.time_period_name);
            var allIterations = { name: `All ${timePeriodLabel}`, id: -1, hidden: false };
            this.selectedIteration = [allIterations];
        }

        setEpics = (epics) => {
            this.scope.epics = epics;
            this.epics = epics;
            this.setEpicProps();
            this.nestedEpics = this.epicManager.toNested(epics);
            this.rootEpic.children = this.nestedEpics;
            this.allEpics = [this.rootEpic];
            this.selectedEpic = this.rootEpic;
            trace("Set Epics", this.allEpics);
        }

        refreshEpicStats = () => {
            this.loadEpicStats(null);
        }

        loadEpicStats = (epic_id = null) => {
            this.epicManager.loadEpicStats(this.organizationSlug, this.projectSlug, epic_id).then((stats) => {
                if(epic_id == null){
                    this.setEpicStats(stats);
                }else{
                    this.updateEpicStats(stats, epic_id);
                }
            });
        }

        onLoadEpicStats = (event, epic) => {
            if(epic != null && this.searchQuery == ''){
                this.loadEpicStats(epic.id);
            }
        }

        setEpicStats = (stats) => {
            this.epicStats = stats;
        }

        updateEpicStats(stats, epic_id){
            _.each(stats, (s:any) => {
                var E = _.find(this.epicStats, (e:any) => { return e.epic == epic_id && e.iteration == s.iteration });
                E.totalcards = s.totalcards;
            });
            
        }

        setProject = (project) => {
            this.scope.project = project;
            this.project = project;
        }

        toggleExpanded(epic) {
            if (epic.children.length > 0) {
                epic.isExpanded = !epic.isExpanded;
            }
        }

        showFewEpics() {
            if (this.nestedEpics.length > 0) {
                this.nestedEpics[0].listChild = true;
                this.loadEpicStories(this.nestedEpics[0]);
                if (this.nestedEpics[0].children.length > 0) {
                    this.nestedEpics[0].children[0].listChild = true;
                    this.loadEpicStories(this.nestedEpics[0].children[0]);
                }
            }
        }

        setEpicProps() {
            _.each(this.epics, (e: any) => { e.isExpanded = false; e.listChild = false; });
        }

        filterEpic = (epic) => {
            return !epic.archived;
        }

        addEpic(parentEpic) {
            var pEpicId = parentEpic.id == -1 ? null : parentEpic.id;
            return this.epicWindowService.createEpic(this.scope.project, { parent_id: pEpicId }, this.epics);
        }

        resetEpics = () => {
            this.nestedEpics = this.epicManager.toNested(this.epics);
            this.rootEpic.children = this.nestedEpics;
            this.allEpics = [this.rootEpic];
            this.setSeperatorHeight();
            this.setupSortable();
        }

        epicCards(epic, iteration) :number{
            if(epic != null){
                var cards = 0;
                _.map(this.epicStats, (d:any) => {
                    if(iteration == null){
                        if(d.epic == epic.id){
                            cards += d.totalcards 
                        }
                }else{
                        if(d.epic == epic.id && d.iteration == iteration.id){
                            cards += d.totalcards 
                }
            }
                });
                return cards;
        }
            return 0;
        }

        onEdit(epic) {
            this.epicWindowService.editEpic(this.scope.project, epic, this.scope.epics);
        }

        hasNullEnd(iteration):boolean {
            return iteration.end_date != null;
        }

        setSeperatorHeight = () => {
            setTimeout(() => {
                if($('#mapping-board').length == 0) return;
                var elm = $(".epic-sep", ".mapping-board");
                elm.css({ height: "" });
                var height = document.getElementById("mapping-board").scrollHeight;
                elm.css({ height: (height) + "px" });
                this.updateCardHoldersHeight();
            }, 500);
        }

        selectedEpicChanged = () => {
            this.setSeperatorHeight();
            this.setupSortable();
        }

        filterStory = (epic, iteration) => {
            return (story) => {
                if (typeof story === "undefined" || story === null) {
                    return false;
                }
                if (story.epic == null && epic.id != -1) {
                    return false;
                }
                if (this.selectedIteration[0].id !== -1 && iteration.id !== story.iteration_id) {
                    return false;
                }
                return true;
            }
        }

        filterStoryByQuery = (epic, iteration) => {
            return (story) => {
                var r:boolean = false;
                if (typeof story === "undefined" || story === null) {
                    return false;
                }
                if( typeof epic === "undefined" || epic === null ){
                    return false;
                }
                if (story.epic == null && epic.id != -1) {
                    return false;
                }
                if(story.epic != null && story.epic.id != epic.id){
                    return false;
                }
                if (this.selectedIteration[0].id !== -1 && iteration.id !== story.iteration_id) {
                    return false;
                }
                return true;
            }
        }

        filterStoryCount(epic, iteration){
            var stories = [];
            if(epic == null ){
                return 0;
            }
            if(epic.id == -1){
                stories = _.filter(this.stories, (s) => { return (s.epic == null && s.iteration_id == iteration.id) });
                return stories.length;
            }
            stories = _.filter(this.stories, (s) => { return (s.epic != null && s.epic.id == epic.id && s.iteration_id == iteration.id) });
            if(this.selectedIteration[0].id !== -1){
                stories = _.filter(stories, (s) => { return (iteration.id == s.iteration_id) });
            } 
            return stories.length;
        }

        loadEpic = (event, epic) => {
            if (epic != null) {
                this.loadEpicStories(epic);
            } else {
                this.setSeperatorHeight();
            }
        }

        toggleEpic(epic, loadStories = true, isParent = null) {
            if(isParent == null){
                epic.listChild = !epic.listChild;
                this.loadEpic(null, epic);
            }else{
                this.toggleCards(epic, loadStories);
            }
        }

        toggleCards(epic, loadStories = false) {
            epic.listCards = !epic.listCards;
            if(loadStories){
                this.loadEpic(null, epic);
            }
        }

        loadEpicStories(epic) {
            this.setSeperatorHeight();
            if (epic.id != -1) {
                this.storyManager.loadStoriesForEpic(this.projectSlug, epic.id).then(this.onEpicStoriesLoaded);
            }else{
                this.storyManager.loadStoriesForNoEpic(this.projectSlug, epic.id, 1).then(this.onEpicStoriesLoaded);
            }
        }

        getLoadStoryQuery() {
            var q = "";
            if ((this.searchQuery != null) && this.searchQuery !== "") {
                q = this.searchQuery;
            }
                return this.storyManager.searchProject(this.projectSlug, q);
        }

        loadStoriesForFilter() {
            var query = this.getLoadStoryQuery();
            query.then((stories) => {
                if (stories.items) {
                    this.stories = stories.items;
                } else {
                    this.stories = stories;
                }
                this.setSeperatorHeight();
            });
        }

        onEpicStoriesLoaded = (stories) => {
            this.setSeperatorHeight();
        }

        addCard(epic, iteration=null) {
            var iteration = iteration == null ? -1 : iteration.id;
            return this.storyEditor.createStory(this.scope.project, { epic: { id: epic.id }, iteration_id: iteration });
        }

        zoom(type){
            if(type == 'ACE'){
                if(this.zoomLevel < this.maxZoomLevel)
                    this.zoomLevel += 1;
            }else{
                if(this.zoomLevel > 0)
                    this.zoomLevel -= 1;
            }
            this.zoomClass = "zoom"+this.zoomLevel;
            this.setSeperatorHeight();
        }

        bindShortKeys = () => {
            this.hotkeys.del('a');
            this.hotkeys.del('o');
            if(this.projectData.canWrite()){
                this.hotkeys.bindTo(this.scope)
                    .add({
                        combo: "a e",
                        description: "Add an Epic",
                        callback: (event) => {
                            event.preventDefault()
                            this.addEpic(this.rootEpic);
                        }
                    })
                    .add({
                        combo: "a w e",
                        description: "Add a child Epic to selected Epic",
                        callback: (event) => {
                            event.preventDefault()
                            this.addEpic(this.selectedEpic);
                        }
                    })
                    .add({
                        combo: "a c",
                        description: "Add a Card to selected Epic",
                        callback: (event) => {
                            event.preventDefault()
                            this.addCard(this.selectedEpic);
                        }
                    });
            }
            this.hotkeys.bindTo(this.scope)
                .add({
                    combo: "-",
                    description: "Zoom out Board",
                    callback: (event) => {
                        event.preventDefault()
                        this.zoom('ACE');
                    }
                })
                .add({
                    combo: "+",
                    description: "Zoom in Board",
                    callback: (event) => {
                        event.preventDefault()
                        this.zoom('DECS');
                    }
                });
        }

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

        updateCardHoldersHeight(){
            var board = $('.board-body', '#mapping-board').last();
            var midBoard = $('.board-body', '#mapping-board').not(':last');
            var holder = $('.epic-box-second-level .epic-card-holder', board);
            var mappingBoard = $('#mapping-board');
            var boardHeader = $('.board-header','#mapping-board');
            var maxHeight:number = 0;
            var bodyHeight = mappingBoard.outerHeight() - boardHeader.outerHeight();
            $('.epic-card-holder').css({height:''});
            holder.each(function(index) {
                maxHeight = $(this).outerHeight() > maxHeight ? $(this).outerHeight() : maxHeight;
            });
            var toApply = maxHeight > bodyHeight ? maxHeight : bodyHeight;
            holder.css({height: toApply-20});
            midBoard.each(function(index){
                var minHolder = $('.epic-box-second-level .epic-card-holder', $(this));
                var height = 0;
                minHolder.each(function(index) {
                    height = $(this).outerHeight() > height ? $(this).outerHeight() : height;
                });
                minHolder.css({height: height});
            })
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
            var dragElements = ".epic-card-holder, .kanban-story-list";
            this.element.find(dragElements).unbind("sortablestart", this.onDragStart);
            this.element.find(dragElements).bind("sortablestart", this.onDragStart);

            ref = this.element.find(dragElements);
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

        _onSortSingleStory(storyId, item, parent, dragType, placeholder, previousStory = null) {
            // Sets appropriate properties on a story when it's dropped
            var skipRank = (dragType === 'cells') || (dragType === 'epic-story-list') || (dragType === 'release-story-list');
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
    }
}
