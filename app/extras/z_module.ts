/// <reference path='../_all.ts' />

var extrasModels: ng.IModule = angular.module("scrumdoExtrasModels", []);
extrasModels.service('extrasManager', scrumdo.ExtrasManager);

var extras: ng.IModule = angular.module("scrumdoExtras", ['scrumdoExtrasModels']);
extras.service("githubExtraManager", scrumdo.GithubExtraManager);

//############### Organization extras module
var orgExtras: ng.IModule = angular.module("scrumdoOrgExtras", ['scrumdoExtras', 'scrumdoTeams']);
orgExtras.controller("OrgExtrasController", scrumdo.OrgExtrasController);
orgExtras.directive("sdOrgExtras", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/extras/orgextras.html",
        controller: "OrgExtrasController",
        controllerAs: 'ctrl'
    };
});

//################ Project extras module
var projectExtras: ng.IModule = angular.module("scrumdoProjectExtras", ['scrumdoExtras']);
projectExtras.controller("GithubProjectController", scrumdo.GithubProjectController);