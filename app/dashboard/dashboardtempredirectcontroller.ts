/// <reference path='../_all.ts' />

/* This is a temporary controller to support beta mode of switching to the inbox. */

module scrumdo {
    export class DashboardInboxRedirectController {
        public static $inject:Array<string> = ["betaOptions", "$window", "organizationSlug"];

        constructor(betaOptions:BetaOptions, $window:ng.IWindowService, organizationSlug:string) {
            if(betaOptions.getDashboard() == 'inbox') {
                var url = `/inbox/${organizationSlug}/#/inbox`;
                $window.open(url, "_self");
            }

        }

    }

    export class DashboardPortfolioRedirectController {
        public static $inject:Array<string> = ["betaOptions", "$location"];

        constructor(betaOptions:BetaOptions, $location:ng.ILocationService) {
            if(betaOptions.getPortfolio()) {
                $location.path('portfolioprojects');
            }

        }

    }
}