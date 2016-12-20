/// <reference path='../../_all.ts' />

module scrumdo {

    interface StatItem {
        label:string;
        value:number;
        limit:number;
    }


    export interface StatGroups extends Array<Array<StatItem>> { }


    export class LimitBarController {
        public static $inject:Array<string> = ["$scope"];

        constructor(private $scope) {
        }

        setLimits($event) {
            $event.preventDefault();
            this.$scope.setLimit();
        }

    }
}