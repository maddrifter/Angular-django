/// <reference path='_all.ts' />

module scrumdo {
    export var setupOrgExtrasApp = (staticUrl, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("OrgExtrasApp", [
            'ui.router',
            'ngResource',
            'ngStorage',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'infinite-scroll',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'pubnub.angular.service',
            'scrumdoGenericDirectives',
            'scrumdoFilters',
            'scrumdoSidebar',
            'scrumdoControls',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoBoard',
            'scrumdoReports',
            'scrumdoMockPoker',
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoOrgExtras',
            'scrumdoPreloader'
        ]);

        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("organizationSlug", organizationSlug);
        app.constant("projectSlug", null);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "reports");

        app.service("realtimeService", RealtimeService);

        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', orgExtrasRoutes]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        sdCommonDirectives(app, STATIC_URL);

        app.run((userService, realtimeService) => {
            trace("Loading user and realtime services");
        });

        return app;
    }
}