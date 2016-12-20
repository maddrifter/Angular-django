/// <reference path='../_all.ts' />

const summarymod = angular.module('scrumdoSummary', ["scrumdoNotes", "ngScrollbars"]);

summarymod.controller('SummaryController', scrumdo.SummaryController);

summarymod.directive("summarySidebar", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/summary/sidebar.html",
    };
});