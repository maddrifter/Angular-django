/// <reference path='../_all.ts' />

module scrumdo {
    export class SafeColumnController {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$scope"
        ];

        constructor(
            public organizationSlug: string,
            private scope) {
        }
    }
}