/// <reference path='../_all.ts' />

module scrumdo {
    export class PokerWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "pokerService",
            "realtimeService"
        ];

        constructor(
            private scope,
            private pokerService: PokerService,
            private realtimeService) {
            this.scope.poker = pokerService;
        }
    }
}