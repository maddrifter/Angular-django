/// <reference path='../_all.ts' />

module scrumdo {
    export function userAccountRoutes($stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {

        $urlRouterProvider.otherwise("settings");

        $stateProvider.state('settings', {
            url: "",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('accountsettings/details.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl("accountsettings/nav_settings.html")
                }
            }
        });
        // there was blank page without /settings route if refresh at the account settings tab
        $stateProvider.state('dup_settings', {
            url: "/settings",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('accountsettings/details.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl("accountsettings/nav_settings.html")
                }
            }
        });
        
        $stateProvider.state('openID', {
            url: "/openID",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('accountsettings/openID.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl("accountsettings/nav_openID.html")
                }
            }
        });
        
        $stateProvider.state('api', {
            url: "/api",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('accountsettings/api.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl("accountsettings/nav_api.html")
                }
            }
        });
        
        $stateProvider.state('devapi', {
            url: "/api/dev",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('accountsettings/api_dev.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl("accountsettings/nav_api.html")
                }
            }
        });
        
        $stateProvider.state('github', {
            url: "/github",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('accountsettings/github.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl("accountsettings/nav_github.html")
                }
            }
        });
    }
}