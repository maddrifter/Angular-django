/// <reference path='../../_all.ts' />

module scrumdo {
    export class CardPicker {
        public static $inject: Array<string> = [
            "organizationSlug",
            "urlRewriter",
            "$uibModal",
            "$rootScope"
        ];

        public dialog: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            public organizationSlug: string,
            public urlRewriter: URLRewriter,
            public modal: ng.ui.bootstrap.IModalService,
            public rootScope) {

        }

        openCardPicker(currentProject, organizationSlug, currentIteration = null, currentStoryId = null) {

            if (this.dialog != null) {
                this.dialog.dismiss();
            }

            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("/common/controls/cardpicker.html"),
                controller: 'CardPickerController',
                controllerAs: 'ctrl',
                keyboard: true,
                resolve: {
                    organizationSlug: () => organizationSlug,
                    currentProject: () => currentProject,
                    currentIteration: () => currentIteration,
                    currentStoryId: () => currentStoryId
                }
            });

            return this.dialog.result.then(this.selectCards);
        }

        selectCards = (result: { selected: any }) => {
            this.rootScope.$broadcast('storiesSelected', result.selected);
            return result;
        }

    }
}