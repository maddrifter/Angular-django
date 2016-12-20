/// <reference path='../_all.ts' />
module scrumdo {
    export function dashboardRoutes($stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {

        $urlRouterProvider.otherwise("/overview");

        $stateProvider.state('overview', {
            url: "/overview",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_overview.html'),
                    controller: "DashboardInboxRedirectController"
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'overview';
            }
        });

        $stateProvider.state('oldprojects', {
            url: "/oldprojects",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_projects.html'),
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'oldprojects';
            }
        });

        $stateProvider.state('projects', {
            url: "/projects",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_portfolio_projects.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'projects';
            }
        });

        $stateProvider.state('teams', {
            url: "/teams",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/teams/dashboard_teams.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'teams';
            }
        });

        $stateProvider.state('newteam', {
            url: "/teams/new",
            views: {
                bodyContent: {
                    controller: scrumdo.NewTeamController,
                    controllerAs: 'ctrl',
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/teams/newteam.html')
                },
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'teams';
            }
        });

        $stateProvider.state('allmembers', {
            url: "/allmembers",
            views: {
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                },
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/teams/allmembers.html'),
                    controller: scrumdo.AllMembersController,
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'teams';
            }
        });

        $stateProvider.state('team', {
            url: "/teams/{teamid:[0-9]+}/",
            views: {
                navContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/dashboard_nav.html'),
                    controller: "DashboardNavController",
                    controllerAs: 'ctrl'
                },
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('dashboard/teams/dashboard_team.html'),
                    controller: scrumdo.DashboardTeamController,
                    controllerAs: 'ctrl'
                }
            },
            onEnter: function($rootScope) {
                return $rootScope.navType = 'teams';
            }
        });
    }
}