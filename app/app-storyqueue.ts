/// <reference path='_all.ts' />

module scrumdo {
    export var setupStoryQueueApp = (staticUrl, projectSlug, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("StoryQueueApp", [
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
            'scrumdoNews'
        ]);

        angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 500);
        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("organizationSlug", organizationSlug);
        app.constant("projectSlug", projectSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "storyqueue");
        
        app.service("realtimeService", RealtimeService);
        sdCommonDirectives(app, STATIC_URL)
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);
        
        app.run((userService, realtimeService) => {
            trace("Loading user and realtime services   ")
        });
        
        return app;
    }
}