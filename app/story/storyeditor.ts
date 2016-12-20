/// <reference path='../_all.ts' />
module scrumdo {
    export class StoryEditor {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$uibModal",
            "urlRewriter",
            "storyManager",
            "epicManager",
            "userService",
            "projectManager",
            "$rootScope",
            "confirmService"
        ];

        public dialog: ng.ui.bootstrap.IModalServiceInstance;
        public minimizedDialog: StoryEditWindowController;
        public taskToCard: boolean;
        public openCards: Array<ng.ui.bootstrap.IModalServiceInstance>;

        constructor(
            public organizationSlug: string,
            public modal: ng.ui.bootstrap.IModalService,
            public urlRewriter: URLRewriter,
            public storyManager: StoryManager,
            public epicManager: EpicManager,
            public userService: UserService,
            public projectManager,
            public rootScope,
            public confirm: ConfirmationService
            ) {
            this.openCards = [];
            this.minimizedDialog = null;
            this.taskToCard = false;
            this.rootScope.$on('taskToCardCreated', this.onTaskCreated);
            this.rootScope.minimised = false;
            this.rootScope.$watch("minimised",function(val) {
                if (val == true) {
                    alert(val);
                } 
            })
        }

        createStory(project, initialParams, releaseMode = false) {
            var stub = this.storyManager.createStoryStub();
            var story = _.extend(stub, initialParams);
            
            if (this.taskToCard || this.openCards.length <2) {
                this.dialog = this.modal.open({
                    templateUrl: this.urlRewriter.rewriteAppUrl("story/storyeditwindow.html"),
                    controller: 'StoryEditWindowController',
                    size: "lg",
                    backdrop: "static",
                    keyboard: false,
                    windowClass: 'story-edit-window',
                    resolve: {
                        story: () => story,
                        project: () => project,
                        user: () => this.userService.me,
                        taskMode: () => false,
                        minimised: () => false,
                        minimizedCard: () => this.minimizedDialog
                    }
                });
                this.openCards.push(this.dialog);
                this.dialog.result.then(this.removeOpenCard);
                return this.dialog;
            }
        }

        editStory(story, project, taskMode = false, releaseMode = false) {
            if (typeof project !== "undefined" && project !== null) {
                return this._editStory(story, project, taskMode, releaseMode);
            }
            return this.projectManager
                .loadProject(this.organizationSlug, story.project_slug)
                .then((result) => {
                    return this._editStory(story, result, taskMode, releaseMode);
                });
        }

        editStoryByNumber(storyNumber, project) {
            var id, ref, story;
            ref = this.storyManager.stories;
            for (id in ref) {
                story = ref[id];
                if (story.number === storyNumber && story.project_slug === project.slug) {
                    this.editStory(story, project);
                    return;
                }
            }
            this.storyManager.searchProject(project.slug, "number: " + storyNumber).then((result) => {
                if (result.items.length > 0) {
                    this.editStory(result.items[0], project);
                } else {
                    this.confirm.confirm("Error", "Card not found", "Cancel", "k", "hide");
                }
            });
        }

        private _editStory(story, project, taskMode, releaseMode = false): ng.IPromise<{ story: Story, savePromise: ng.IPromise<any> }> {


            if (this.openCards.length && this.minimizedDialog != null) {
                if (this.minimizedDialog.story == story) {
                    this.minimizedDialog.maximize();
                    return;
                }
            }

            if (this.taskToCard || this.openCards.length < 2) {
                var template = '';
                if (this.userService.canWrite(project.slug)) {
                    template = "story/storyeditwindow.html";
                } else {
                    template = "story/storyviewwindow.html";
                }
                this.dialog = this.modal.open({
                    templateUrl: this.urlRewriter.rewriteAppUrl(template),
                    controller: 'StoryEditWindowController',
                    size: "lg",
                    backdrop: "static",
                    animation: false,
                    keyboard: false,
                    windowClass: 'story-edit-window',
                    resolve: {
                        story: () => story,
                        project: () => project,
                        user: () => this.userService.me,
                        taskMode: () => taskMode,
                        minimised: () => false,
                        releaseMode: () => releaseMode,
                        minimizedCard: () => this.minimizedDialog
                    }
                });

                this.openCards.push(this.dialog);
                this.dialog.result.then(this.onDialogClosed);
                return this.dialog.result;
            }
        }


        onDialogClosed = (result: { story: Story, savePromise: ng.IPromise<any> }) => {
            this.dialog = null;
            this.openCards.pop();

            if (result.story != null && this.minimizedDialog != null) {
                if (result.story.id == this.minimizedDialog.story.id) {
                    this.minimizedDialog = null;
                }
            }
            this.taskToCard = false;
            if(result.savePromise){
                result.savePromise.then((story) => {
                    this.rootScope.$broadcast('storyModified', story);
                });
            }
        }

        onDialogMinimized = (editor) => {
            this.minimizedDialog = editor;
        }

        onTaskCreated = () => {
            this.taskToCard = true;
        }

        removeOpenCard = () => {
            this.openCards.pop();
        }
    }
}