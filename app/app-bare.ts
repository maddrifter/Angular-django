/// <reference path='_all.ts' />

// A very bare app that just sets up some of the common directives
// that every page needs.

module scrumdo {
    export var setupBareApp = (staticUrl, organizationSlug = '', projectSlug = '') => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;
        trace("Setting up bare app");
        app = angular.module("BareApp", [
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'scrumdoGenericDirectives',
            'scrumdoSidebar',
            'scrumdoControls',
            "scrumdoIterations",
            'ngResource',
            'ngStorage',
            'ngCookies',
            'scrumdoExceptions',
            'scrumdoAlert',
            'scrumdoOrgManager'
        ]);

        app.controller("ConfirmationWindowController", [
            "$scope",
            "title",
            "prompt",
            "cancelText",
            "okText",
            "okClass",
            "hotkeys",
            scrumdo.ConfirmationWindowController]
        );

        app.config(($sceDelegateProvider) => {
            $sceDelegateProvider.resourceUrlWhitelist(['self', STATIC_URL + "**"]);
        });
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]);

        app.constant("organizationSlug", organizationSlug);
        app.constant("projectSlug", projectSlug);
        app.constant("sidebarMultiselect", false);
        app.constant("topNavbarMode", "");
        app.constant("sidebarMode", "");
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));

        return app;
    }
}