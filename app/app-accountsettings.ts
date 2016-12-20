/// <reference path='_all.ts' />

module scrumdo {
    export var setupAccountSettings = (staticUrl) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("AccountSettingsApp", [
            'ngRoute',
            'ngResource',
            'ngStorage',
            'ngCookies',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'ui.router',
            'ngToast',
            'pubnub.angular.service',
            'angularSpectrumColorpicker',
            'scrumdoGenericDirectives',
            'scrumdoFilters',
            'scrumdoFilterWidget',
            'scrumdoSidebar',
            'scrumdoControls',
            'scrumdoEpics',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoStories',
            'scrumdoAccountSettings',
            'scrumdoTasks',
            'scrumdoAlert'
        ]);

        app.constant("topNavbarMode", "");
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");
        
        //app.service("realtimeService", ["$rootScope", scrumdo.NullRealtimeService]);
        /*
        app.directive("sdAccountSettingsMenu", function() {
            return {
                templateUrl: STATIC_URL + "app/accountsettings/accountsettingsmenu.html",
                controller: "AccountSettingsMenuController"
            }
        });
        */
        app.config(["$stateProvider", "$urlRouterProvider", "urlRewriter", userAccountRoutes]);
        
        app.config(['$httpProvider', function($httpProvider) {
            $httpProvider.defaults.xsrfCookieName = 'csrftoken';
            $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        }
        ]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        sdCommonDirectives(app, staticUrl);
        /*
        app.run(function(userService) {
            trace("Loading user service")
        });
        */
        
        return app;
    };
}