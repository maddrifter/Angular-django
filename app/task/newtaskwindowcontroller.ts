/// <reference path='../_all.ts' /> 

module scrumdo {
    export class NewTaskWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "project",
            "$rootScope",
            "taskManager",
            "mixpanel",
            "story",
            "tasks"
        ];

        private estimateHours;
        private estimateMinutes;
        private tags;
        private newtags: Array<any>;
        private sortedPeople: Array<any>;

        constructor(
            private scope,
            private project,
            private rootScope,
            private taskManager: TaskManager,
            private mixpanel,
            private story,
            private tasks) {

            this.estimateHours = 0;
            this.estimateMinutes = 0;
            this.scope.ctrl = this;
            this.scope.project = project;
            this.tags = (function() {
                var i, len, ref, results;
                ref = project.tags;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var tag = ref[i];
                    results.push(tag);
                }
                return results;
            })();
            this.newtags = [];
            this.createTaskStub();
            this.sortedPeople = this.scope.project.members.slice();
            this.createSortIndex();

        }

        createTaskStub() {
            this.scope.task = {
                summary: '',
                assignee: null,
                tags: '',
                estimated_minutes: 0
            };
        }

        save($event) {
            //this.rootScope.$broadcast("newTask", this.scope.task);
            this.scope.task.tags = this.newtags.join(", ");
            this.taskManager.create(this.scope.project.slug, this.story.id, this.scope.task).then(this.setTaskCounts);
            this.mixpanel.track('Create Task');
            this.createTaskStub();
            if (!$event.shiftKey) {
                this.scope.$close();
            }
        }

        setTaskCounts = () => {
            var i, j;
            for (i = j = 0; j <= 9; i = ++j) {
                this.story.task_counts[i] = _.where(this.tasks, {
                    status: i + 1
                });
            }
            return;
        }

        sortUsers() {
            this.sortedPeople.sort(this.userSortOrder);
        }

        createSortIndex() {
            _.forEach(this.sortedPeople, (user, i) => {
                var index = "";
                if (user.last_name !== "" && user.first_name !== "") {
                    index = user.last_name;
                }
                if (user.last_name === "" && user.first_name !== "") {
                    index = user.first_name;
                }
                if (user.first_name === "" && user.last_name === "") {
                    index = user.username;
                }
                this.sortedPeople[i].sindex = index;
            });
            this.sortUsers();
        }

        userSortOrder(a, b) {
            var x, y;
            if ((a.sindex == null) || (b.sindex == null)) {
                return 0;
            }
            x = a.sindex.toLowerCase();
            y = b.sindex.toLowerCase();
            if (x === y) {
                return 0;
            }
            if (x < y) {
                return -1;
            } else {
                return 1;
            }
        }
    }
}