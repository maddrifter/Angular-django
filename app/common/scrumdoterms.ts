/// <reference path='../_all.ts' />

module scrumdo {
    export class ScrumDoTerms {
        /** A way to configure the name of some of our common terms.
         * This will let us do things like call Cards Milestons when in portfolio planning more or call Iterations Releases
         */
        public static $inject:Array<string> = ["$rootScope"];

        public card:string;
        public iteration:string;
        public increment:string;
        public epic:string;

        constructor($rootScope:ng.IRootScopeService) {
            $rootScope.$on('fullyLoaded', this.onFullyLoaded);
        }

        onFullyLoaded = () => {
            if(this.card == null) { this.card = 'Card'; }
            if(this.iteration == null) { this.iteration = 'Iteration';}
            if(this.increment == null) { this.increment = 'Increment';}
            if(this.epic == null) { this.epic = 'Collection';}
        }
    }
}
