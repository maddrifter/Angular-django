/// <reference path='../_all.ts' />

var excmodule: ng.IModule = angular.module("scrumdoExceptions", ['ngToast']);
declare var mixpanel;
if (window.location.hostname.indexOf('local') === -1) {
    var MIXPANEL_ERRORS: number = 0;

    excmodule.factory('$exceptionHandler', (ngToast) => {
        var showError = _.debounce((message) => {
            ngToast.create({
                content: "<b>An error has occurred.</b><br/>" + message,
                "class": 'danger'
            });

            if (typeof mixpanel !== "undefined" && mixpanel !== null) {
                MIXPANEL_ERRORS += 1;
                if (MIXPANEL_ERRORS < 5) {
                    return mixpanel.track("Had Error");
                }
            }

        }, 1);

        return (exception, cause) => {
            var win: any = window;
            if (win.Rollbar != null) {
                win.Rollbar.error(exception, { cause: cause });
            }
            //showError(exception.message);
            if ("error" in console) {
                return console.error(exception.message);
            }
        }
    });

    excmodule.factory('scrumdoHttpInterceptor', ($q, ngToast) => {
        return {
            responseError: (rejection) => {
                if (rejection.status === 401) {
                    return rejection; //# we handle 401 errors in app.coffee
                }
                var ref;
                var data = {
                    url: rejection.config.url,
                    status: rejection.status,
                    statusText: rejection.statusText,
                    method: rejection.config.method,
                    data: (ref = rejection.data) != null ? ref.substr(0, 2000) : void 0
                };
                var win: any = window;
                if (win.Rollbar != null) {
                    win.Rollbar.error("Server call failed: " + rejection.config.url, data);
                }
                ngToast.create({
                    content: "<b>An error has occurred.</b><br/>" + rejection.config.method + " " + rejection.config.url + " has failed with error " + rejection.status + " " + rejection.statusText,
                    "class": 'danger'
                });

                if (typeof mixpanel !== "undefined" && mixpanel !== null) {
                    MIXPANEL_ERRORS += 1;
                    if (MIXPANEL_ERRORS < 5) {
                        mixpanel.track("Had Network Error");
                    }
                }

                if ("error" in console) {
                    console.error(rejection.config.method + " " + rejection.config.url + " has failed with error " + rejection.status + " " + rejection.statusText);
                }

                return $q.reject(rejection);
            }
        }
    });

    excmodule.config(["$httpProvider", ($httpProvider) => {
        $httpProvider.interceptors.push('scrumdoHttpInterceptor');
    }]);
}
else {
    trace("Localmode, not connecting rollbar.");
}
