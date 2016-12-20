/// <reference path='_all.ts' />

module scrumdo {
    export var setupBetaOptionsApp = (staticUrl) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;


        app = angular.module("BetaOptionsApp", ["ngStorage",
            "ngResource",
            "ui.bootstrap",
            "scrumdoUser",
            "scrumdoAlert",
            "scrumdoBeta"]);

        angular.module("infinite-scroll").value("THROTTLE_MILLISECONDS", 500);

        app.constant("topNavbarMode", "dashboard");
        app.constant("sidebarMultiselect", false);
        app.constant("organizationSlug", '');
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("STATIC_URL", STATIC_URL);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");
        app.service("realtimeService", scrumdo.NullRealtimeService);

        sdCommonDirectives(app, staticUrl);

        //app.run((userService, $rootScope) => {
        //    $rootScope.STATIC_URL = STATIC_URL;
        //});

        return app;
    };
}