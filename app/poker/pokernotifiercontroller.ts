/// <reference path='../_all.ts' />
// TODO - refactor this to a general notification component since it does chat as well as poker now.

module scrumdo {
    export class SDPokerNotifierController {
        public static $inject: Array<string> = [
            "$scope",
            "pokerService",
            "topNavbarMode",
            "organizationSlug"
        ];

        private element: HTMLElement;
        private pokerOpened: boolean;
        private chatOpened: boolean;
        private chatMessage;
        private autoChatOpen: boolean;
        private newChat: boolean;

        constructor(
            private scope,
            private pokerService: PokerService,
            public topNavbarMode,
            public organizationSlug: string) {

        }

        init(element) {
            this.element = element;
            this.pokerOpened = false;
            this.chatOpened = false;
            this.scope.$watch("ctrl.pokerService.pokerRequest", this.onRequestChange);
            if (this.topNavbarMode !== 'chat') {
                this.scope.$on('chat:message', this.onChatMessage);
            }
            this.chatMessage = null;
            this.autoChatOpen = true;
            this.newChat = false;
        }

        onChatMessage = (event, message) => {
            if (this.autoChatOpen) {
                this.chatOpened = true;
            }
            this.autoChatOpen = false;
            this.newChat = true;
            this.chatMessage = message.payload;
        }

        closeChat() {
            this.newChat = false;
            this.chatOpened = false;
        }

        onRequestChange = (newRequest, oldRequest) => {
            if ((typeof newRequest !== "undefined" && newRequest !== null ? newRequest.storyId : void 0) !== (typeof oldRequest !== "undefined" && oldRequest !== null ? oldRequest.storyId : void 0)) {
                if(!this.pokerService.isPlayingPoker){
                    this.pokerOpened = true;
                }
            }
        }

        joinPoker() {
            this.pokerService.joinPoker();
        }
    }
}