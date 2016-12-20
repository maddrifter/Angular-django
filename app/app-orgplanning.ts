/// <reference path='_all.ts' />

module scrumdo {
    export var setupOrgPlanningApp = (staticUrl, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("OrgPlanningApp", [
            'ngResource',
            'ngStorage',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'ui.tree',
            'ui.router',
            'pubnub.angular.service',
            'frangTree',
            'scrumdoFilters',
            'scrumdoFilterWidget',
            'scrumdoGenericDirectives',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoStories',
            'scrumdoIterations',
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoPreloader',
            'scrumdoOrgPlanning',
            'scrumdoMockPoker',
            'scrumdoBoard'
        ]);

        app.constant("sidebarMultiselect", false);
        app.constant("sidebarMode", "");
        app.constant("topNavbarMode", "");
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', scrumdo.orgPlanningRoutes]);
        app.service("realtimeService", scrumdo.OrgRealtimeService);

        sdCommonDirectives(app, STATIC_URL);

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

        app.run((userService, realtimeService) => {
            trace("Loading user service")
        });

        return app;
    };

}