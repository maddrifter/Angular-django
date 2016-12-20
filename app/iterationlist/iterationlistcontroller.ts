/// <reference path='../_all.ts' />

declare var Sortable;

module scrumdo {
    export class IterationListController {
        public static $inject: Array<string> = [
            "$scope",
            "iterationListProject",
            "storyManager",
            "storyBulkOperations",
            "iterationManager",
            "exportManager",
            "reportManager",
            "organizationSlug",
            "$sce",
            "$window",
            "storyEditor",
            "confirmService",
            "$filter",
            "scrumdoTerms",
            "keyboardShortcutService",
            "$timeout",
            "projectData",
            "limitSettingsService",
            "WIPLimitManager",
            "releaseStatManager"
        ];

        private sortOrder: string | Function | Array<any> = 'rank';
        private cardLayout: string;
        private name;
        private sortables: Array<any>;
        private setupSortable;
        private burnType: number | string;
        private maxStatPage: number;
        private burnReportData;
        private allSelectMode:boolean = false;
        private element: any;
        private workItemName:string;
        private childWorkItemName:string;

        private stats = [];


        constructor(
            private scope,
            public iterationListProject: IterationListProject,
            private storyManager: StoryManager,
            private storyBulkOperations: StoryBulkOperations,
            private iterationManager: IterationManager,
            private exportManager: ExportManager,
            private reportManager: ReportManager,
            public organizationSlug: string,
            private $sce: ng.ISCEService,
            private window: ng.IWindowService,
            private storyEditor: StoryEditor,
            private confirmService: ConfirmationService,
            private filter: ng.IFilterService,
            private scrumdoTerms: ScrumDoTerms,
            private keyboardShortcutService: KeyboardShortcutService,
            private timeout: ng.ITimeoutService,
            private projectData:ProjectDatastore,
            public limitSettingsService: LimitSettingsService,
            public wipLimitManager: WIPLimitManager,
            public releaseStatManager: ReleaseStatManager) {

            this.cardLayout = 'iteration_list';
            this.name = 'IterationListController';
            this.scope.ctrl = this;
            this.sortables = [];
            this.setupSortable = _.debounce(this._setupSortable, 15);
            this.setupSortable();
            this.burnType = "-1";
            this.scope.storySize = "normal";
            this.scope.selectedCount = 0;
            this.workItemName = this.scope.$root['safeTerms'].current.work_item_name;
            var ref = this.scope.$root['safeTerms'].children.work_item_name;
            this.childWorkItemName = ref != null ? ref : '';
            this.scope.$on("selectionChanged", this.onSelectionChanged);

            this.scope.to_trusted = ((html_code) => {
                return this.$sce.trustAsHtml(html_code);
            });

            this.maxStatPage = 2;
            if (!this.scope.$storage.iterDisplay) {
                this.scope.$storage.iterDisplay = 0;
            }
            this.scope.$on("appLoaded", this.onAppLoaded);
            this.scope.$on('permalink', this.onPermalink);
            var _refreshStats = _.debounce(this.refreshStats, 500);
            this.scope.$on("storyModified", _refreshStats);
            this.scope.$on("onStoryAdded", _refreshStats);
            this.element = <any> $('.scrumdo-iteration-cards');
            this.iterationListProject.init(this.projectData);
            this.loadWipLimits();
            this.setLimitBarStats();
        }

        public setLimitBarStats(){
            this.stats = [
                [   {value: 0, label:`Total ${pluralize(this.workItemName)}`, limit:0},
                    {value: 0, label:`${this.workItemName} Points`, limit:0},
                ],
                [   {value: 0, label:`Total ${pluralize(this.childWorkItemName)}`, limit:0},
                ],
                [   {value: 0, label:`Completed ${pluralize(this.workItemName)}`, limit:0},
                    {value: 0, label:`Completed ${this.workItemName} Points`, limit:0},
                ],
                [
                    {value: 0, label:`${pluralize(this.workItemName)} in Progress`, limit:0},
                    {value: 0, label:`${pluralize(this.workItemName)} Left`, limit:0},
                    {value: 0, label:`${this.workItemName} Points in Progress`, limit:0},
                    {value: 0, label:`${this.workItemName} Points Left`, limit:0},
                    {value: 0, label:`Days Left`, limit:0},
                ]
            ];
        }

