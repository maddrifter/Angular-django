/// <reference path='../_all.ts' />

module scrumdo {
    export class ChatController {
        public static $inject: Array<string> = [
            "$scope",
            "chatService",
            "organizationSlug",
            "FileUploader",
            "projectData",
            "$location"
        ];

        public message: string;

        constructor(
            public scope,
            public chat: ChatService,
            public organizationSlug: String,
            public FileUploader,
            projectData:ProjectDatastore,
            public $location) {
            
            if(!projectData.currentProject.tab_chat){
                this.$location.path('/');
            }
            
            this.chat.joinProject(projectData.currentProject);


        }

        send() {
            // retrun if user mention popup is open
            if ($('.sdMentio:visible').length > 0) {
                return;
            }
            if (this.message === '') {
                return;
            }
            this.chat.sendMessage(this.message);
            this.message = "";
        }
    }
}