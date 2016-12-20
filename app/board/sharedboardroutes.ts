/// <reference path='../_all.ts' />
module scrumdo {

    export function sharedBoardRoutes(
        $stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {
        $urlRouterProvider.otherwise("/view");
        
        $stateProvider.state('view', {
            url: "/view",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/board.html')
                }
            }
        });
    }
}