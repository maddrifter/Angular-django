/// <reference path='../../_all.ts' />
declare var PUBNUB;
angular.module('pubnub.angular.service', [])
    .factory('PubNub', ['$rootScope', ($rootScope) => {
        // initialize an instance object
        var c, i, k, len, ref;;

        c = {
            '_instance': null,
            '_channels': [],
            '_presence': {},
            'jsapi': {}
        };
        
        // helper methods
        ref = ['map', 'each'];
        for (i = 0, len = ref.length; i < len; i++) {
            k = ref[i];
            if ((typeof PUBNUB !== "undefined" && PUBNUB !== null ? PUBNUB[k] : void 0) instanceof Function) {
                (function(kk) {
                    return c[kk] = function() {
                        var ref1;
                        return (ref1 = c['_instance']) != null ? ref1[kk].apply(c['_instance'], arguments) : void 0;
                    };
                })(k);
            }
        }
        
        // core (original) PubNub API methods
        for (k in PUBNUB) {
            if ((typeof PUBNUB !== "undefined" && PUBNUB !== null ? PUBNUB[k] : void 0) instanceof Function) {
                (function(kk) {
                    return c['jsapi'][kk] = function() {
                        var ref;
                        return (ref = c['_instance']) != null ? ref[kk].apply(c['_instance'], arguments) : void 0;
                    };
                })(k);
            }
        }

        c.initialized = () => {
            return !!c['_instance'];
        };

        c.init = function() {
            c['_instance'] = PUBNUB.init.apply(PUBNUB, arguments);
            c['_channels'] = [];
            c['_presence'] = {};
            c['_presData'] = {};
            return c['_instance'];
        };

        c.destroy = () => {
            c['_instance'] = null;
            c['_channels'] = null;
            c['_presence'] = null;
            return c['_presData'] = null;
            // TODO - destroy PUBNUB instance & reset memory
        };

        c._ngFireMessages = (realChannel) => {
            return (messages, t1, t2) => {
                return c.each(messages[0], function(message) {
                    return $rootScope.$broadcast("pn-message:" + realChannel, {
                        message: message,
                        channel: realChannel
                    });
                });
            }
        }

        c._ngInstallHandlers = (args) => {
            var oldmessage = args.message;
            args.message = function() {
                $rootScope.$broadcast(c.ngMsgEv(args.channel), {
                    message: arguments[0],
                    env: arguments[1],
                    channel: args.channel
                });
                if (oldmessage) {
                    return oldmessage(arguments);
                }
            }

            var oldpresence = args.presence;
            args.presence = function() {
                var base, base1, channel, cpos, event;
                event = arguments[0];
                channel = args.channel;
                if (event.uuids) {
                    c.each(event.uuids, function(uuid) {
                        var base, base1, state;
                        state = uuid.state ? uuid.state : null;
                        uuid = uuid.uuid ? uuid.uuid : uuid;
                        (base = c['_presence'])[channel] || (base[channel] = []);
                        if (c['_presence'][channel].indexOf(uuid) < 0) {
                            c['_presence'][channel].push(uuid);
                        }
                        (base1 = c['_presData'])[channel] || (base1[channel] = {});
                        if (state) {
                            return c['_presData'][channel][uuid] = state;
                        }
                    });
                } else {
                    if (event.uuid && event.action) {
                        (base = c['_presence'])[channel] || (base[channel] = []);
                        (base1 = c['_presData'])[channel] || (base1[channel] = {});
                        if (event.action === 'leave') {
                            cpos = c['_presence'][channel].indexOf(event.uuid);
                            if (cpos !== -1) {
                                c['_presence'][channel].splice(cpos, 1);
                            }
                            delete c['_presData'][channel][event.uuid];
                        } else {
                            if (c['_presence'][channel].indexOf(event.uuid) < 0) {
                                c['_presence'][channel].push(event.uuid);
                            }
                            if (event.data) {
                                c['_presData'][channel][event.uuid] = event.data;
                            }
                        }
                    }
                }
                $rootScope.$broadcast(c.ngPrsEv(args.channel), {
                    event: event,
                    message: arguments[1],
                    channel: channel
                });
                if (oldpresence) {
                    return oldpresence(arguments);
                }
            };
            return args;
        }

        c.ngListChannels = () => {
            return c['_channels'].slice(0);
        }

        c.ngListPresence = (channel) => {
            var ref;
            return (ref = c['_presence'][channel]) != null ? ref.slice(0) : void 0;
        }

        c.ngPresenceData = (channel) => {
            return c['_presData'][channel] || {};
        };

        c.ngSubscribe = (args) => {
            var base, name;
            if (c['_channels'].indexOf(args.channel) < 0) {
                c['_channels'].push(args.channel);
            }
            (base = c['_presence'])[name = args.channel] || (base[name] = []);
            args = c._ngInstallHandlers(args);
            return c.jsapi.subscribe(args);
        }

        c.ngUnsubscribe = (args) => {
            var cpos;
            cpos = c['_channels'].indexOf(args.channel);
            if (cpos !== -1) {
                c['_channels'].splice(cpos, 1);
            }
            c['_presence'][args.channel] = null;
            delete $rootScope.$$listeners[c.ngMsgEv(args.channel)];
            delete $rootScope.$$listeners[c.ngPrsEv(args.channel)];
            return c.jsapi.unsubscribe(args);
        }

        c.ngPublish = function() {
            return c['_instance']['publish'].apply(c['_instance'], arguments);
        };

        c.ngHistory = (args) => {
            args.callback = c._ngFireMessages(args.channel);
            return c.jsapi.history(args);
        }

        c.ngHereNow = (args) => {
            args = c._ngInstallHandlers(args);
            args.state = true;
            args.callback = args.presence;
            delete args.presence;
            delete args.message;
            return c.jsapi.here_now(args);
        }

        c.ngWhereNow = (args) => {
            return c.jsapi.where_now(args);
        };

        c.ngState = (args) => {
            return c.jsapi.state(args);
        };

        c.ngMsgEv = (channel) => {
            return "pn-message:" + channel;
        };

        c.ngPrsEv = (channel) => {
            return "pn-presence:" + channel;
        };

        c.ngAuth = function() {
            return c['_instance']['auth'].apply(c['_instance'], arguments);
        };

        c.ngAudit = function() {
            return c['_instance']['audit'].apply(c['_instance'], arguments);
        };

        c.ngGrant = function() {
            return c['_instance']['grant'].apply(c['_instance'], arguments);
        };
        
        return c;
    }]);