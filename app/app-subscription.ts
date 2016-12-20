/// <reference path='_all.ts' />

module scrumdo {
    export var setupSubscriptionApp = (staticUrl, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("SubscriptionApp", [
            'ngResource',
            'ngStorage',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'infinite-scroll',
            'ui.bootstrap',
            'luegg.directives',
            'ui.bootstrap-slider',
            'pubnub.angular.service',
            'ui.router',
            'ngToast',
            'scrumdoGenericDirectives',
            'scrumdoControls',
            'scrumdoFilters',
            'scrumdoUser',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoExceptions',
            'scrumdoSubscription',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoNews'

        ]);

        app.constant("topNavbarMode", "");
        app.constant("sidebarMultiselect", false);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");
        app.constant("projectSlug", null);

        app.service("realtimeService", scrumdo.NullRealtimeService);

        sdCommonDirectives(app, staticUrl);


        app.run((userService, $rootScope) => {
            trace("Loading user service");
            $rootScope.STATIC_URL = STATIC_URL;
        });
        
        return app;
    }
}