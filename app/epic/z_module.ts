/// <reference path='../_all.ts' />

var epicmodule: ng.IModule = angular.module("scrumdoEpics", []);

epicmodule.service("epicManager", scrumdo.EpicManager);
epicmodule.service("epicWindowService", scrumdo.EpicWindowService);

epicmodule.controller("EpicSelectController", scrumdo.EpicSelectController);
epicmodule.controller("EpicReorderWindowController", scrumdo.EpicReorderWindowController);
epicmodule.controller("EpicWindowController", scrumdo.EpicWindowController);

epicmodule.directive("sdEpicSelect", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/epic/epicselect.html",
        controller: "EpicSelectController",
        controllerAs: 'ctrl',
        require: ['sdEpicSelect', 'ngModel'],
        replace: true,
        scope: {
            epic: "=",
            epics: "=",
            noepictitle: "@"
        },
        link: function(scope, element, attrs, controllers) {
            var myController, ngModelController;
            myController = controllers[0];
            ngModelController = controllers[1];
            return myController.init(element, ngModelController);
        }
    };
});

epicmodule.directive("epicTooltip", function() {
  return {
    restrict: 'A',
    link: scrumdo.epicTooltip
  };
});
