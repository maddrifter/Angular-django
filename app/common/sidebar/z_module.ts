/// <reference path='../../_all.ts' />

var mod: ng.IModule = angular.module("scrumdoSidebar", ['scrumdo-mixpanel','scrumdoCommon']);

mod.controller("SideBarController", scrumdo.SideBarController);

mod.directive("sdSidebar", function() {
  return {
    restrict: "E",
    scope: true,
    templateUrl: STATIC_URL + "app/common/sidebar/sidebar.html",
    controller: "SideBarController"
  };
});