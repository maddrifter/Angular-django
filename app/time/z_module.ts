/// <reference path='../_all.ts' />

var timemodule: ng.IModule = angular.module("scrumdoTime", ["ngToast", "ngTable", "xeditable"]);

timemodule.service("timeManager", scrumdo.TimeManager);
timemodule.service("trackTimeService", scrumdo.TrackTimeService);

timemodule.controller("TrackTimeWindowController", scrumdo.TrackTimeWindowController);
timemodule.controller("TrackTimeController", scrumdo.TrackTimeController);

timemodule.directive("sdTrackTime", function() {
    return {
        restrict: 'AE',
        controller: 'TrackTimeController',
        controllerAs: 'time',
        templateUrl: STATIC_URL + "app/time/tracktime.html"
    };
});