        public loadWipLimits(){
            this.wipLimitManager.getLimits(this.projectData.currentProject.slug,
                                           this.projectData.currentIteration.id)
                                           .then(this.onLimitResponse)
        }

        public getStats():StatGroups {
            return this.stats;
        }

        public setLimit():void {
            const initial = {
                featureLimit: this.stats[0][0].limit,
                featurePointLimit: this.stats[0][1].limit,
                cardLimit: 0,
                cardPointLimit: 0
            }
            var isParent = false;
            this.limitSettingsService
                    .showSettings(initial, isParent)
                    .then(this.onSaveLimits)
        }

        private onSaveLimits = (limits:LimitSettings) => {
            this.wipLimitManager.setLimits(this.projectData.currentProject.slug,
                                           this.projectData.currentIteration.id,
                                           limits)
                .then(this.onLimitResponse);
        }

        private onLimitResponse = (limitResponse:{data:LimitSettings}) => {
            this.setLimits(limitResponse.data);
        }

        private setLimits = (limits:LimitSettings) => {
            this.stats[0][0].limit = limits.featureLimit;
            this.stats[0][1].limit = limits.featurePointLimit;
        }

        private refreshStats = () => {
            if(!this.projectData.currentIteration) return;
            this.iterationManager.loadStatsForIteration(this.iterationListProject.organizationSlug,
                                                        this.projectData.currentProject.slug,
                                                        this.projectData.currentIteration.id
            ).then((stats) => {
                if(this.projectData.currentProject.children_count > 0){
                    this.loadFeatureStats().then((fstats) => {
                        var total = _.reduce(fstats, function(res, i:any){ 
                            res.count += i.cards_total;
                            res.point += i.points_total;
                            return res;
                        }, { count:0, point:0 });
                            
                        this.stats[0][0].value = stats.total_cards;
                        this.stats[0][1].value = stats.total_points;
                        this.stats[1][0].value = total.count;
                        this.stats[2][0].value = stats.completed_cards;
                        this.stats[2][1].value = stats.completed_points;
                        this.stats[3][0].value = stats.in_progress_cards;
                        this.stats[3][1].value = stats.total_cards - stats.completed_cards;
                        this.stats[3][2].value = stats.in_progress_points;
                        this.stats[3][3].value = stats.total_points - stats.completed_points;
                        this.stats[3][4].value = stats.daysLeft;
                    });
                }else{
                    this.stats[0][0].value = stats.total_cards;
                    this.stats[0][1].value = stats.total_points;
                    this.stats[2][0].value = stats.completed_cards;
                    this.stats[2][1].value = stats.completed_points;
                    this.stats[3][0].value = stats.in_progress_cards;
                    this.stats[3][1].value = stats.total_cards - stats.completed_cards;
                    this.stats[3][2].value = stats.in_progress_points;
                    this.stats[3][3].value = stats.total_points - stats.completed_points;
                    this.stats[3][4].value = stats.daysLeft;
                }
            });
        }

        private loadFeatureStats(): ng.IPromise<any>{
            return this.releaseStatManager.loadIterationStats(this.organizationSlug, 
                                                       this.projectData.currentProject.slug, 
                                                       this.projectData.currentIncrement.iteration_id);
        }

