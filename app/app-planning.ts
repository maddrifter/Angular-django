/// <reference path='_all.ts' />

module scrumdo {
    export var setupPlanningApp = (staticUrl, projectSlug, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("PlanningApp", [
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
            'scrumdoSidebar',
            'scrumdoEpics',
            'scrumdoBoardPreview',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoTasks',
            'scrumdoStories',
            'scrumdoPlanning',
            'scrumdoIterations',
            'scrumdoPoker',
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoNews',
            'scrumdoPreloader'
        ]);

        app.constant("sidebarMultiselect", false);
        app.constant("sidebarMode", "plan");
        app.constant("topNavbarMode", "");
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("projectSlug", projectSlug);
        
        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', planningRoutes]);

        app.config(['$uibTooltipProvider', ($tooltipProvider) => {
            $tooltipProvider.options({ appendToBody: true });
        }
        ]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]); 

        app.service("realtimeService", RealtimeService);
        sdCommonDirectives(app, STATIC_URL)

        app.run((userService, realtimeService) => {
            trace("Loading user, realtime service")
        });
        
        return app;
    }
}