/// <reference path='../_all.ts' />
module scrumdo {
    export class StoryEditWindowController {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$scope",
            "story",
            "project",
            "newsManager",
            "commentsManager",
            "$sce",
            "user",
            "confirmService",
            "storyManager",
            "epicManager",
            "iterationManager",
            "pokerService",
            "trackTimeService",
            "boardCellManager",
            "boardHeadersManager",
            "projectManager",
            "$q",
            "editorManager",
            "mixpanel",
            "taskMode",
            "timeManager",
            "$timeout",
            "hotkeys",
            "attachmentsManager",
            "ngToast",
            "$uibModal",
            "urlRewriter",
            "storyEditor",
            "minimizedCard",
            "$uibModalInstance",
            "minimised",
            "betaOptions",
            "$state"
        ];

        public timeEntries: Array<any> = [];
        public blockerEntries: Array<StoryBlocker> = [];
        public newComment: string;
        public releaseMode: boolean;
        public currentPoints;
        public edited;
        public cells;
        public cell;
        public news;
        public headers;
        public currentIteration:Iteration;
        public currentEpic;
        public agingInfo: Array<any> = [];
        public blockModal: ng.ui.bootstrap.IModalServiceInstance;
        public timeCriticality;
        public riskReduction;
        public savePromise: ng.IPromise<any>;
        public toggle: boolean;
        private activeModals;
        private workItemName:string;
        private showFields: boolean = false;
        constructor(
            public organizationSlug: string,
            public scope,
            public story,
            public project,
            public newsManager: NewsManager,
            public commentsManager: CommentsManager,
            public $sce: ng.ISCEService,
            public user,
            public confirmService: ConfirmationService,
            public storyManager: StoryManager,
            public epicManager: EpicManager,
            public iterationManager: IterationManager,
            public pokerService: PokerService,
            public trackTimeService: TrackTimeService,
            public boardCellManager,
            public boardHeadersManager,
            public projectManager,
            public q: ng.IQService,
            public editorManager,
            public mixpanel,
            public taskModeVar,
            public timeManager: TimeManager,
            public $timeout: ng.ITimeoutService,
            public hotkeys,
            public attachmentsManager: AttachmentsManager,
            public ngToast,
            public modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter,
            public storyEditor: StoryEditor,
            public minimizedCard,
            public uibModalInstance: ng.ui.bootstrap.IModalServiceInstance,
            public minimisedVar,
            private betaOptions: BetaOptions,
            private $state: ng.ui.IStateService) {

            trace("StoryEditorController");
            this.scope.busyMode = "Loading...";
            this.scope.minimised = minimisedVar;
            this.scope.taskMode = taskModeVar;
            if (this.project != null) {
                this.init(newsManager, $sce, user);
            } else {
                this.projectManager.loadProject(this.organizationSlug, this.story.project_slug).then((result) => {
                    this.project = result;
                    this.init(newsManager, $sce, user);
                });
            }

            this.bindEscShortcut();
            this.bindSaveShortcut();
            this.scope.$on('bindcardesckey', this.bindEscShortcut);
            this.scope.$on('bindcardsavekey', this.bindSaveShortcut);
            this.scope.$on('toggle', this.toggleIt);
            this.scope.$on('maximizeAction', this.onMaximizeAction);
            this.activeModals = this.storyEditor.openCards;
            if(this.scope.$root['safeTerms'] != undefined){
                if(["app.iteration.teamplanningteam", "app.iteration.dependencies"].indexOf(this.$state.current.name) > -1){
                    this.workItemName = this.scope.$root['safeTerms'].children.work_item_name;
                }else{
                    this.workItemName = this.scope.$root['safeTerms'].current.work_item_name;
                }
            }
        }

        unbindSortKeys = () => {
            this.hotkeys.del('esc');
            this.hotkeys.del('ctrl+s');
        }

        bindSortKeys = () => {
            this.bindEscShortcut();
            this.bindSaveShortcut();
        }

