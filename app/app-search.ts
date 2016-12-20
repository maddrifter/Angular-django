/// <reference path='_all.ts' />

module scrumdo {
    export var setupSearchApp = (staticUrl, initialSearchTerms, organizationSlug = '', projectSlug = '') => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("SearchApp", [
            'ui.router',
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'scrumdoGenericDirectives',
            'scrumdoSidebar',
            'scrumdoControls',
            "scrumdoUser",
            "scrumdoIterations",
            'ngStorage',
            'scrumdoExceptions',
            'scrumdoSearch',
            'scrumdoBoardPreview',
            'scrumdoProject',
            'scrumdoTasks',
            'scrumdoFilters',
            'scrumdoFilterWidget',
            'scrumdoBoardManagers',
            'scrumdoEpics',
            'scrumdoNews',
            'scrumdoComments',
            'scrumdoAlert',
            'scrumdoMockPoker',
            'ui.router'
        ]);

        app.constant("initialSearchTerms", initialSearchTerms);
        app.constant("organizationSlug", organizationSlug);
        app.constant("projectSlug", projectSlug);
        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("sidebarMode", "");
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.service("realtimeService", scrumdo.NullRealtimeService); 3

        app.config(['$uibTooltipProvider', ($tooltipProvider) => {
            $tooltipProvider.options({ appendToBody: true });
        }
        ]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        sdCommonDirectives(app, STATIC_URL);

        app.run((userService) => {
            trace("Loading user service")
        });

        return app;

    }

}