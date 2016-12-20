/// <reference path='../../_all.ts' />

// Mimics the realtime service api, but doesn't do anything.

module scrumdo {
    export class NullRealtimeService {
        public static $inject: Array<string> = [
            "$rootScope"
        ];

        public allUsers;

        constructor(public scope) {
            this.scope.realtime = this;
            this.allUsers = {};
        }

        sendMessage(messageType, payload) {
            trace("Not Sending message " + messageType, payload);
        }
    }
}