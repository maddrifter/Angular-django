/// <reference path='../_all.ts' />

module scrumdo {
    export class IterationController {
        public static $inject:Array<string> = [
            'projectData'

        ];

        constructor(public projectData:ProjectDatastore) {
            debugger
        }

    }
}