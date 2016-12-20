/// <reference path='../_all.ts' />

var scrumdoProgramIncrement: ng.IModule = angular.module("scrumdoProgramIncrement", [
    'ngResource',
    'ngStorage',
    'ngAnimate',
    'ui.router',
    'pubnub.angular.service',
    'angularSpectrumColorpicker',
    'scrumdoFilters',
    'scrumdoFilterWidget',
    'scrumdoEpics',
    'scrumdoUser',
    'scrumdoControls',
    'scrumdoUser',
    'scrumdoBoardPreview',
    'scrumdoAttachments',
    'scrumdoComments',
    'scrumdoStories',
    'scrumdoTasks',
    'scrumdoIterations',
    'scrumdoPoker',
    'scrumdoExceptions',
    'scrumdoPoker',
    'scrumdoProject',
    'scrumdoAlert',
    'scrumdoNews',
    'scrumdoPreloader',
    'scrumdoProjectExtras',
    'scrumdoCardGrid'
]);


scrumdoProgramIncrement.service("programIncrementManager", scrumdo.ProgramIncrementManager);
scrumdoProgramIncrement.service("programIncrementProject", scrumdo.ProgramIncrementProject);
scrumdoProgramIncrement.service("IncrementScheduleWindowService", scrumdo.IncrementScheduleWindowService);
scrumdoProgramIncrement.controller("IncrementScheduleWindowController", scrumdo.IncrementScheduleWindowController);


scrumdoProgramIncrement.controller("IncrementFeaturePlans", scrumdo.IncrementFeaturePlansController);
scrumdoProgramIncrement.directive("incrementFeaturePlans", () => {
    return {
        restrict: "E",
        replace: true,
        controller: "IncrementFeaturePlans",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/programincrement/featureplans.html",
        scope: {
            increment: "=",
            project: "="
        }
    }
});

scrumdoProgramIncrement.directive("scheduleFeatures", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/programincrement/schedulefeatures.html",
        scope: {
            schedule: "=",
            project: "="
        }
    };
});
