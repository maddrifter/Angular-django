/// <reference path='_all.ts' />

module scrumdo {
    export var setupTrackTimeApp = (staticUrl, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("TrackTimeApp", [
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
            'scrumdoEpics',
            'scrumdoUser',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoStories',
            'scrumdoTasks',
            'scrumdoExport',
            'scrumdoTeams',
            'scrumdoAlert',
            'scrumdoIterations',
            'scrumdoMockPoker',
            'scrumdoChat',
            "scrumdoTime",
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoNews'

        ]);

        app.constant("topNavbarMode", "time");
        app.constant("sidebarMultiselect", false);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");
        app.constant("projectSlug", null);

        app.service("realtimeService", scrumdo.NullRealtimeService);

        sdCommonDirectives(app, staticUrl);


        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        app.run((userService, $rootScope) => {
            trace("Loading user service");
            $rootScope.STATIC_URL = STATIC_URL;
        });

        return app;
    }
}