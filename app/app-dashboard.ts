/// <reference path='_all.ts' />

module scrumdo {
    export var setupDashboardApp = (staticUrl, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("DashboardApp", [
            'ngResource',
            'ngStorage',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'infinite-scroll',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'ui.router',
            'xeditable',
            'ngToast',
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
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoStories',
            'scrumdoTasks',
            'scrumdoExport',
            'scrumdoTeams',
            'scrumdoDashboard',
            'scrumdoIterations',
            'scrumdoMockPoker',
            'scrumdoExceptions',
            'scrumdoPoker',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoPoker',
            'scrumdoProject',
            'scrumdoNews',
            'scrumdoBoardManagers',
            'scrumdoPreloader',
            'scrumdoBoardPreview'
        ]);

        angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 500);

        app.constant("topNavbarMode", "dashboard");
        app.constant("sidebarMultiselect", false);
        app.constant("organizationSlug", organizationSlug);
        app.constant("projectSlug", null);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");

        sdCommonDirectives(app, staticUrl);

        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', scrumdo.dashboardRoutes]);

        app.config(['$uibTooltipProvider', ($tooltipProvider) => {
            $tooltipProvider.options({ appendToBody: true });
        }
        ]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        app.config(['$uibTooltipProvider', ($tooltipProvider) => {
            $tooltipProvider.options({ appendToBody: true });
            }
        ]);

        app.run((userService, $rootScope, editableOptions) => {
            trace("Loading user service");
            $rootScope.STATIC_URL = STATIC_URL;
            editableOptions.theme = 'bs3'  // bootstrap3 theme.Can be also 'bs2', 'default'
        });

        return app;
    }

}