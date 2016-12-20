/// <reference path='../_all.ts' />

module scrumdo {
    export class Preloader {
        public static $inject: Array<string> = [
            "$rootScope"
        ];

        public fullyLoaded: boolean;

        constructor(public scope) {
            this.scope.$on('fullyLoaded', this.setFullyLoaded);
            this.scope.preloader = this;
            this.fullyLoaded = false;
        }

        init() {
            this.fullyLoaded = false;
        }

        setFullyLoaded = () => {
            trace("PRELOADER: fully loaded");
            this.fullyLoaded = true;
        }
    }
}

var preloader_module: ng.IModule = angular.module("scrumdoPreloader", []);

preloader_module.service("preloader", scrumdo.Preloader);

preloader_module.run(['preloader', (preloader) => {
    preloader.init();
}]);