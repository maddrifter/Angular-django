/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TaskEditWindowController {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$scope",
            "task",
            "project",
            "story",
            "confirmService",
            "hotkeys",
            "$uibModalInstance",
            "$rootScope",
            "storyEditor",
            "taskEditor"
        ];

        private tasktags;
        private tags: Array<any>;
        private estimateHours;
        private estimateMinutes;

        constructor(
            public organizationSlug: string,
            private scope,
            private task,
            private project,
            private story,
            private confirmService: ConfirmationService,
            public hotkeys,
            public dialog: ng.ui.bootstrap.IModalServiceInstance,
            public rootscope,
            public storyEditor: StoryEditor,
            public taskEditor: TaskEditor) {

            trace("TaskEditorController");
            // assign project to scope for search pages
            if (this.scope.project == null) {
                this.scope.project = this.project;
            }
            this.scope.task = angular.copy(this.task);
            if ((this.task.assignee != null) && (this.task.assignee.username != null)) {
                this.scope.assignee = this.task.assignee.username;
            }
            if (this.task.tags !== "") {
                this.tasktags = this.task.tags.split(",");
            } else {
                this.tasktags = [];
            }

            this.tags = (function() {
                var i, len, ref, results;
                ref = this.scope.project.tags;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var tag = ref[i];
                    results.push(tag);
                }
                return results;
            }).call(this);

            this.scope.ctrl = this;

            this.hotkeys.del('esc');
            this.dialog.result.then(this.bindCardEscKey);
            this.dialog.closed.then(this.bindCardEscKey);
        }

        bindCardEscKey = () => {
            this.rootscope.$broadcast('bindcardesckey', {});
        }

        save() {
            angular.copy(this.scope.task, this.task);
            //this.task.estimated_minutes = minutesHoursToMinutes(this.estimateHours, this.estimateMinutes);
            this.task.tags = this.tasktags.join(",");
            if ((this.scope.assignee != null) && this.scope.assignee.length > 0) {
                this.task.assignee = { 'username': this.scope.assignee };
            } else {
                this.task.assignee = null;
            }
            this.scope.$close({ task: this.task, action: 'save' });
        }

        confirmDelete() {
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this task?", "No", "Yes").then(() => {
                this.scope.$close({ task: this.task, action: 'delete' });
            });
        }

        convertToCard() {
            this.confirmService.confirm("Convert Task to Story?",
                "Would you like to convert this task to a story? This is a one-way operation and cannot be undone. This task will be deleted after this operation.",
                "No",
                "Yes").then(this.onConvertConfirm);
        }

        onConvertConfirm = () => {
            var task = this.task;
            var story= this.story;
            var tags_list = task.tags !== "" ? task.tags.split(",") : [];
            var cellId = story.cell != null ? story.cell.id : null;
            this.scope.$close({ task: this.task, action: 'close' });

            this.rootscope.$broadcast("taskToCardCreated", {});

            var storyDialog:ng.ui.bootstrap.IModalServiceInstance = this.storyEditor.createStory(this.project, {
                relativeRank: 0,
                cell_id: cellId,
                iteration_id: story.iteration_id,
                assignee: task.assignee != null? [task.assignee] : [],
                tags: task.tags,
                tags_list: tags_list,
                summary: task.summary,
                estimated_minutes: task.estimated_minutes,
                epic: story.epic,
                release: story.release,
                fromTaskId: this.task.id
            });
            
            storyDialog.result.then((result:{story:Story, savePromise:ng.IPromise<any>}) => {
                // The story isn't actually saved until after this promise finishes.
                //got result.savePromise undefined if user hit esc button 
                if (result.savePromise != null){
                    result.savePromise.then((story)=>{
                        if (story != null && story.id > 0) {
                            this.taskEditor.deleteTask(this.task);
                        }
                    });
                }
            });
        }
    }
}