/// <reference path='../_all.ts' /> 

module scrumdo {
    export class contextMenuService {
        public static $inject: Array<string> = [
            "$resource",
            "organizationSlug",
            "$rootScope",
            "epicManager",
            "$timeout",
            "storyEditor",
            "confirmService",
            "storyManager",
            "pokerService",
            "trackTimeService",
            "$uibModal",
            "urlRewriter",
            "userService",
            "storyBulkOperations",
            "boardCellManager",
            "boardHeadersManager",
            "iterationManager",
            "$q",
            "$state"
        ];

        private boardCells;
        private boardHeaders;
        private workItemName:string;
        private workItemNameP:string;

        constructor(
            private resource: ng.resource.IResourceService,
            public organizationSlug: string,
            private rootScope,
            private epicManager: EpicManager,
            private timeout: ng.ITimeoutService,
            private storyEditor,
            private confirmService: ConfirmationService,
            private storyManager: StoryManager,
            private pokerService: PokerService,
            private trackTimeService: TrackTimeService,
            public modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter,
            private userService: UserService,
            private storyBulkOperations: StoryBulkOperations,
            private boardCellManager,
            private boardHeadersManager,
            private iterationManager:IterationManager,
            public q: ng.IQService,
            public $state: ng.ui.IStateService) {
            
            if(this.rootScope['safeTerms'] != null){
                this.workItemName = this.rootScope['safeTerms'].current.work_item_name;
                this.workItemNameP = pluralize(this.workItemName);
            }

        }

        editCard(e, scope) {
            this.storyEditor.editStory(scope.story, scope.project);
        }

        duplicateCard(e, scope) {
            this.confirmService.confirm(`Duplicate ${this.workItemName}?`, `Create a duplicate of this ${this.workItemName}?`, "No", "Yes").then(() => {
                this.storyManager.duplicate(scope.story);
            });
        }

        
        openTasks(e, scope) {
            this.storyEditor.editStory(scope.story, scope.project, true);
        }

        playPoker(e, scope) {
            this.pokerService.startPoker(scope.story);
        }

        trackTime(e, scope) {
            this.iterationManager.loadIterations(this.organizationSlug, scope.project.slug)
                .then( (iterations)=>{
                    this.trackTimeService.trackTimeOnStory(scope.project,
                        _.findWhere(iterations, { id: scope.story.iteration_id }),
                        scope.story,
                        null);
                });

        }

        deleteCard(e, scope) {
            this.confirmService.confirm(`Delete ${this.workItemName}?`, `Are you sure you want to delete this ${this.workItemName}?`, "No", "Yes").then(() => {
                this.storyManager.deleteStory(scope.story);
            });
        }

