/// <reference path='../_all.ts' />

var iterationListModule: ng.IModule = angular.module("scrumdoIterationList", []);

iterationListModule.service("iterationListProject", scrumdo.IterationListProject);

iterationListModule.controller("IterationListController", scrumdo.IterationListController);

iterationListModule.directive("sdIterationList", function() {
    return {
        replace: true,
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/iterationlist/iterationlist.html"
    };
});