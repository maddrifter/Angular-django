/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TaskGridController {
        public static $inject: Array<string> = [
            "$scope",
            "taskManager",
            "urlRewriter",
            "$uibModal",
            "$element",
            "$timeout",
            "mixpanel",
            "userService",
            "hotkeys"
        ];

        private sortables: Array<any>;
        private taskStatusList;
        private setupSortable;
        private dialog:ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            private scope,
            private taskManager: TaskManager,
            public urlRewriter: URLRewriter,
            public modal: ng.ui.bootstrap.IModalService,
            private element,
            private timeout: ng.ITimeoutService,
            private mixpanel,
            private userService: UserService,
            public hotkeys) {

            this.sortables = [];
            this.scope.ctrl = this;
            this.scope.$watch("story", this.onStoryChange);
            this.scope.$on("taskAdded", this.remoteTaskAdded);
            this.setupSortable = _.debounce(this._setupSortable, 15);
            //this.onSortTask = _.debounce(this._onSortTask, 15)
            this.timeout(this.setupSortable, 750);
            //this.scope.$on("newTask", this.onNewTask);
        }

        _setupSortable = () => {
            if(isMobileDevice()){
                return;
            }
            if (!this.userService.canWrite(this.scope.project.slug)) {
                return;
            }

            trace("Setting up task drag & drop");
            var ref = this.sortables;
            for (var i = 0, len = ref.length; i < len; i++) {
                var s = ref[i];
                s.destroy();
            }

            this.sortables = [];
            ref = this.element.find(".task-list, .task-list-cell");
            for (i = 0, len = ref.length; i < len; i++) {
                var el = ref[i];
                s = new Sortable(el, {
                    group: "tasks" + this.scope.story.id,
                    filter: ".no-drag",
                    draggable: ".task-view",
                    onAdd: this.onSortTask,
                    onUpdate: this.onSortTask
                });
                this.sortables.push(s);
            }
        }

        onSortTask = (event) => {
            trace("onSortTask");
            var item = $(event.item); // This is the html element that was dragged.
            var placeholder = $(event.placeholder);
            var parent = placeholder.parent();
            if (parent.hasClass('task-list-cell')) {
                parent = parent.children();
                var i = parent.children().length;
            } else {
                var i = placeholder.index();
            }

            var status = parseInt(parent.attr("data-status-id"));
            if (isNaN(status)) {
                trace("ERROR: Dragged to container with no status");
                return;
            }

            var task = this.taskManager.getTask(item.attr("data-task-id"));
            if (typeof task === "undefined" || task === null) {
                return;
            }

            task.status = status;
            if (i < parent.children().length - 1) {
                task.task_after_id = $(parent.children()[i + 1]).attr("data-task-id");
                var other = this.taskManager.getTask(task.task_after_id);
                task.order = Math.max(0, other.order - 1);
            } else {
                task.task_after_id = -1;
            }

            if (i > 0) {
                task.task_before_id = $(parent.children()[i - 1]).attr("data-task-id");
                var other = this.taskManager.getTask(task.task_before_id);
                task.order = other.order + 1;
            } else {
                task.task_before_id = -1;
            }

            this.taskManager.saveTask(task, this.scope.project.slug);
            placeholder.remove();
            this.setTaskCounts();
            this.scope.$apply();
        }

        setTaskCounts() {
            var i, j;
            for (i = j = 0; j <= 9; i = ++j) {
                this.scope.story.task_counts[i] = _.where(this.scope.tasks, {
                    status: i + 1
                });
            }
            return;
        }

        loadTasks() {
            this.taskManager.loadTasks(this.scope.story.project_slug, this.scope.story.id, this.scope.story.task_count).then((tasks) => {
                this.scope.tasks = tasks;
            });
        }
        
        remoteTaskAdded = (event, task) => {
            if(task.story_id === this.scope.story.id){
                this.scope.tasks.push(task);
            }
        }

        newTask() {
            var t = this;
            this.hotkeys.del('esc');
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("task/newtaskwindow.html"),
                controller: 'NewTaskWindowController',
                keyboard: false,
                resolve: {
                    project: () => this.scope.project,
                    story: () => this.scope.story,
                    tasks: () => this.scope.tasks
                }
            });
            this.dialog.result.then(this.bindCardEscKey);
            this.dialog.closed.then(this.bindCardEscKey);
        }
        
        bindCardEscKey = () => {
            this.scope.$root.$broadcast('bindcardesckey', {});
        }

        filterTask(statusId) {
            return function(task) {
                return task.status === statusId;
            };
        }

        onStoryChange = () => {
            this.loadTasks();
        }

        taskStatuses() {
            if (!this.taskStatusList) {
                this.taskStatusList = reduceTasks(this.scope.project.task_statuses);
            }
            return this.taskStatusList;
        }
    }
}