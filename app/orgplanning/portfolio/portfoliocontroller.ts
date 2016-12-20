/// <reference path='../../_all.ts' />

module scrumdo {
    export class PortfolioController {
        public static $inject:Array<string> = ["$scope",
                                               "organizationSlug",
                                               "storyManager",
                                               "projectManager",
                                               "portfolioManager",
                                               "portfolioWindowService",
                                               "iterationManager",
                                               "epicManager",
                                               "$window",
                                               "userService",
                                               "storyEditor",
                                               "projectPickerService",
                                               "$uibModal",
                                               "urlRewriter",
                                               "$filter",
                                               "hotkeys",
                                               "realtimeService"
                                               ]
        
        private portfolios;
        private activePortfolio;
        private filterIteration;
        private iterations;
        private iterationsOrNone;
        private workIterations;
        private activeIteration;
        private epics;
        private stories:Array<Story>;
        private cardSize:string;
        private sortOrder: any = "rank";
        private projects;
        private storiesFlags = {};
        private setupSortable;
        private sortables;
        private loading:boolean = true;
        private releaseStats:Array<any> = [];
        private quicksearch:string = "";
        private level3_cards:any = {};
        private level2_cards:any = {};
        private level1_cards:any = {};
        private rootLevel:number;

        constructor(public scope, 
                    public organizationSlug:string,
                    public storyManager:StoryManager,
                    public projectManager:ProjectManager,
                    public portfolioManager:PortfolioManager,
                    public portfolioWindowService:PortfolioWindowService,
                    public iterationManager:IterationManager,
                    public epicManager:EpicManager,
                    public window:ng.IWindowService,
                    public userService:UserService,
                    public storyEditor:StoryEditor,
                    public projectPickerService,
                    public $modal:ng.ui.bootstrap.IModalService,
                    public urlRewriter:URLRewriter,
                    public filter,
                    public hotkeys:ng.hotkeys.HotkeysProvider,
                    private realtimeService: OrgRealtimeService){
            
            this.reloadProjects();
            this.cardSize = 'portfolio';
            this.scope.$on("toggleReleaseCards", this.toggleReleaseCards);
            this.scope.$on("selectionChanged", this.onSelectionChanged);
            this.scope.$on("singleStoryClicked", this.deselectAll);
            this.scope.$on("filterIterationChanged", this.onFilterIterationChanged);
            this.scope.$on("storyModified", this.setupSortable);
            this.scope.$root.$on("DATA:PATCH:STORY", this.onPatch);
            this.scope.$watch("portfolioCtrl.level2_cards", () => {
                this.setupSortable();
            }, true);

            this.setupSortable = _.debounce(this._setupSortable, 15);
            this.sortables = [];
            this.setupSortable();
            this.bindShortKeys();
        }

        onPatch = (event, message) => {
            var storyId = message.payload.id;
            var props = message.payload.properties;
            this.loadReleaseStats(props.release, 0);
        }

        public loadIterations = () => {
            var ptoject = this.activePortfolio.root;
            this.iterationManager.loadIterations(this.organizationSlug, ptoject.slug).then(this.setIterations);
        }

        public loadEpics = () => {
            var ptoject = this.activePortfolio.root;
            this.epicManager.loadEpics(this.organizationSlug, ptoject.slug).then(this.setEpics)
        }

        public loadCards = () => {
            var ptoject = this.activePortfolio.root;
            this.storyManager.loadIteration(ptoject.slug, this.filterIteration.id).then((cards) => {
                this.stories = cards;
                this.setSeperatorHeight();
                this.setupSortable();
            });
        }

        public getProject(projectSlug){
            return _.find(this.projects, (p:any) => p.slug == projectSlug);
        }

        public reloadProjects = () => {
            this.projectManager.loadProjectsForOrganization(this.organizationSlug, true, true)
                .then(this.onProjectsLoaded);
        }

        public onProjectsLoaded = (projects) => {
            this.scope.projects = projects;
            this.projects = projects;
            this.loadPortfolios();
        }

