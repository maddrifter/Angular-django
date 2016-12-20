/// <reference path='../_all.ts' />

var projectAppModule: ng.IModule = angular.module("scrumdoProjectApp", [
                                                                    "ui.router",
                                                                    "scrumdo-mixpanel",
                                                                    "scrumdoTimeline",
                                                                    "scrumdoSummary",
                                                                    "scrumdoChat",
                                                                    "scrumdoDependencies",
                                                                    "scrumdoIterationList",
                                                                    "scrumdoPlanning",
                                                                    "scrumdoExport",
                                                                    "scrumdoTeamPlanning",
                                                                    "scrumdoRisks",
                                                                    "scrumdoOrgPlanning",
                                                                    "scrumdoDashboard",
                                                                    "scrumdoBigPicture"]);


projectAppModule.controller('BreadCrumbsController', scrumdo.BreadCrumbsController);
projectAppModule.controller('ProjectAppController', scrumdo.ProjectAppController);
projectAppModule.service('projectDatastore', scrumdo.ProjectDatastore);

projectAppModule.directive('sdProjectAppTabs',() => ({
    scope: {
        projectData: '=',
        state: '='
    },
    templateUrl: STATIC_URL + "app/projectapp/projectapptabs.html"
}));

projectAppModule.directive('sdProjectAppBreadcrumbs',() => ({
    scope: {
        projectData: '='
    },
    controller: 'BreadCrumbsController',
    controllerAs: 'ctrl',
    templateUrl: STATIC_URL + "app/projectapp/breadcrumbs.html"
}));

projectAppModule.directive('sdRestrictedFeature',() => ({
    replace: true,
    scope: {
        featureName: '=',
        featureImage: '=',
        organizationSlug: "="
    },
    link: (scope,elem,attr) => {
        scope['STATIC_URL'] = STATIC_URL;
    },
    templateUrl: STATIC_URL + "app/projectapp/restrictedfeature.html"
}));
