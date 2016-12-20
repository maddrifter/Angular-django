/// <reference path='../_all.ts' />

module scrumdo {
    export class ReleaseColumnController {
        public static $inject: Array<string> = [
            "releaseStatManager",
            "organizationSlug",
            "$scope"
        ];

        constructor(
            private releaseStatManager,
            public organizationSlug: string,
            private scope) {

            this.scope.releaseStats = {};
            this.scope.$root.$on("DATA:PATCH:RELEASESTAT", this.onPatch);
            this.releaseStatManager.loadStats(organizationSlug).then((stats) => {
                for (var i = 0, len = stats.length; i < len; i++) {
                    var stat = stats[i];
                    this.scope.releaseStats[stat.release_id] = stat;
                }
            });
        }

        onPatch = (event, message) => {
            var releaseId = message.payload.id;
            if (!(releaseId in this.scope.releaseStats)) {
                return;
            }
            var stats = this.scope.releaseStats[releaseId];
            var props = message.payload.properties;
            _.extend(stats, props);
        }
    }
}