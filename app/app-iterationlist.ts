/// <reference path='_all.ts' />

module scrumdo {
    export var setupIterationListApp = (staticUrl, projectSlug, organizationSlug, iterationId) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("IterationListApp", [
            'ngResource',
            'ngStorage',
            'ngToast',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'pubnub.angular.service',
            'scrumdoGenericDirectives',
            'scrumdoBoardPreview',
            'scrumdoFilterWidget',
            'scrumdoSidebar',
            'scrumdoControls',
            'scrumdoEpics',
            'scrumdoUser',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoExport',
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoStories',
            'scrumdoTasks',
            'scrumdoIterations',
            'scrumdoFilters',
            'scrumdoPoker',
            'scrumdoReports',
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoNews',
            'scrumdoPreloader'
        ]);

        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("iterationId", iterationId);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("projectSlug", projectSlug);
        app.constant("sidebarMode", "");
        app.config([
            '$uibTooltipProvider', ($tooltipProvider) => {
                $tooltipProvider.options({
                    appendToBody: true
                });
            }
        ]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        app.service("realtimeService", RealtimeService);

        sdCommonDirectives(app, STATIC_URL);
        app.run((userService, realtimeService) => {
            return trace("Loading user, realtime service");
        });

    }

}