        public loadPortfolios = () => {
            this.portfolioManager.loadPortfolios().then(this.onPortfoliosLoaded);
        }

        public onPortfolioChanged = () => {
            this.loadIterations();
            this.loadReleaseStats(null);
        }

        public onPortfoliosLoaded = (portfolios) => {
            this.portfolios = portfolios;
            for(var portfolio of this.portfolios) {
                portfolio.rootCache = _.findWhere(this.scope.projects, {id:portfolio.root.id});
                for(var plevel of portfolio.levels) {
                    plevel.projectsCache = [];
                    for(var projectId of plevel.projects) {
                        var p = _.findWhere(this.scope.projects, {id:projectId.id});
                        if(p) plevel.projectsCache.push(p);
                    }
                }
            }
            this.loading = false;
        }

        public createPortfolio() {
            this.portfolioWindowService
                .openCreateWindow()
                .then(this.reloadProjects);
        }

        public selectPortfolio = (portfolio) => {
            if(this.activePortfolio == null || this.activePortfolio.id != portfolio.id){
                this.activePortfolio = portfolio;
                this.rootLevel = portfolio.level_number == null ? 0 : portfolio.level_number;
                this.onPortfolioChanged();
                this.setSeperatorHeight();
                this.subscribeToPortfolioChannel(portfolio);
            }
        }

        private subscribeToPortfolioChannel(portfolio){
            var pr: Array<Project>;
            pr = _.reduce(portfolio.levels, (list, p:any)=>{
                // only subscribe for 1st and 2nd level projects 
                if(p.level_number <=2){
                    return list.concat(p.projects);
                }else{
                    return list;
                }
            }, [portfolio.root]);
            this.realtimeService.subscribeProjects(pr);
            return true;
        }


        public toggleReleaseCards = (event, data) => {
            if(data.action == true){
                this.storyManager.loadStoriesByReleaseId(this.activePortfolio.root.slug, data.release.id).then( () => {
                    this.updateStoryFlag(data.release.id, true);
                    this.setSeperatorHeight();
                    this.setupSortable();
                });
                this.loadReleaseStats(data.release, 1);
            }else{
                this.updateStoryFlag(data.release.id, false);
                this.loadReleaseStats(data.release, 0);
            }
            this.setSeperatorHeight();
        }

        public updateStoryFlag(id, flag){
            this.storiesFlags[id] = flag;
        }

        public getStoryFlag(id){
            if(id in this.storiesFlags){
                return this.storiesFlags[id];
            }else{
                false;
            }
        }

        public toggleRelease(story){
            this.toggleReleaseCards(null, {action:true, release:story});
        }

        public loadReleaseStats(release, loadChild = 0){
            var releaseId = release == null ? -1 : release.id;
            this.storyManager.loadReleaseStats(this.activePortfolio.root.slug, releaseId, loadChild).then((result) => {
                this.updateRelaseStat(result);
            });
        }

        public updateRelaseStat(data){
            _.forEach(data, (d:any) => {
                this.releaseStats[d.id] = d.totalcards;
            });
        }

        quickFilter = (card) : boolean => {
            return this.getFilterFlags(card);
        }

        quickFilterLevel1 = (card) : boolean => {
            return this.getFilterFlags(card) 
                    || (this.level3_cards[card.id]!= null && this.level3_cards[card.id].length)
                    || (this.level2_cards[card.id]!= null && this.level2_cards[card.id].length);
        }

        quickFilterLevel2 = (card) : boolean => {
            return this.getFilterFlags(card) || (this.level3_cards[card.id]!= null && this.level3_cards[card.id].length);
        }

        getFilterFlags = (card):boolean => {
            var summary:string, summaryFlag:boolean, number:string, numberFlag:boolean;
            var searchString:string = this.quicksearch.toLowerCase();
            summary = this.filter('htmlToPlaintext')(card.summary);
            summary = this.filter('decodeHtmlEntities')(summary)
            number = '#'+card.number;

            summaryFlag = summary.toLowerCase().indexOf(searchString) !== -1;
            numberFlag = number.indexOf(searchString) !== -1;
            return summaryFlag || numberFlag;
        }

