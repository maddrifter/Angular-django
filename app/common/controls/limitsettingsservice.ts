/// <reference path='../../_all.ts' />

module scrumdo {

    export interface LimitSettings {
        featureLimit:number;
        featurePointLimit:number;
        cardLimit?:number;
        cardPointLimit?:number;
    }


    export class LimitSettingsService {
        public static $inject:Array<string> = [
            "$uibModal",
            "urlRewriter"
        ];

        constructor(private $modal:ng.ui.bootstrap.IModalService, private urlRewriter:URLRewriter) {

        }


        public showSettings(initialSettings:LimitSettings, isParent:boolean = true):ng.IPromise<LimitSettings> {

            const dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("common/controls/limitsettingswindow.html"),
                controller: 'LimitSettingsWindowController',
                controllerAs: 'ctrl',
                size: "sm",
                backdrop: "static",
                keyboard: true,
                resolve: {
                    initialSettings: () => initialSettings,
                    isParent: () => isParent
                }
            });

            return dialog.result;
        }


    }
}