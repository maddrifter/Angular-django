/// <reference path='_all.ts' />
declare var tinymce;
declare var scrumdoTemplates;
interface GRID_CONSTANTS {
    grid: number,
    fullsize: number,
    mouse_idle: number,
    mouse_drawing: number,
    mouse_cell_select: number
}
module scrumdo {
    var app;

    export var API_PREFIX = "/api/v3/";

    export var GRID_CONSTANTS: GRID_CONSTANTS = {
        grid: 10,
        fullsize: 25,
        mouse_idle: 0,
        mouse_drawing: 1,
        mouse_cell_select: 2
    };

    app = null;

    export var sdCommonDirectives = (app, STATIC_URL) => {
        var error, sheet;
        tinymce.EditorManager.baseURL = STATIC_URL + "bower_components/tinymce-dist";

        app.config(function($sceDelegateProvider) {
            return $sceDelegateProvider.resourceUrlWhitelist(['self', STATIC_URL + "**"]);
        });

        app.constant("STATIC_URL", STATIC_URL);

        app.controller("MoveToProjectWindowController", scrumdo.MoveToProjectWindowController);
        app.controller("AssignWindowController", scrumdo.AssignWindowController);
        app.controller("StatusWindowController", scrumdo.StatusWindowController);

        app.value("uiSelect2Config", {
            theme: 'bootstrap',
            appendToBody: true
        });

        try {
            if (window.localStorage.getItem("disableanimate")) {
                app.run([
                    '$animate', function($animate) {
                        console.log("Disabling animations");
                        return $animate.enabled(false);
                    }
                ]);

                // This disables the angular-bootstrap modal dialog animations which don't use
                // angular animation service, and the scrumdo sidebar animations.
                sheet = document.createElement('style');
                sheet.innerHTML = ".modal.fade { opacity: 1; } .modal.fade .modal-dialog, .modal.in .modal-dialog { -webkit-transform: translate(0, 0); -ms-transform: translate(0, 0); transform: translate(0, 0); }" + ".scrumdo-boards-wrapper, .navbar-open, .scrumdo-navigation-sidebar, .scrumdo-backlog-sidebar { -webkit-transition: none; -moz-transition: none; -o-transition: none; transition: none; }";
                document.body.appendChild(sheet);
            }
        } catch (error) {
            trace("couldn't check animate state");
        }

        // This service will display a prompt to reload when the 401error event is broadcasted on the root scope.
        app.service('scrumdo401Prompt', ["confirmService", "$rootScope", (confirmService, rootScope) => {
            rootScope.$on("401error", () => {
                confirmService.confirm("Error loading resource",
                    "We received a 401-Unauthenticated response while loading some data.  Usually, " +
                    "this means you're not logged in or your session has expired.  We recommend " +
                    "reloading the page so you can reauthenticate.",
                    "Cancel", "Reload").then(() => {
                        window.location.reload();
                    });
            });
        }]);

        // This http interceptor will broadcast a 401error event on the root scope when we get a 401 response.
        app.factory('scrumdo401Handler', ["$q", "$rootScope", ($q, rootScope) => {
            return {
                responseError: (response) => {
                    if (response.status === 401) {
                        trace("Got 401 error");
                        rootScope.$broadcast("401error");
                    }
                    return $q.reject(response);
                }
            }
        }]);

        app.config(['$httpProvider', ($httpProvider) => {
            $httpProvider.defaults.xsrfCookieName = 'csrftoken';
            $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
            $httpProvider.useApplyAsync(true);
            $httpProvider.interceptors.push('scrumdo401Handler');
        }]);
        /*
        # DO NOT SET debugInfoEnabled(false) globally
        # There is a bug in angular - ui - tree which causes drag and drop to fail in the epic reorder window
        # This means we never want it enabled on the planning tool.
        # It should be possible to enable it on the other application pages, but I haven't looked into that yet.
        # https://github.com/angular-ui-tree/angular-ui-tree/issues/298
        # https://github.com/angular-ui-tree/angular-ui-tree/issues/425
        #    app.config['$compileProvider', ($compileProvider) ->
        #        $compileProvider.debugInfoEnabled(false)
        #    ]
        */

        app.controller("PromptWindowController", [
            "$scope",
            "title",
            "prompt",
            "cancelText",
            "okText",
            "okClass",
            scrumdo.PromptWindowController
        ]);

        app.controller("ConfirmationWindowController", [
            "$scope",
            "title",
            "prompt",
            "cancelText",
            "okText",
            "okClass",
            "hotkeys",
            scrumdo.ConfirmationWindowController
        ]);

        app.directive("sdProjectDropdown", () => {
            return {
                restrict: "E",
                replace: true,
                templateUrl: STATIC_URL + "app/project/projectdropdown.html"
            };
        });


        app.directive("sdAccess", scrumdo.sdAccess);
        app.directive("sdProject", scrumdo.sdProject);

        app.run(($templateCache, scrumdo401Prompt) => {
            return scrumdoTemplates($templateCache, STATIC_URL.substring(0, STATIC_URL.length - 1));
        });
    }

}
