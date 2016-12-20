/// <reference path='../_all.ts' />

var orgmodule: ng.IModule = angular.module("scrumdoOrgPlanning", ['scrumdoRelease', 'scrumdoCommon']);

orgmodule.controller('OrgPlanningController', scrumdo.OrgPlanningController);
orgmodule.controller('ReleasesController', scrumdo.ReleasesController);
orgmodule.controller('ReleaseController', scrumdo.ReleaseController);
orgmodule.controller('PortfolioController', scrumdo.PortfolioController);


orgmodule.directive('sdOrgPlanning', function() {
    return {
        templateUrl: STATIC_URL + "app/orgplanning/orgplanning.html",
        controller: 'OrgPlanningController',
        controllerAs: 'ctrl'
    };
});


orgmodule.directive('sdMilestoneStats', function() {
    return {
        templateUrl: STATIC_URL + "app/orgplanning/milestonestats.html",
        scope: {
            stats: "="
        }
    };
});

orgmodule.directive("orgStoryMappingHeader", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/orgplanning/portfolio/boardheader.html",
    }
});
orgmodule.directive("orgStoryMappingBody", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/orgplanning/portfolio/boardbody.html",
    }
});