/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TaskEditor {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$uibModal",
            "urlRewriter",
            "taskManager"
        ];

        private project;
        private dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            public organizationSlug: string,
            public modal: ng.ui.bootstrap.IModalService,
            private urlRewriter: URLRewriter,
            private taskManager: TaskManager) {
        }

        editTask(task, project, story) {
            this.project = project;
            this.dialog = this.modal.open({
                keyboard: false,
                templateUrl: this.urlRewriter.rewriteAppUrl("task/taskeditwindow.html"),
                controller: 'TaskEditWindowController',
                resolve: {
                    task: () => task,
                    project: () => project,
                    story: () => story
                }
            });
            this.dialog.result.then(this.onDialogClosed);
        }
        
        deleteTask(task){
            this.taskManager.deleteTask(task, this.project.slug);
        }

        onDialogClosed = (options) => {
            var task = options.task;
            var action = options.action;
            trace("TaskEditor::onDialogClosed" + task.summary);
            if (action === 'save') {
                this.taskManager.saveTask(task, this.project.slug);
            } else if (action === 'delete') {
                this.taskManager.deleteTask(task, this.project.slug);
            } else if (action === 'close') {
                this.dialog.close();
            }
        }
    }
}