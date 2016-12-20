/// <reference path='../../_all.ts' />
/*
# Message format:
# An array of:
#  {
#    type: "DATA"      also POKER or CHAT
#                      They will be split up into sub commands with colons
#                      DATA:SYNC:STORY DATA:ADD:STORY DATA:DEL:STORY
#
#    payload: {a:1, b:2}  Data specific to the type/command
#  }
*/

module scrumdo {
    export class OrgRealtimeService {
        public static $inject: Array<string> = [
            "PubNub",
            "$rootScope",
            "organizationSlug",
            "userService",
            "$timeout",
        ];

        public allUsers;
        public userList;
        public sendQueue: Array<any>;
        public startupTime;
        public senderId: string;
        public channelName:Array<string> = [];
        public clientUUID: string;
        public connection;
        public timer;
        public PUBNUB_SUB_KEY:string;
        public PUBNUB_PUB_KEY:string;
        public UUID:string;

        constructor(
            public PubNub,
            public scope,
            public organizationSlug: string,
            public userService: UserService,
            public timeout: ng.ITimeoutService) {

            this.scope.$watch("user", this.onUserLoaded, true);
            this.scope.realtime = this;
            this.allUsers = {};
            this.sendQueue = [];
        }

        onUserLoaded = (val) => {
            if (this.scope.user == null) {
                return;
            }
            /*
            # Our API call to get the current user has succeeded,
            # so now we know the keys to use, and the channel to join.
            # Example result:
            #{
            #   username: "mhughes",
            #   first_name: "Marc",
            #   last_name: "Hughes",
            #   project_access: {
            #       uuid: "xxxxx",
            #       publishKey: "xxxxx",
            #       subscribeKey: "xxxxxx",
            #       canWrite: 1,
            #       canRead: true,
            #       channel: "xxxxxx"
            #   },
            #   avatar: "http://192.168.1.125:8000/avatar/avatar/24/mhughes",
            #   id: 1
            #}
           */
            if (this.organizationSlug != null) {
                //this.joinAllProjects(this.organizationSlug);
            }
        }

        joinAllProjects(organizationSlug){
            _.forEach(this.userService.me.project_access, (p) => {
                this.channelName.push(p.channel);
                this.PUBNUB_SUB_KEY = p.subscribeKey;
                this.PUBNUB_PUB_KEY = p.publishKey;
                this.UUID = p.uuid;
            });
            this.joinProject();
        }

        unsubscribeProject(project: any){
           var channelId = this.userService.me.project_access[project.slug].channel;
           var i = this.channelName.indexOf(channelId);
           if(i > -1){
               this.channelName.splice(i, 1);
               this.joinProject();
           }
       }

       subscribeProjects(projects:Array<any>){
           this.channelName = [];
           _.forEach(projects, (project) => {
               var p = this.userService.me.project_access[project.slug];
               var i = this.channelName.indexOf(p.channel);
               if(i < 0){
                   this.channelName.push(p.channel);
                   this.PUBNUB_SUB_KEY = p.subscribeKey;
                   this.PUBNUB_PUB_KEY = p.publishKey;
                   this.UUID = p.uuid;
               }
           });
           this.joinProject();
       }

        joinProject() {
            var previousChannels, t;

            trace("Connecting to pubnub");
            t = this;
            this.startupTime = new Date().getTime();
            this.senderId = "" + (Math.random());

            previousChannels = this.PubNub.ngListChannels();
            for (var i = 0, len = previousChannels.length; i < len; i++) {
                var channel = previousChannels[i];
                this.PubNub.ngUnsubscribe({
                    channel: channel
                });
            }

            this.clientUUID = "" + this.UUID + (Math.round(Math.random() * 999999));
            this.PubNub.init({
                subscribe_key: this.PUBNUB_SUB_KEY,
                publish_key: this.PUBNUB_PUB_KEY,
                uuid: this.UUID,
                ssl: true,
                noleave: true
            });

            this.connection = this.PubNub.ngSubscribe({
                channel: this.channelName,
                state: {
                    username: this.userService.me.username,
                    first_name: this.userService.me.first_name,
                    last_name: this.userService.me.last_name,
                    user_id: this.userService.me.id,
                    avatar: this.userService.me.avatar
                },
                error: function() {
                    return console.log(arguments);
                }
            });

            this.PubNub.ngHereNow({ channel: this.channelName });

            this.scope.$on(this.PubNub.ngPrsEv(this.channelName), (event, payload) => {
                this.allUsers = this.PubNub.ngPresenceData(this.channelName);
                trace("Presence data updated, " + (_.keys(this.allUsers).length) + " users present");
                this.scope.$applyAsync();   // I don't understand why this $apply is necessary.  The angular/pubnub api is supposed to
                // wrap presence events for me, but it doesn't seem to work.  But it doesn't work without it.
            });

            this.scope.$on(this.PubNub.ngMsgEv(this.channelName), this.onMessage);

        }

        sendMessage(messageType, payload) {
            this.sendQueue.push({
                client: this.clientUUID,
                type: messageType,
                payload: payload
            });
            if (this.sendQueue.length < 10) {
                this.cancelSendTimer();
                this.timer = this.timeout(this.sendMessageBatch, 0);
            } else {
                this.sendMessageBatch();
            }
        }

        cancelSendTimer() {
            if (this.timer != null) {
                this.timeout.cancel(this.timer);
            }
        }

        sendMessageBatch = () => {
            if (this.sendQueue.length === 0) {
                return;
            }
            this.cancelSendTimer();
            trace("Sending " + this.sendQueue.length + " messages " + (_.pluck(this.sendQueue, 'type')));
            this.PubNub.ngPublish({
                channel: this.channelName,
                message: this.sendQueue
            });
            this.sendQueue = [];
        }

        onMessage = (event, payload) => {
            // payload contains message, channel, env...
            this.scope.$applyAsync(() => {
                this._onMessage(event, payload);
            });
        }

        _onMessage = (event, payload) => {
            var i, len, message, ref, results;
            ref = payload.message;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
                message = ref[i];
                if (message.client === this.clientUUID) {
                    trace("skipping message I sent");
                    continue;
                }
                trace("got a message event " + message.type, message.payload);
                results.push(this.scope.$broadcast(message.type, message));
            }
            return results;
        }

        fixUUID(uuid) {
            if (uuid.substr(0, 5) === "{\\x22") {
                return uuid.replace(/\\x22/g, "\"");
            }
            return uuid;
        }

        onPresence = (data) => {
            var user;
            if (data.uuid == null) {
                return;
            }
            if (data.uuid[0] !== "{") {
                return;
            }
            data.uuid = this.fixUUID(data.uuid);
            user = jQuery.parseJSON(data.uuid);
            switch (data.action) {
                case "join":
                    this.addUser(user);
                    break;
                case "leave":
                    this.removeUser(user);
            }
        }

        removeUser(user) {
            this.userList = _.filter(this.userList, (val: any) => val.username != user.username);
            //TODO : figure out uses of this 
            //this.trigger("presence", this.userList);
        }

        addUser(user) {
            if (user.hidden) {
                return;
            }
            this.userList.push(user);
            this.userList = _.uniq(this.userList, false, (user: any) => {
                return user.username;
            });
            //TODO : figure out uses of this 
            //this.trigger("presence", this.userList);
        }

    }
}