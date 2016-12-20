/// <reference path='../_all.ts' />

module scrumdo {
    export class ChatService {
        public static $inject: Array<string> = [
            "$rootScope",
            "$http",
            "realtimeService",
            "FileUploader",
            "$cookies",
            "userService"
        ];

        public currentProject:Project;

        private hasMore: boolean;
        private chatHistory: Array<any>;
        private page: number;
        public uploader;


        constructor(
            public rootScope,
            public http: ng.IHttpService,
            public realtimeService,
            public FileUploader,
            public cookies: ng.cookies.ICookiesService,
            public userService: UserService) {

            this.hasMore = false;
            this.chatHistory = [];
            this.page = 0;

            this.rootScope.$watch('user', this.rejoin);
            this.rootScope.$on('$stateChangeStart', this.onStateChange);
            this.rootScope.$on('chat:message', this.onChatMessage);
            this.rootScope.$on('chat:file', this.onChatMessage);
            
            this.uploader = new this.FileUploader({
                headers: {
                    'X-CSRFToken': this.cookies.get('csrftoken')
                }
            });
            this.uploader.autoUpload = true;
            this.uploader.alias = 'attachment_file';

        }

        canWrite() {
            return this.userService.canWrite(this.currentProject.slug);
        }


        onChatMessage = (event, message) => {
            var day = this.getDay(message.payload.date);
            day.lines.push(message.payload);
        }

        onStateChange = (event, toState, toParams, fromState, fromParams) => {
            if (toState.name === 'chat') {
                this.joinProject(toParams.projectSlug);
            }
        }

        joinProject(project) {
            if (project === this.currentProject) {
                return;
            }
            this.currentProject = project;
            this.chatHistory = [];
            this.page = 1;
            this.loadHistory(project.slug);
            this.uploader.url = "/realtime/" + this.currentProject.slug + "/chat_upload";
            this.rejoin();
        }

        loadMoreHistory() {
            if (this.currentProject == null) {
                return;
            }
            this.page++;
            this.loadHistory(this.currentProject.slug);
        }

        loadHistory(projectSlug: string) {
            this.hasMore = false;
            var url: string = "/realtime/" + this.currentProject.slug + "/chat_history?page=" + this.page;
            this.http.get(url).then(this.onHistory);
        }

        onHistory = (result) => {
            this.hasMore = result.data.has_more;
            var ref = _.pluck(result.data.lines, "payload");
            for (var i = 0, len = ref.length; i < len; i++) {
                var entry = ref[i];
                if ((entry != null) && (entry.date != null)) {
                    var day = this.getDay(entry.date);
                    day.lines.push(entry);
                }
            }
        }

        rejoin = () => {
            this.realtimeService.joinProject(this.currentProject.slug);
        }

        getDay(day) {
            var entry = _.findWhere(this.chatHistory, {
                day: day
            });
            if (typeof entry !== "undefined" && entry !== null) {
                return entry;
            }
            entry = { day: day, tday: moment(day).format('YYYY-MM-DD'), lines: [] };
            this.chatHistory.push(entry);
            this.chatHistory = _.sortBy(this.chatHistory, (entry) => { entry.tday });
            return entry;
        }

        sendMessage(text: string) {
            var url: string = "/realtime/" + this.currentProject.slug + "/chat_callback";
            this.http({
                method: 'POST',
                url: url,
                data: $.param({ message: text }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        }
    }
}