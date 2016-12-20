/// <reference path='../_all.ts' />

module scrumdo {
    export class BetaController {
        public static $inject:Array<string> = ["$scope", "betaOptions"];

        constructor(protected $scope, protected betaOptions) {
            $scope.$root.$emit('fullyLoaded');
            $scope.ctrl = this;
            $scope.betaOptions = betaOptions.localStorage.betaOptions;
        }

        public setOption(option, value) {
            this.betaOptions.localStorage.betaOptions[option] = value;
        }

    }



    var betamod:ng.IModule = angular.module("scrumdoBeta", ["scrumdoPreloader", "scrumdoCommon"]);
    betamod.controller('BetaController', BetaController);
}