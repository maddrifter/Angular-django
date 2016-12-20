/// <reference path='../_all.ts' />
module scrumdo {
    export function inboxRoutes($stateProvider:ng.ui.IStateProvider,
                                $urlRouterProvider:ng.ui.IUrlRouterProvider,
                                urlRewriter:URLRewriter) {

        $urlRouterProvider.otherwise("/inbox")

        $stateProvider.state('inbox', {
            url: "/inbox",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('inbox/projects.html'),
                    controller: ""
                }
            }
        });


        $stateProvider.state('inbox.group', {
            url: "/group/:projectSlug/:groupId",
            views: {
                modal: {
                    templateUrl: urlRewriter.rewriteAppUrl('inbox/group.html'),
                    controller: "GroupController",
                    controllerAs: "gctrl"
                }
            }
        });

    }
}
