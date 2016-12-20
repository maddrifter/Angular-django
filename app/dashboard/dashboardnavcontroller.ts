/// <reference path='../_all.ts' />

module scrumdo {
    export class DashboardNavController {
        public static $inject:Array<string> = ["betaOptions"];

        constructor(public betaOptions:BetaOptions) {

        }


    }
}