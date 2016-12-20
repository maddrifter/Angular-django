/// <reference path='../_all.ts' />

module scrumdo {
    export class EpicColumnController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "organizationSlug",
            "projectSlug"
        ];

        constructor(
            private scope,
            private storyManager,
            public organizationSlug: string,
            public projectSlug: string) {

        }

        filterEpic = (epic) => {
            return this.scope.showArchived || !epic.archived;
        }
    }
}