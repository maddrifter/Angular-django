/// <reference path='../_all.ts' />

module scrumdo {
    export class DashboardPortfolioController {
        public static $inject:Array<string> = [];

        public expanded:boolean = true;

        constructor() {

        }

        toggle() {
            this.expanded = !this.expanded;
        }

    }
}