        bindSaveShortcut = () => {
            // ignore if user don't have write access
            if(!this.storyEditor.userService.canWrite(this.project.slug)){
                return false;
            }
            this.hotkeys.bindTo(this.scope).add({
                combo: 'ctrl+s',
                description: 'Save Card',
                allowIn: ['INPUT', 'SELECT', 'TEXTAREA', 'CONTENT-EDITABLE'],
                callback: (event) => {
                        event.preventDefault();
                        this.saveWithDelay();
                    }
            });
        }

        bindEscShortcut = () => {
            this.hotkeys.bindTo(this.scope).add({
                combo: 'esc',
                description: 'Close Card',
                allowIn: ['INPUT', 'SELECT', 'TEXTAREA', 'CONTENT-EDITABLE'],
                callback: (event) => {
                    event.preventDefault();
                    if (this.edited === true) {
                        this.$timeout(() => {
                            this.confirmService.confirm("Are you sure?", "Are you sure you want to discard the changes?", "No", "Yes").then(() => {
                                this.close();
                            });
                        }, 100);
                    } else {
                        this.close();
                    }
                }
            });
        }


        init(newsManager, $sce, user) {

            this.scope.story = angular.copy(this.story);
            this.scope.ctrl = this;
            this.scope.user = user;
            this.newComment = "";
            this.setCurrentIteration();
            this.releaseMode = this.project.project_type === 2;
            this.scope.project = this.project;

            this.scope.pointScale = (function() {
                var i, len, ref, results;
                ref = this.scope.project.point_scale;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var p = ref[i];
                    results.push(transformPoints(p));
                }
                return results;
            }).call(this);

            this.currentPoints = _.find(this.scope.pointScale, (p) => p[1] == this.story.points);
            this.timeCriticality = _.find(this.scope.pointScale, (p) => p[1] == this.story.time_criticality_label);
            this.riskReduction = _.find(this.scope.pointScale, (p) => p[1] == this.story.risk_reduction_label);
            if (this.currentPoints == null) {
                if(this.story.points_value == null){
                    this.currentPoints = this.scope.pointScale[0];
                }else{
                    //show story current values if point scale has been changed to different one
                    this.currentPoints = [this.story.points_value, this.story.points, this.story.points+" Points"];
                }
            }
            if (this.timeCriticality == null) {
                if(this.story.time_criticality == null){
                    this.timeCriticality = this.scope.pointScale[0];
                }else{
                    //show story current values if point scale has been changed to different one
                    this.timeCriticality = [this.story.time_criticality, this.story.time_criticality_label, this.story.time_criticality_label+" Points"];
                }
            }
            if (this.riskReduction == null) {
                if(this.story.risk_reduction == null){
                    this.riskReduction = this.scope.pointScale[0];
                }else{
                    //show story current values if point scale has been changed to different one
                    this.riskReduction = [this.story.risk_reduction, this.story.risk_reduction_label, this.story.risk_reduction_label+" Points"];
                }
            }
            this.scope.to_trusted = (html_code) => {
                return $sce.trustAsHtml(html_code);
            }

            // If this is a new story, we auto-enable edit fields.
            this.scope.newStory = this.story.number === -1;
            this.scope.editSummary = this.scope.newStory;
            this.scope.editDetail = this.scope.newStory;
            this.scope.editExtra1 = this.scope.newStory;
            this.scope.editExtra2 = this.scope.newStory;
            this.scope.editExtra3 = this.scope.newStory;
            this.edited = this.scope.newStory;
            var loads = [];
            this.scope.$on("timeEntryCreated", this.reloadTimeEntries);
            this.scope.$on("blockerEntryCreated", this.reloadBlockerEntries);

            loads.push(this.boardCellManager.loadCells(this.organizationSlug, this.project.slug).then((results) => {
                this.cells = results;
                this.cell = _.findWhere(this.cells, { id: this.story.cell_id });
            }));


            loads.push(this.iterationManager.loadIterations(this.organizationSlug, this.project.slug).then(this.setIterations));


