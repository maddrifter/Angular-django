/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TaskController {
        public static $inject: Array<string> = [
            "$scope",
            "taskEditor"
        ];

        constructor(
            private scope,
            private taskEditor: TaskEditor) {

            this.scope.ctrl = this;
            this.setMinutesHours();
            this.scope.$watch("task.estimated_minutes", this.setMinutesHours);
        }

        edit() {
            this.taskEditor.editTask(this.scope.task, this.scope.project, this.scope.$parent.$parent.story);
        }

        setMinutesHours = () => {
            this.scope.hours = Math.floor(this.scope.task.estimated_minutes / 60);
            this.scope.minutes = pad(this.scope.task.estimated_minutes % 60, 2);
        }
    }
}