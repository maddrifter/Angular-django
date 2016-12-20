/// <reference path='_all.ts' />

module scrumdo {
    export var setupInboxApp = (staticUrl, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;


        app = angular.module("InboxApp", ["ngResource",
                                              "ngStorage",
                                              "ngTagsInput",
                                              "ui.select",
                                              "angular-loading-bar",
                                              "infinite-scroll",
                                              "ui.bootstrap",
                                              "ui.bootstrap-slider",
                                              "ui.router",
                                              "ngToast",
                                              "scrumdoGenericDirectives",
                                              "scrumdoFilters",
                                              "scrumdoFilterWidget",
                                              "scrumdoDashboard",
                                              "scrumdoSidebar",
                                              "scrumdoControls",
                                              "scrumdoUser",
                                              "scrumdoControls",
                                              "scrumdoUser",
                                              "scrumdoAttachments",
                                              "scrumdoComments",
                                              "scrumdoStories",
                                              "scrumdoTasks",
                                              "scrumdoIterations",
                                              "scrumdoMockPoker",
                                              "scrumdoExceptions",
                                              "scrumdoProject",
                                              "scrumdoAlert",
                                              "scrumdoProject",
                                              "scrumdoBoardManagers",
                                              "scrumdoPreloader",
                                              "scrumdoInbox",
                                              "scrumdoReports",
                                              "scrumdoBoardPreview",
                                              "scrumdoNotes"]);

        angular.module("infinite-scroll").value("THROTTLE_MILLISECONDS", 500);

        app.constant("topNavbarMode", "dashboard");
        app.constant("sidebarMultiselect", false);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("STATIC_URL", STATIC_URL);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");
        app.service("realtimeService", scrumdo.NullRealtimeService);

        sdCommonDirectives(app, staticUrl);

        app.config(["$stateProvider", "$urlRouterProvider", "urlRewriter", inboxRoutes]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        app.run((userService, $rootScope, organizationSlug) => {
            $rootScope.STATIC_URL = STATIC_URL;
            $rootScope.organizationSlug = organizationSlug;
            //, editableOptions
            //editableOptions.theme = "bs3";  // bootstrap3 theme. Can be also 'bs2', 'default'
        });

        return app;
    };
}