/// <reference path='_all.ts' />

module scrumdo {

    export var setupReleaseApp = (staticUrl, organizationSlug = '') => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;
        trace("Setting up release app");

        app = angular.module("ReleaseApp", [
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'scrumdoGenericDirectives',
            'scrumdoSidebar',
            'scrumdoControls',
            'frapontillo.gage',
            'scrumdoExceptions',
            'scrumdoAlert'
        ]);

        app.constant("organizationSlug", organizationSlug);
        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("sidebarMode", "");
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        return app;
    }
}