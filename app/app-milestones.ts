/// <reference path='_all.ts' />

module scrumdo {
    export var setupMilestonesApp = (staticUrl, projectSlug, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;
 
        app = angular.module("MilestonesApp", [
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
            'scrumdoStoryQueue',
            'scrumdoMockPoker',
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoNews',
            'scrumdoOrgPlanning'

        ]);

        angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 500);

        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("organizationSlug", organizationSlug);
        app.constant("projectSlug", projectSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "milestones");

        app.service("realtimeService", RealtimeService);

        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', milestoneRoutes]);
        
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