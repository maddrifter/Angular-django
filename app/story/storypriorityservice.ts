/// <reference path='../_all.ts' />
module scrumdo {
    export class StoryPriorityService {
        public static $inject: Array<string> = [
            "$rootScop"
        ];

        public priorityMode: boolean = false;

        constructor(public rootScope) {
            rootScope.$on('priorityMode', this.setPriorityMode)
        }

        setPriorityMode = (event, priority) => {
            this.priorityMode = priority;
        }
    }
}