        addAttachments(e, scope) {
            var template = "attachments/attachmentservices.html";
            var dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl(template),
                controller: 'SDAttachmentServices',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    story: () => scope.story,
                    project: () => scope.project,
                    user: () => this.userService.me,
                    note: () => null,
                }
            });
        }

        moveToCell(e, scope) {
            this.storyBulkOperations.moveToCell([scope.story], scope.$root.boardProject.boardCells, scope.$root.boardProject.boardHeaders);
        }

        moveToProject(e, scope) {
            this.storyBulkOperations.moveToProject([scope.story], scope.$root.project);
        }

        assignCard(e, scope) {
            this.storyBulkOperations.assign([scope.story], scope.$root.project.members);
        }
        
        // Actions For All selected Cards

        deleteMultiple(e, scope) {
            var stories = this.getSelectedStories(scope);
            this.storyBulkOperations.delete(stories, false, this.workItemName);
        }


        assignCards(e, scope) {
            var stories = this.getSelectedStories(scope);
            this.storyBulkOperations.assign(stories, scope.$root.project.members);
        }

        duplicateCards(e, scope) {
            this.confirmService.confirm(`Duplicate ${this.workItemNameP}?`, `Create duplicates of all selected ${this.workItemNameP}?`, "No", "Yes").then(() => {
                var stories = this.getSelectedStories(scope);
                this.doDuplicate(stories[0], stories);
            });
        }

        doDuplicate(story, stories) {
            var p = this.storyManager.duplicate(story);
            p.then((newStory) => {
                if (typeof stories !== "undefined" && stories !== null) {
                    stories.splice(0, 1);
                    if (stories.length > 0) {
                        this.doDuplicate(stories[0], stories);
                    }
                }
            });
        }

        moveCardsToCell(e, scope) {
            // loading boardcells and boardheaders for planning page
            var loads = []
            loads.push(this.boardHeadersManager.loadHeaders(this.organizationSlug, scope.$root.project.slug).then(this.setHeaders));
            loads.push(this.boardCellManager.loadCells(this.organizationSlug, scope.$root.project.slug).then(this.setCells));
            var stories = this.getSelectedStories(scope);

            if (scope.$root.boardProject == null) {
                this.q.all(loads).then(() => {
                    this.storyBulkOperations.moveToCell(stories, this.boardCells, this.boardHeaders);
                });
            } else {
                this.storyBulkOperations.moveToCell(stories, scope.$root.boardProject.boardCells, scope.$root.boardProject.boardHeaders);
            }
        }

        setCells = (cells) => {
            this.boardCells = cells;
        }

        setHeaders = (headers) => {
            this.boardHeaders = headers;
        }

        moveCardsToProject(e, scope) {
            var stories = this.getSelectedStories(scope);
            this.storyBulkOperations.moveToProject(stories, scope.$root.project);
        }

        getSelectedStories(scope) {
            var selectedStories = [];
            if (scope.$root.boardStories != null && this.$state.current.name == "app.iteration.board") {
                selectedStories = selectedStories.concat(_.where(scope.$root.boardStories, { selected: true }));
                if ((scope.$root.boardProject != null) && scope.$root.boardProject.uiState.backlogOpen) {
                    selectedStories = selectedStories.concat(_.where(scope.$root.boardProject.backlogStories, { selected: true }));
                }
            }
            if (scope.$root.iterationListProject != null && this.$state.current.name == "app.iteration.cards") {
                selectedStories = selectedStories.concat(_.where(scope.$root.iterationListProject.stories, { selected: true }));
            }
            if (this.$state.current.name == "app.planning.planningcolumn" || this.$state.current.name == "app.planning.storymapping") {
                selectedStories = selectedStories.concat(this.storyManager.getSelectedStories());
            }
            return selectedStories;
        }
        
        resetCardAging(e, scope){
            this.confirmService.confirm(`Reset ${this.workItemName} aging?`, `Are you sure you want to reset ${this.workItemName} aging?`, "No", "Yes").then(() => {
                this.onConfirmResetCardAging(scope);
            });
        }
        
        onConfirmResetCardAging(scope){
            this.storyManager.resetStoryAging(scope.story).then((result) => {
                scope.story.age_hours = 0;
                this.rootScope.$broadcast("resetAgingInfo", scope.story);
            });
        }
        
        resetCardsAging(e, scope){
            var stories = this.getSelectedStories(scope);
            this.confirmService.confirm(`Reset ${this.workItemNameP} aging?`, `Are you sure you want to reset ${stories.length} ${this.workItemNameP} aging?`, "No", "Yes").then(() => {
                this.resetCardsAgingConfirmed(stories[0], stories);
            });
        }
        
        resetCardsAgingConfirmed(story, stories){
            var p = this.storyManager.resetStoryAging(story);
            p.then((result) => {
                story.age_hours = 0;
                this.rootScope.$broadcast("resetAgingInfo", story);
                if (typeof stories !== "undefined" && stories !== null) {
                    stories.splice(0, 1);
                    if (stories.length > 0) {
                        this.resetCardsAgingConfirmed(stories[0], stories);
                    }
                }
            });
        }
    }
}