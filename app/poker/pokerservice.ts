/// <reference path='../_all.ts' />

module scrumdo {
    export class PokerService {
        public static $inject: Array<string> = [
            "$rootScope",
            "realtimeService",
            "userService",
            "$uibModal",
            "urlRewriter",
            "storyManager",
            "projectManager",
            "epicManager",
            "organizationSlug",
            "mixpanel",
        ];

        public available: boolean = true;

        private scrumMaster: boolean;
        private story;
        private project;
        private epics;
        private votes;
        private myVote;
        private pokerRequest;
        private window: ng.ui.bootstrap.IModalServiceInstance;
        private otherStories;
        public isPlayingPoker: boolean;

        constructor(
            private rootScope,
            private realtimeService : RealtimeService,
            private userService: UserService,
            public modal,
            public urlRewriter: URLRewriter,
            private storyManager,
            private projectManager,
            private epicManager: EpicManager,
            public organizationSlug: string,
            private mixpanel) {

            this.scrumMaster = false;
            this.isPlayingPoker = false;
            this.story = null;
            this.project = null;
            this.epics = null;
            this.votes = {};
            this.pokerRequest = null;
            this.rootScope.$on("poker:start", this.onPokerStart);
            this.rootScope.$on("poker:reset", this.onPokerReset);
            this.rootScope.$on("poker:stop", this.onPokerStopped);
            this.rootScope.$on("poker:vote", this.onSomeoneElseVoted);
            this.rootScope.$on("poker:complete", this.onComplete);
        }

        onComplete = () => {
            this.pokerRequest = null;
            if(this.scrumMaster){
                this.closeWindow();
            }
        }

        closeWindow() {
            if (this.window != null) {
                this.window.close();
                this.isPlayingPoker = false;
                this.window = null;
            }
        }

        close() {
            this.isPlayingPoker = false;
            this.window.close();
        }

        onSomeoneElseVoted = (event, payload) => {
            var uuid = payload.client;
            this.votes[uuid] = payload.payload;
        }

        startPoker(story) {
            this.projectManager.loadProject(this.organizationSlug, story.project_slug).then((project) => {
                this.project = project;
            });
            this.epicManager.loadEpics(this.organizationSlug, story.project_slug).then((epics) => {
                this.epics = epics;
            });
            this.story = story;
            this.scrumMaster = true;
            this.realtimeService.sendMessage("poker:start", {
                sender: this.userService.myName,
                storyId: story.id,
                summary: story.summary.slice(0, 76),
                number: story.number,
                iterationId: story.iteration_id,
                projectSlug: story.project_slug
            });
            this.showPokerWindow(story);
            this.mixpanel.track('Start Poker');
        }

        save() {
            this.story.points = this.myVote;
            this.storyManager.saveStory(this.story).then(() => {
                this.realtimeService.sendMessage("poker:complete", {});
                this.onComplete();
                this.mixpanel.track('Poker Hand Saved', { players: _.keys(this.votes).length, points: this.story.points });
            });
        }

        reset() {
            this.initializeVotes();
            this.realtimeService.sendMessage("poker:reset", {
                sender: this.userService.myName,
                storyId: this.story.id,
                summary: this.story.summary.slice(0, 76),
                number: this.story.number,
                iterationId: this.story.iteration_id,
                projectSlug: this.story.project_slug
            });
        }

        joinPoker() {
            this.scrumMaster = false;
            this.projectManager.loadProject(this.organizationSlug, this.pokerRequest.projectSlug).then((project) => {
                this.project = project;
            });
            this.epicManager.loadEpics(this.organizationSlug, this.pokerRequest.projectSlug).then((epics) => {
                this.epics = epics;
            });
            this.storyManager.loadStory(this.pokerRequest.storyId, this.pokerRequest.projectSlug, this.pokerRequest.iterationId).then((story) => {
                this.story = story;
                this.showPokerWindow(story);
            });
            this.mixpanel.track('Joined Poker');
        }

        initializeVotes() {
            this.votes = {};
            this.myVote = null;
        }

        showPokerWindow(story) {
            this.initializeVotes();
            this.closeWindow();
            this.isPlayingPoker = true;
            this.window = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("poker/pokerwindow.html"),
                windowClass: "scrumdo-modal primary planning-poker",
                controller: "PokerWindowController",
                controllerAs: "ctrl",
                backdrop: "static",
                keyboard: false
            });
        }

        getPointLabel(value) {
            var i, len, point, ref;
            ref = this.project.point_scale;
            for (i = 0, len = ref.length; i < len; i++) {
                point = ref[i];
                if (point.indexOf(value.toString()) > -1) {
                    return point[1];
                }
            }
        }

        setVote(value) {
            this.myVote = value;
            this.votes[this.realtimeService.clientUUID] = {
                sender: this.userService.myName,
                value: value,
                mine: true
            };
            //Test of many values on screen...
            //var i, j;
            //for (i = j = 0; j <= 15; i = ++j) {
            //    this.votes[i] = vote;
            //}

            this.realtimeService.sendMessage("poker:vote", { sender: this.userService.myName, value: value });
            this.storyManager.searchProject(this.project.slug, "points:" + this.myVote + ", order:-modified").then((result) => {
                this.otherStories = result.items;
            });
        }

        onPokerStopped = () => {
            this.pokerRequest = null;
        }

        onPokerReset = (event, request) => {
            this.pokerRequest = request.payload;
            this.initializeVotes();
        }

        onPokerStart = (event, request) => {
            this.pokerRequest = request.payload;
            if(this.isPlayingPoker && !this.scrumMaster){
                this.joinPoker();
            }
        }
    }
}