        addToRootProject() {
            if(this.activePortfolio == null) return;
            this.addCard(this.activePortfolio.root, {iteration_id: this.filterIteration.id});
        }

        addExistingProject(release, level) {
            this.selectProject(release, level)
                .then((project) => this.addCard(project, {release: release}));
        }

        addCard(project, attr) {
            return this.storyEditor.createStory(project, attr);
        }

        onFilterIterationChanged = (event, iteration) => {
            this.loadCards();
        }

        setIterations = (iterations) => {
            this.scope.iterations = iterations;
            this.iterations = iterations;
            this.workIterations = _.where(iterations, { iteration_type: 1 });
            if (this.workIterations.length > 0) {
                this.activeIteration = this.workIterations[0];
            } else {
                this.activeIteration = null;
            }
            this.iterationsOrNone = iterations.concat();
            this.filterIteration = this.activeIteration;
            this.storiesFlags = [];
            this.loadCards();
        }

        setEpics = (epics) => {
            this.scope.epics = epics;
            this.epics = epics;
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

        public search = (query) => {
            var q, url;
            q = encodeURIComponent(query);
            url = "/projects/org/" + this.organizationSlug + "/search?q=" + q;
            return this.window.location.assign(url);
        }

        public selectProject(release, level){
            var projects:Array<any>;
            if(this.activePortfolio.levels[level] != null){
                projects = this.activePortfolio.levels[level].projectsCache;
            }else{
                projects = [];
            }

            var dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("orgplanning/portfolio/selectproject.html"),
                controller: 'ProjectPickerWindowController',
                controllerAs: 'ctrl',
                size: "md",
                backdrop: "static",
                keyboard: true,
                resolve: {
                    projects: () => projects
                }
            });

            return dialog.result;
        }

        public levelWriteAccess(level){
            if(this.activePortfolio.levels[level] != null){
                var projects = this.activePortfolio.levels[level].projectsCache;
                var access:boolean = false;
                _.forEach(projects, (p:any) => {
                    if(this.userService.canWrite(p.slug)){
                        access = true;
                    }
                });
                return access;
            }else{
                return false;
            }
        }

        public bindShortKeys = () => {
            this.hotkeys.del('a');
            this.hotkeys.del('o');
            this.hotkeys.bindTo(this.scope)
                .add({
                    combo: "a p",
                    description: "Create a Portfolio",
                    callback: (event) => {
                        event.preventDefault()
                        this.createPortfolio();
                    }
                })
                .add({
                    combo: "a r",
                    description: "Add a Release to Portfolio",
                    callback: (event) => {
                        event.preventDefault()
                        this.addToRootProject();
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
            var holder = $('.board-body .epic-box-second-level .epic-card-holder', '#mapping-board');
            var mappingBoard = $('#mapping-board');
            var boardHeader = $('.board-header','#mapping-board');
            var maxHeight:number = 0;
            var bodyHeight = mappingBoard.outerHeight() - boardHeader.outerHeight();
            holder.each(function(index) {
                maxHeight = $(this).outerHeight() > maxHeight ? $(this).outerHeight() : maxHeight;
            });
            var toApply = maxHeight > bodyHeight ? maxHeight : bodyHeight;
            holder.css({height: toApply-20});
        }

        _setupSortable = () => {
            if (this.activePortfolio == null || !this.userService.canWrite(this.activePortfolio.root.slug)) {
                return;
            }
            var ref = this.sortables;
            for (var i = 0, len = ref.length; i < len; i++) {
                var s = ref[i];
                s.destroy();
            }
            this.sortables = [];
            var dragElements = ".epic-card-holder, .kanban-story-list";
            var element = $('.org-planning');
            element.find(dragElements).not('avoid').unbind("sortablestart", this.onDragStart);
            element.find(dragElements).not('avoid').bind("sortablestart", this.onDragStart);

            ref = element.find(dragElements).not('.avoid');
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
            this.setupSortable();
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