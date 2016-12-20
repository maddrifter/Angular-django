/// <reference path='../_all.ts' />
module scrumdo {

    export function orgExtrasRoutes(
        $stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {
        $urlRouterProvider.otherwise("/intro");

        $stateProvider.state('list', {
            url: "/list",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/list.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/nav.html')
                }
            }
        });

        $stateProvider.state('intro', {
            url: "/intro",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/intro.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/nav.html')
                }
            }
        });

        $stateProvider.state('github', {
            url: "/github",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/orggithub.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/nav.html')
                }
            }
        });

        $stateProvider.state('zapier', {
            url: "/zapier",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/orgzapier.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/nav.html')
                }
            }
        });

        $stateProvider.state('basecamp', {
            url: "/basecamp",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/orgbasecamp.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/nav.html')
                }
            }
        });

        $stateProvider.state('chatextras', {
            url: "/chatextras",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/chatextras.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('extras/nav.html')
                }
            }
        });
    }

}