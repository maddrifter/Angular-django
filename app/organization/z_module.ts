/// <reference path='../_all.ts' />

var organizationmodule: ng.IModule = angular.module("scrumdoOrgManager", []);
organizationmodule.controller("orgManagerController", scrumdo.orgManagerController);

organizationmodule.directive("sdOrgDelete", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'orgManagerController',
        templateUrl: STATIC_URL + "app/organization/orgdelete.html"
    };
});