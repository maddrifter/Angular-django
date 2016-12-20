/// <reference path='_all.ts' />

module scrumdo {
    export var setupSharedBoard = (staticUrl, projectSlug, shareKey, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("ScrumDoSharedBoardApp", [
            'ngResource',
            'ngStorage',
            'ngAnimate',
            'ngCookies',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'ui.router',
            'frangTree',
            'pubnub.angular.service',
            'angularSpectrumColorpicker',
            'scrumdoGenericDirectives',
            'scrumdoFilters',
            'scrumdoFilterWidget',
            'scrumdoSidebar',
            'scrumdoControls',
            'scrumdoEpics',
            'scrumdoUser',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoBoardPreview',
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoStories',
            'scrumdoTasks',
            'scrumdoIterations',
            'scrumdoBoardWizard',
            'scrumdoPoker',
            'scrumdoBoard',
            'scrumdoExceptions',
            'scrumdoPoker',
            'scrumdoAlert',
            'scrumdoNews',
            'scrumdoPreloader',
            'scrumdoProjectExtras',
            'scrumdSharedBoardServices']);

        app.constant("sidebarMultiselect", true);
        app.constant("topNavbarMode", "");
        app.constant("projectSlug", projectSlug);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "board");
        app.constant("shareKey", shareKey);

        app.service("realtimeService", scrumdo.NullRealtimeService);

        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', sharedBoardRoutes]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        sdCommonDirectives(app, STATIC_URL);

        app.run((userService, realtimeService, $rootScope, $state) => {
            trace("Loading user, realtime service");
            $rootScope.state = $state;
        });
        return app;
    }
}