/// <reference path='../../_all.ts' />

module scrumdo {
    export class HipChatExtraController {
        public static $inject: Array<string> = [
            "$scope",
            "API_PREFIX",
            "$http",
            "boardProject"
        ];

        private addChannelOptions: {};
        private extraConfig;

        constructor(
            private scope,
            private API_PREFIX,
            public http: ng.IHttpService,
            private boardProject) {

            this.addChannelOptions = {
                name: null,
                token: null,
                new_card: true,
                card_moved: true,
                card_edited: true,
                comment_created: true
            }

            this.http.get(this.API_PREFIX + "organizations/" + this.boardProject.organizationSlug + "/projects/" +
                this.boardProject.projectSlug + "/extras/hipchat").then((result) => {
                    this.extraConfig = result.data;
                });
        }

        addChannel(options) {
            options.action = 'addChannel';
            this.http.post(this.API_PREFIX + "organizations/" + this.boardProject.organizationSlug + "/projects/" +
                this.boardProject.projectSlug + "/extras/hipchat", options).then((result) => {
                    this.extraConfig = result.data;
                });
        }

        removeChannel(channelId) {
            var options = {
                action: 'removeChannel',
                channelId: channelId
            }
            this.http.post(this.API_PREFIX + "organizations/" + this.boardProject.organizationSlug + "/projects/" +
                this.boardProject.projectSlug + "/extras/hipchat", options).then((result) => {
                    this.extraConfig = result.data;
                });
        }
    }
}