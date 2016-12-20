/// <reference path='_all.ts' />

module scrumdo {
    export var setupPricingApp = (staticUrl) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;
        trace("Setting up pricing app");

        app = angular.module("PricingApp", [
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'scrumdoGenericDirectives',
            'scrumdoSidebar',
            'scrumdoControls',
            "scrumdoIterations",
            'ngStorage',
            'scrumdoExceptions',
            'scrumdoSubscription',
            'scrumdoAlert',
            'scrumdoFilters'
        ]);

        app.config(($sceDelegateProvider) => {
            $sceDelegateProvider.resourceUrlWhitelist(['self', STATIC_URL + "**"]);
        });

        app.constant("organizationSlug", '');
        app.constant("projectSlug", '');
        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("sidebarMode", "");
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));

        return app;
    }
}