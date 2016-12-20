/// <reference path='../_all.ts' />
module scrumdo{
    export function planningRoutes(
        $stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {
        
        $urlRouterProvider.otherwise("/planningcolumn"); 
        
        $stateProvider.state('planningcolumn', {
            url: "/planningcolumn",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('planning/planningtool.html'),
                    controller: 'PlanningToolController',
                    controllerAs: 'planningToolCtrl'
                }
            }
        });
        
        $stateProvider.state('storymapping', {
            url: "/storymapping",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('planning/planningtool.html'),
                    controller: 'PlanningToolController',
                    controllerAs: 'planningToolCtrl'
                }
            }
        });
    }
}