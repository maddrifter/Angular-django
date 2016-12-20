/// <reference path='../_all.ts' />

module scrumdo {


    interface SubMessScope extends ng.IScope {
        organization: {
            slug: string;
            subscription: {
                expires: number;
                mode: string;
                grace: number;
                allClear: boolean;
            }
        };
    }

    export class SubscriptionMessage {
        public static $inject:Array<string> = ["$scope", "$cookies"];
        public options = {
            welcome: undefined,
            subscribeNow: undefined,
            expiring: undefined,
            overLimit: undefined,
            billingSoon: undefined,
            allClear: undefined
        };

        private unbindMessageWatcher: Function;
        private hideMessage:number;

        constructor(private scope:SubMessScope, public $cookies:ng.cookies.ICookiesService) {
            this.unbindMessageWatcher = scope.$watch('organization', this.onMessageChange)
            this.hideMessage = parseInt($cookies.get('sdHideMessageSubscription'));
        }

        private onMessageChange = () => {
            if(this.scope.organization) {
                this.options.welcome = false;
                this.options.subscribeNow = false;
                this.options.expiring = false;
                this.options.overLimit = false;
                this.options.billingSoon = false;

                var mode:string = this.scope.organization.subscription.mode;
                var expires:number = this.scope.organization.subscription.expires;

                if(mode == 'trial' && expires > 15) {
                    this.options.welcome = true;
                } else if(mode == 'trial' && expires <= 15) {
                    this.options.subscribeNow = true;
                } else if(mode == 'overlimit') {
                    this.options.overLimit = true;
                } else if(mode == 'invoiced' && expires <= 90) {
                    this.options.billingSoon = true;
                } else if(mode == 'expired') {
                    this.options.expiring = true;
                } else {
                    this.options.allClear = true;
                }
                this.unbindMessageWatcher();
            }
        }

        public onHide(type){
            this.options[type] = false;
            this.$cookies.put('sdHideMessageSubscription', "1", {path: "/"});
        }
    }
}