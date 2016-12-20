/// <reference path='../_all.ts' />

module scrumdo {
    export class MilestoneProgressPopupController {
        public static $inject:Array<string> = ['story', 'releaseStatManager', 'organizationSlug'];
        public stats;

        constructor(private story:Story,
                    private releaseStatManager,
                    private organizationSlug:string) {
            releaseStatManager.loadStats(organizationSlug, story.id).then((stats) => {
                this.stats = stats;
            })

        }
    }




    export class MilestoneProgressPopupService {
        public static $inject:Array<string> = ['$uibModal', 'urlRewriter'];

        constructor(private modal:ng.ui.bootstrap.IModalService,
                    private urlRewriter:URLRewriter) {

        }


        public showProgress(story:Story) {
            return this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("story/milestoneprogresspopup.html"),
                controller: 'MilestoneProgressPopupController',
                controllerAs: 'ctrl',
                size: "lg",
                backdrop: "static",
                keyboard: true,
                resolve: {
                    story: function(){return story;}
                }
            });
        }

    }

}