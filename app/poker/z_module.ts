/// <reference path='../_all.ts' />

interface pokerDirController extends ng.INgModelController {
    init(element:any);
}

var pokermod: ng.IModule = angular.module("scrumdoPoker", ['scrumdo-mixpanel']);

pokermod.service("pokerService", scrumdo.PokerService);
pokermod.controller("PokerWindowController", scrumdo.PokerWindowController);
pokermod.controller("SDPokerNotifierController", scrumdo.SDPokerNotifierController);

pokermod.directive("sdPokerNotifier", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/poker/pokernotifier.html",
        controller: "SDPokerNotifierController",
        controllerAs: "ctrl",
        replace: true,
        scope: {
            project: "=",
            user: "="
        },
        link: (scope, element, attrs, controller: pokerDirController) => {
            controller.init(element);
        }
    }
});

module scrumdo {
    export class MockPokerService {
        public available: boolean = false;
    }
}

var mockpokermod: ng.IModule = angular.module("scrumdoMockPoker", []);

mockpokermod.service("pokerService", [scrumdo.MockPokerService]);