/// <reference path='../_all.ts' />

declare var mixpanel;

module scrumdo {
    export class MixpanelService {
        constructor(organizationSlug = '') {
            if ((typeof mixpanel !== "undefined" && mixpanel !== null) && organizationSlug !== '') {
                mixpanel.identify(organizationSlug);
            }
        }

        get_distinct_id() {
            if (typeof mixpanel !== "undefined" && mixpanel !== null) {
                return mixpanel.get_distinct_id();
            }
            return 0;
        }

        track(eventName, properties = null) {
            if (typeof mixpanel !== "undefined" && mixpanel !== null) {
                if (properties != null) {
                    return mixpanel.track(eventName, properties);
                } else {
                    return mixpanel.track(eventName);
                }
            }
        }
    }
}

var mixmodule: ng.IModule = angular.module("scrumdo-mixpanel", []);
mixmodule.service('mixpanel', ['organizationSlug', scrumdo.MixpanelService]);