/// <reference path='../_all.ts' />
module scrumdo {
    export function milestoneRoutes($stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {

        $urlRouterProvider.otherwise("/list");

        $stateProvider.state('list', {
            url: "/list",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/milestonelisting.html')
                }
            }
        });

        $stateProvider.state('milestone', {
            url: "/milestone/:milestoneId",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/milestone.html'),
                    controller: 'MilestoneController',
                    controllerAs: 'mctrl'
                }
            }
        });
    }

    export function orgPlanningRoutes($stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {
            
        //$urlRouterProvider.otherwise("/releases")
        $stateProvider.state('setup', {
            url: "/setup",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/setup.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html')
                }
            }
        });

        $stateProvider.state('upgrade', {
            url: "/upgrade",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/upgrade.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html')
                }
            }
        });

        $stateProvider.state('releases', {
            url: "/releases",
            views: {
                bodyContent: {
                    controller: 'ReleasesController',
                    controllerAs: 'releasesCtrl',
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/releases.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html')
                }
            },
            onEnter: ($rootScope) => {
                $rootScope.navType = 'planning';
            }
        });

        $stateProvider.state('releases.release', {
            url: "/release/{id:[0-9]+}/",
            views: {
                releasesArea: {
                    controller: 'ReleaseController',
                    controllerAs: 'releaseCtrl',
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/release.html')
                }
            }
        });

        $stateProvider.state('portfolio', {
            url: "/portfolio",
            views: {
                bodyContent: {
                    controller: 'PortfolioController',
                    controllerAs: 'portfolioCtrl',
                    templateUrl: urlRewriter.rewriteAppUrl('orgplanning/portfolio/portfolio.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html')
                }
            },
            onEnter: ($rootScope) => {
                $rootScope.navType = 'planning';
            }
        });
    }
}