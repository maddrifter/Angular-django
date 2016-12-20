/// <reference path='../_all.ts' />

var searchmodule: ng.IModule = angular.module("scrumdoSearch", ["scrumdoStories"]);

searchmodule.controller("SearchController", scrumdo.SearchController);

searchmodule.directive("sdSearchPage", function() {
    return {
        restrict: 'E',
        controller: "SearchController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/search/search.html"
    };
});