/// <reference path='_all.ts' />

module scrumdo {
    export var setupNotesApp = (staticUrl, projectSlug, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("NotesApp", [
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
            'scrumdoSidebar',
            'scrumdoFocus',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoIterations',
            'scrumdoExceptions',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoPreloader',
            'scrumdoNotes',
        ]);

        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("projectSlug", projectSlug);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "notes");

        app.service("realtimeService", RealtimeService);

        app.config(['$stateProvider', '$urlRouterProvider', 'urlRewriter', scrumdo.noteRoutes]);

        app.config(['$uibTooltipProvider', ($tooltipProvider) => {
            $tooltipProvider.options({ appendToBody: true });
        }
        ]);
        
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