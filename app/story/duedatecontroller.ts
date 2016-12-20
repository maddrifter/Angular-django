/// <reference path='../_all.ts' /> 

module scrumdo {
    export class DueDateController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        constructor(public scope) {
            this.setClass();
            this.scope.$watch("story.due_date", this.setClass);
        }

        setClass = () => {
            if (this.scope.story.due_date != null) {
                var today: any = new Date();
                today.setHours(0, 0, 0, 0);
                this.scope.due_date_label = moment(this.scope.story.due_date).format('YYYY-MM-DD');
                var d: any = moment(this.scope.story.due_date);
                var diff = d - today;
                if (diff < 0) {
                    this.scope.iconClass = 'past-due';
                    return 'past-due';
                }
                if (diff <= 432000000) {
                    this.scope.iconClass = 'due-soon';
                    return 'due-soon';
                }
            }

            this.scope.iconClass = this.scope.story.id;
        }
    }
}