            if (this.scope.epics == null) {
                loads.push(this.epicManager.loadEpics(this.organizationSlug, this.project.slug).then(this.setEpics));
            } else {
                this.setCurrentEpic();
            }

            if (!this.scope.newStory) {
                // We're going to force reload the story to make sure we don't have a stale version
                try {
                    loads.push(this.storyManager.reload(this.story.id).then((story) => {
                        if (!story.cell_id || story.cell_id === null) {
                            if (this.scope.$root.boardProject != null) {
                                story.cell_id = this.scope.$root.boardProject.boardCells[0].id;
                            }
                        }
                        this.story = story;
                        angular.copy(this.story, this.scope.story);
                    }));
                } catch (error) {
                    loads.push(this.storyManager.loadStory(this.story.id, this.story.project_slug, this.story.iteration_id).then((story) => {
                        if (!story.cell_id || story.cell_id === null) {
                            var ref;
                            if (((ref = this.scope.$root.boardProject) != null ? ref.boardCells : void 0) != null) {
                                story.cell_id = this.scope.$root.boardProject.boardCells[0].id;
                            }
                        }
                        this.story = story;
                        angular.copy(this.story, this.scope.story);
                    }));
                }

                loads.push(newsManager.loadNewsForStory(this.organizationSlug, this.project.slug, this.story.id).then((result) => {
                    this.news = result;
                }));
                loads.push(this.reloadTimeEntries());
                loads.push(this.storyManager.agingDetails(this.story).then( (result) => {
                    this.sortAgingGroup(_.groupBy(result.sort(this.sortAgingDetails), (d) => d[2].slug));
                }));
                loads.push(this.reloadBlockerEntries());
            }

