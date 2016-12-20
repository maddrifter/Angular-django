/// <reference path='../_all.ts' />
module scrumdo {
    
    export function noteRoutes(
        $stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {

        $urlRouterProvider.otherwise("/notes");
        $stateProvider.state('notes', {
            url: "/notes",
            views: {
                noteDetail: {
                    templateUrl: urlRewriter.rewriteAppUrl('note/note_pick.html')
                }
            }
        });

        $stateProvider.state('note', {
            url: "/note/:noteId",
            views: {
                noteDetail: {
                    templateUrl: urlRewriter.rewriteAppUrl('note/note.html')
                }
            }
        });
    }
}