        isTrash() {
            if(!this.iterationListProject.iteration) return;

            var iteration_type = this.iterationListProject.iteration.iteration_type;
            if (iteration_type == 3) {
                return true;
            }
            return false;
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

        onPermalink = (event, jqueryEvent) => {
            var error, i, story, story_id, url;
            try {
                url = jqueryEvent.target.getAttribute('href');
                i = url.indexOf('story_permalink/') + 16;
                story_id = url.substr(i);
                story = this.storyManager.getStory(story_id);
                if (story != null) {
                    this.storyEditor.editStory(story, this.projectData.currentProject);
                    return jqueryEvent.preventDefault();
                }
            } catch (error) {
                return trace('could not handle permalink, oh well');
            }
        }

        setRanksBySort() {
            this.confirmService.confirm("Auto-Rank Cards",
                "The card-rank is the order cards appear in the default sort order.  Normally,\nyou rank cards by dragging them up or down in the list.\nAuto-Ranking will set ranks of all the cards on this page so they are in the current sort order\nyou have selected.\nAre you sure?",
                "No",
                "Yes").then(this.confirmAutoRank);
        }

        confirmAutoRank = () => {
            var i, len, story;
            var rank: number = 100000;
            var stories = this.filter('orderBy')( this.iterationListProject.stories.concat(), <(value: {}) => any>this.sortOrder);
            for (i = 0, len = stories.length; i < len; i++) {
                story = stories[i];
                story.force_rank = rank;
                rank += 1000;
            }
            this.storyManager.bulkSave(stories);
        }

        setSort(sort) {
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

        onAppLoaded = () => {

            if(!this.projectData.currentIteration) return;

            this.refreshStats();
            this.scope.$root.$emit('fullyLoaded');
            var hash = this.window.location.hash;
            var re = /\?story_[0-9]+$/;
            if (hash.match(re) != null) {
                var storyId = parseInt(hash.match(re)[0].substr(7));
                var story = this.storyManager.getStory(storyId);
                // avoid undefined error for wrong story Id
                if(story != null){
                    this.storyEditor.editStory(story, this.projectData.currentProject);
                }
            }
            this.keyboardShortcutService.setupCardShortcuts(this.scope,
                this.projectData.currentProject,
                0,
                this.projectData.currentIteration.id,
                this.projectData.canWrite());


            this.timeout(() => {
                $(".scrumdo-backlog-wrapper").scroll(this.onScroll);},
                1000
            );

        }


        onScroll = () => {
            /*
             This is one big hack.
             There is a bug on Chrome 50 and OSX 10.11
             If you're running this page on your laptop monitor (and not an external monitor) and you
             scroll the list, the items will not always render.

             Doing this little trick here forcest them to re-layout and render on a scroll.
             */
            $(".chrome-scroll-fix").remove();
            $(".scrumdo-backlog-wrapper").append("<span class='chrome-scroll-fix'>&nbsp;</span>");
        }


        filterStory = (story) => {
            if(!this.projectData.currentIteration){return false;}
            return story.iteration_id === this.projectData.currentIteration.id;
        }

        import() {
            this.exportManager.startIterationImport(this.projectData.currentProject, this.projectData.currentIteration.id);
        }

        export() {
            this.exportManager.startIterationExport(this.projectData.currentProject, this.projectData.currentIteration.id);
        }

        bulkDelete() {
            this.storyBulkOperations.delete(this.getSelectedStories(), this.isTrash());
        }

        bulkTag() {
            this.storyBulkOperations.moveToCell(this.getSelectedStories(), this.projectData.cells, this.projectData.headers);
        }

        bulkAssign() {
            this.storyBulkOperations.assign(this.getSelectedStories(), this.projectData.currentProject.members);
        }

        bulkMove() {
            this.storyBulkOperations.moveToProject(this.getSelectedStories(), this.projectData.currentProject);
        }

        _setupSortable = () => {
            if(isMobileDevice()){
                return;
            }
            trace("Setting up drag & drop");
            var i, len, ref, s;

            ref = this.sortables;
            for (i = 0, len = ref.length; i < len; i++) {
                s = ref[i];
                s.destroy();
            }

            this.sortables = [];
            this.element.find(".sortable-story-list").unbind("sortablestart", this.onDragStart);
            this.element.find(".sortable-story-list").bind("sortablestart", this.onDragStart);

            var el, i, len, ref, s;

            ref = this.element.find(".sortable-story-list");
            for (i = 0, len = ref.length; i < len; i++) {
                el = ref[i];
                s = new Sortable(el, {
                    group: 'stories',
                    draggable: ".backlog-container-card",
                    onEnd: this.dragStopped,
                    onAdd: this.onSortStory,
                    onUpdate: this.onSortStory
                });
                this.sortables.push(s);
            }
        }

        dragStopped = () => {
            this.scope.$root.$broadcast('cardDragStop');
        }

        onDragStart = (evt, dragEl) => {
            trace("onDragStart");
            this.scope.$root.$broadcast('cardDragStart');
            var count: number = 1 //this.getSelectedCount()
            if (count === 0) {
                return true; // There weren't any others selected, so don't worry.
            }

            var storyId = parseInt($(dragEl).attr("data-story-id"));
            var story = this.storyManager.getStory(storyId);

            if (story.selected) {
                return true;  // This story was selected in our group, yay
            }

            // If we get here, there are cells selected, but the one we're trying
            // to drag is NOT selected.  In that case, we should deselect all.
            this.deselectAll();
            return true
        }

        onSelectionChanged = () => {
            this.scope.selectedCount = this.scope.$root.selectedCount = this.getSelectedCount();
            if (this.getSelectedCount() != this.scope.iterationListProject.stories.length) {
                this.allSelectMode = false;
            }else{
                this.allSelectMode = true;
            }
            trace(this.scope.selectedCount + " cards selected");
        }

        selectAll() {
            if (this.getSelectedCount() === this.scope.iterationListProject.stories.length) {
                this.deselectAll();
                this.allSelectMode = false;
                return;
            }
            var i, len, ref, story;
            ref = this.scope.iterationListProject.stories;
            for (i = 0, len = ref.length; i < len; i++) {
                story = ref[i];
                story.selected = true;
            }
            this.allSelectMode = true;
            this.onSelectionChanged();
        }

        deselectAll() {
            var i, len, ref, story;
            ref = this.getSelectedStories();
            for (i = 0, len = ref.length; i < len; i++) {
                story = ref[i];
                story.selected = false;
            }

            this.scope.selectedCount = this.scope.$root.selectedCount = 0;
        }

        getSelectedCount() {
            return this.getSelectedStories().length;
        }

        getSelectedStories() {
            return _.where(this.scope.iterationListProject.stories, {
                selected: true
            });
        }

        onSortStory = (event) => {
            trace("IterationListController::onSortStory");
            this.dragStopped();
            var item = $(event.item);  // This is the html element that was dragged.
            // for single select, it is the story view
            // for multi select, it doesn't matter, get story id's from selected stories.

            var placeholder = $(event.placeholder);
            var parent = placeholder.parent();
            if (!((typeof parent !== "undefined" && parent !== null) && parent.length > 0)) {
                return;
            }

            var storyId: number = parseInt(item.attr("data-story-id"));
            if ((typeof storyId === "undefined" || storyId === null) || isNaN(storyId)) {
                trace("ERROR: Dragged an element without a data-story-id");
                return;
            }
            var story, stories;
            if (this.getSelectedCount() === 0) {
                story = this._onSortSingleStory(storyId, item, parent, placeholder);
                this.storyManager.saveStory(story).then(() => {
                    this.refreshStats();
                });
            } else {
                stories = this.getSelectedStories();
                for (var i = 0, len = stories.length; i < len; i++) {
                    story = stories[i];
                    this._onSortSingleStory(story.id, item, parent, placeholder);
                }
                this.storyManager.bulkSave(stories).then(() => {
                    this.refreshStats();
                });
            }
            placeholder.remove();
            this.scope.$apply();
        }

        _onSortSingleStory = (storyId, item, parent, placeholder) => {
            // Sets appropriate properties on a story when it's dropped
            var story = this.storyManager.getStory(storyId);
            this._addRankFields(story, item, parent, placeholder);
            return story;
        }

        _addRankFields(story, item, parent, placeholder) {
            /*
            # Finds the stories before & after where we dropped story
            # and sets the following properties on story:
            #   story_id_before
            #   story_id_after
            #   rank(A temp value we can use until we get a server response)
            # The first two are used by the server to calculate the actual rank.
            */
            if (placeholder == null) {
                placeholder = null;
            }
            if (this.sortOrder !== 'rank') {
                delete story.story_id_after;
                delete story.story_id_before;
                return;
            }

            var previousId = placeholder.prev(".backlog-container-card").attr("data-story-id");
            var nextId = placeholder.next(".backlog-container-card").attr("data-story-id");
            var other;
            if (nextId) {
                story.story_id_after = nextId;
                other = this.storyManager.getStory(story.story_id_after);
                story.rank = other.rank - 1;
            } else {
                story.story_id_after = -1;
            }

            if (previousId) {
                story.story_id_before = previousId;
                other = this.storyManager.getStory(story.story_id_before);
                story.rank = other.rank + 1;
            } else {
                story.story_id_before = -1;
            }
        }
    }
}