            this.q.all(loads).then(() => {
                this.scope.busyMode = false;
                this.boardHeadersManager.loadHeaders(this.organizationSlug, this.project.slug).then((results) => {
                    this.headers = results;
                });
                if (this.scope.newStory) {
                    this.editorManager.editByNumber(1000);
                }
                this.scope.$watch('story', this.onEdited, true);
                this.scope.$watchGroup(['ctrl.currentIteration', 'ctrl.currentEpic', 'ctrl.currentPoints', 'ctrl.timeCriticality', 'ctrl.riskReduction'], this.onEdited);
            });
        }

        reloadBlockerEntries = () => {
            this.storyManager.blockersEntries(this.story).then((result) => {
                this.blockerEntries = result;
            });
        }

        reloadTimeEntries = () => {
            return this.timeManager.getTimeEntriesForCard(this.project.slug, this.story.id).then((result) => {
                this.timeEntries = result;
            });
        }

        playPoker() {
            if (this.edited) {
                this.save(null);
                this.pokerService.startPoker(this.story);

            } else {
                this.close(this.story);
                this.pokerService.startPoker(this.story);
            }
        }

        trackTime() {
            this.unbindSortKeys();
            var timeModal = this.trackTimeService.trackTimeOnStory(this.project,
                _.findWhere(this.scope.iterations, { id: this.story.iteration_id }),
                this.story, null);
            timeModal.result.then(null, this.onTrackTime);
        }

        onTrackTime = () => {
            this.bindEscShortcut();
            this.bindSaveShortcut();
        }

        timeLabel(minutes) {
            var hours, minutes, ref;
            ref = minutesToHoursMinutes(minutes), hours = ref[0], minutes = ref[1];
            return hours + ":" + (pad(minutes, 2));
        }

        close(story = null, fakeClose: boolean = false) {
            this.hotkeys.del('esc');
            this.updateStoryStats(fakeClose);
            if (this.activeModals.length == 1) {
                this.onCardMinimized(null);
            }
            if (!!this.scope.$root) {
                this.scope.$root.$broadcast('storyEditWindowClosed');
            }
            this.scope.$close({story:story, savePromise:this.savePromise});
        }


        updateStoryStats(fakeClose: boolean) {
            if (this.scope.newStory) {
                if(!fakeClose){
                    this.attachmentsManager.cleanTempAttachments(this.organizationSlug, this.project.slug, this.scope.story.id, -1);
                }
                if(!!this.scope.$root)
                this.scope.$root.$broadcast('reset_attachment');
            }
            if (this.story.comment_count !== this.scope.story.comment_count) {
                this.story.comment_count = this.scope.story.comment_count;
            }
        }

        cancel() {
            if(this.edited) {
                if (this.scope.newStory) return this.closeWindow();

                this.confirmService.confirm("Are you sure?", "Are you sure you want to close this card. You will lose all unsaved changes?", "No", "Yes").then(() => {
                    this.updateStoryStats(false);
                    this.closeWindow();
                });
            } else {
                this.closeWindow();
            }
        }

        closeWindow() {
            if (this.activeModals.length == 1) {
                this.onCardMinimized(null);
            }
            this.scope.$dismiss();
            this.storyEditor.openCards.pop();
        }

        setIterations = (iterations) => {
            this.scope.iterations = iterations;
            this.setCurrentIteration();
        }

        setCurrentIteration() {
            if (this.scope.iterations != null) {
                if (this.story.iteration_id === -1) {
                    this.story.iteration_id = (_.findWhere(this.scope.iterations, { iteration_type: 0 }))['id'];
                }
                this.currentIteration = <Iteration>_.findWhere(this.scope.iterations, { id: this.story.iteration_id });
            }
        }

        setCurrentEpic() {
            if (this.story.epic != null) {
                this.currentEpic = _.findWhere(this.scope.epics, { id: this.story.epic.id });
            }
        }

        setEpics = (epics) => {
            this.scope.epics = epics;
            this.setCurrentEpic();
        }

        cardMode() {
            this.scope.taskMode = false;
        }

        taskMode() {
            this.scope.taskMode = true;
        }

        deleteCard() {
            this.unbindSortKeys();
            var trash = this.currentIteration.iteration_type;
            if (trash == 3){
                this.confirmService.confirm("Delete card?", "Are you sure you want to delete this card permanently?", "No", "Yes").then(this.onDeleteConfirm, this.onDeleteIgnored);
            }
            else{
                this.confirmService.confirm("Delete card?", "Are you sure you want to delete this card?", "No", "Yes").then(this.onDeleteConfirm, this.onDeleteIgnored);

            }
        }

        onDeleteIgnored = () => {
            this.bindEscShortcut();
            this.bindSaveShortcut();
        }

        onDeleteConfirm = () => {
            this.scope.busyMode = "Deleting Card...";
            this.savePromise = this.storyManager.deleteStory(this.story);
            this.mixpanel.track('Delete Card', {
                iteration_type: this.currentIteration.iteration_type
            });
            this.savePromise.then(this.onStoryDeleted);
        }

        onStoryDeleted = () => {
            this.close(null);
        }

        onEdited = (newValue, oldValue) => {
            if (newValue === oldValue) {
                return;
            }
            this.edited = true;
        }

        saveWithDelay() {
            // When using the shortcut, we might need to wait for the debounce on the text editors.
            this.scope.busyMode = "Saving Card...";
            this.$timeout(this.save, 600);
        }

        save = (event) => {

            this.scope.busyMode = "Saving Card...";

            var newRelease, previousRelease, ref, ref1, ref2, ref3, ref4;


            previousRelease = (ref = this.story.release) != null ? ref.id : void 0;
            angular.copy(this.scope.story, this.story);
            newRelease = (ref1 = this.story.release) != null ? ref1.id : void 0;

            if (this.scope.newStory) {
                this.story.iteration_id = this.currentIteration.id;
            }

            if (!(this.releaseMode || this.scope.newStory)) {
                if (this.currentIteration.id !== this.story.iteration_id) {
                    this.storyManager.moveToIteration(this.story, this.currentIteration.id);
                }
                if (((ref2 = this.currentEpic) != null ? ref2.id : void 0) !== ((ref3 = this.story.epic) != null ? ref3.id : void 0)) {
                    this.storyManager.moveToEpic(this.story, (ref4 = this.currentEpic) != null ? ref4.id : void 0);
                }
                if (previousRelease !== newRelease) {
                    this.story.release = {
                        id: previousRelease
                    };
                    this.storyManager.moveToRelease(this.story, newRelease);
                }
            }

            // force cell_ids to be null if card is edited and saved in (backlog or archive iteration)
            if((this.currentIteration.iteration_type != 1) && this.story.cell_id != null){
                this.story.cell_id = null;
            }

            this.story.points = this.currentPoints[0];
            this.story.time_criticality_label = this.timeCriticality[0];
            this.story.risk_reduction_label = this.riskReduction[0];
            this.story.business_value = this.story.business_value_label;
            this.story.epic = this.currentEpic;
            if (this.story.tags_list.length > 0) {
                this.story.tags_list[this.story.tags_list.length - 1] = this.story.tags_list[this.story.tags_list.length - 1].replace(/#+(?!$)/, '');
            }
            this.story.tags = this.story.tags_list.join(",");
            this.story.newComment = this.newComment;

            if ((this.newComment != null) && this.newComment !== '') {
                this.mixpanel.track("Create Comment");
            }

            trace("StoryEditorController::save", this.story.summary);

            if (this.story.id === -1) {
                this.mixpanel.track('Create Card');
                this.savePromise = this.storyManager.create(this.project.slug, this.story);
                this.savePromise.then((story) => {
                    this.story = story;
                    this.onStorySaved(story, true);
                    this.handleNewTags(story);
                }, this.onStoryFailure);

                this.onSaveAsync(event);
            } else {
                this.savePromise = this.storyManager.saveStory(this.story);
                this.savePromise.then((story) => {
                    this.onStorySaved(story);
                    this.handleNewTags(story);
                }, this.onStoryFailure);

                this.onSaveAsync(event);
            }
        }

        onSaveAsync = (event) => {
            if (!!event && event.shiftKey) {
                this.storyEditor.createStory(this.project, { iteration_id: this.story.iteration_id, cell_id: this.story.cell_id }, false);
                var root = this.scope.$root;
                // reset attachments appeard on new story window
                this.$timeout(() => {
                    root.$broadcast('reset_attachment');
                },700);
            }
            var fakeClose = true;
            this.close(this.story, fakeClose);
        }

        onStoryFailure = () => {
            this.scope.busyMode = false;
            this.storyEditor.editStory(this.story,this.project);
        }

        onStorySaved = (story, showToast = false) => {
            if (showToast && this.betaOptions.getAnimations()) {
                this.ngToast.create({
                    content: `${this.workItemName} ` + this.project.prefix + '-' + story.number + " created. <i>" + story.summary + "</i>",
                    timeout: 3000,
                    dismissButton: true
                });
            }
        }

        duplicate() {
            this.unbindSortKeys();
            this.confirmService.confirm("Duplicate card?",
                "Create a duplicate of this card?", "No", "Yes")
                .then(this.onDuplicateConfirm, this.onDuplicateIgnored);
        }

        onDuplicateIgnored = () => {
            this.bindEscShortcut();
            this.bindSaveShortcut();
        }

        onDuplicateConfirm = () => {
            this.scope.busyMode = true;
            this.storyManager.duplicate(this.story).then((result) => {
                this.scope.busyMode = false;
                this.close();
            });
            this.mixpanel.track('Duplicate Card');
        }

        convertEpic() {
            this.unbindSortKeys();
            this.confirmService.confirm("Convert Card to Collection?",
                "Would you like to convert this card to an collection?  This is a one-way operation and can not be undone.  Any tasks within this card will be converted to cards.",
                "No",
                "Yes").then(this.onConvertConfirm, this.onConvertIgnored);
        }

        onConvertIgnored = () => {
            this.bindEscShortcut();
            this.bindSaveShortcut();
            //this.bindNewCardShortcut();
        }

        onConvertConfirm = () => {
            this.storyManager.convertEpic(this.story).then((result) => {
                this.scope.busyMode = false;
                this.close();
            });
            this.mixpanel.track("Convert to Epic");
        }

        toggleIt = () => {
            if (this.activeModals.length > 1) {
                this.scope.minimised = !this.scope.minimised;
                this.scope.$parent.minimised = !this.scope.$parent.minimised;
            }
        }

        minimize = (flag:boolean = false) => {
            var modals = $(".modal");
            var higherIndex = "1060";
            var zindex = "z-index";
            var lowerIndex = "1050";
            if(flag!=true){
                this.unbindSortKeys();
            }
            this.onCardMinimized(this);
            if (this.activeModals.length > 1) {

                this.scope.$root.$broadcast('toggle', {});

                angular.forEach(modals, (item) => {
                    var modalDialog = $(item).children();
                    var isModalInMinimizedState = $(modalDialog).hasClass('card-in-minimised-state');
                    if (isModalInMinimizedState) {
                        //to maximize
                        $(item).removeClass("modal-minimize").css(zindex, lowerIndex);
                        $(modalDialog).removeClass("card-minimize-position").removeClass("card-in-minimised-state");
                        this.scope.$root.$broadcast('maximizeAction', {});
                    }
                    else {
                        //minimize
                        $(modalDialog).addClass("card-minimize-position").addClass("card-in-minimised-state");
                        $(item).addClass("modal-minimize").css(zindex, higherIndex);
                    }
                });
                $(".modal-backdrop").addClass("modal-backdrop-minimize");
            }
            else {
                //minimize first time , when only one card is open
                $(".modal-dialog").addClass("card-minimize-position");
                $(".modal").addClass("modal-minimize").css(zindex,higherIndex);
                $(".modal-backdrop").addClass("modal-backdrop-minimize");
                $(".card-minimize-position").addClass("card-in-minimised-state");
                this.scope.minimised = true;
            }

        }

        onMaximizeAction = () => {
            if(!this.scope.minimised){
                this.bindSortKeys();
            }
        }

        maximize = () => {
            this.bindSortKeys();
            if (this.activeModals.length > 1) {
                this.minimize(true);
            }
            else {
                $(".modal-minimize").removeClass("modal-minimize");
                $(".modal-backdrop").removeClass("modal-backdrop-minimize");
                $(".card-minimize-position").removeClass("card-minimize-position");
                this.scope.minimised = false;
            }
        }

        promptBlocker(blocker: StoryBlocker = null) {
            this.unbindSortKeys();
            this.blockModal = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("story/storyblocker.html"),
                controller: 'StoryBlockersController',
                controllerAs: 'ctrl',
                keyboard: true,
                resolve: {
                    story: () => this.story,
                    project: () => this.project,
                    blocker: () => blocker
                }
            });
            this.blockModal.result.then(this.bindSortKeys, this.bindSortKeys);
        }

        sortAgingDetails = (a, b) => {
            if(a[0].x > b[0].x){
                return 1;
            }else if(a[0].x < b[0].x){
                return -1
            }else{
                if(a[0].y < b[0].y) return -1;
                if(a[0].y > b[0].y) return 1;
                return 0;
            }
        }

        sortAgingGroup = (data) => {
            var order:number = 0;
            for(var i in data){
                var d = data[i];
                if(i == this.story.project_slug){
                    this.agingInfo[0] = d;
                }else{
                    order++;
                    this.agingInfo[order] = d;
                }
            }
        }


        handleNewTags(story){
            // add new tags to project scope
            if(this.scope.project != null){
                for(var i in story.tags_list){
                    var tag = {name: story.tags_list[i]};
                    if(!_.find(this.scope.project.tags, (t:any) => t.name == story.tags_list[i])){
                        this.scope.project.tags.push(tag);
                    }
                }
            }
        }

        onCardMinimized = (editor) => {
            this.storyEditor.onDialogMinimized(editor);
        }

        tabChanged = (index: number) => {
            if(index === 3){
                // links tab
                this.scope.$broadcast("drawSvgConnectors", null);
            }
        }
    }
}
