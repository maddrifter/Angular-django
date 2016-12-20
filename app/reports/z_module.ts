/// <reference path='../_all.ts' />

var reportModule: ng.IModule = angular.module("scrumdoReports", ["scrumdo-mixpanel"]);

reportModule.service("reportManager", scrumdo.ReportManager);
reportModule.service("savedReportManager", scrumdo.SavedReportManager);

reportModule.controller("ReportsController", scrumdo.ReportsController);
reportModule.controller("SavedReportPopupController", scrumdo.SavedReportPopupController);
reportModule.controller("ReportDropdownController", scrumdo.ReportDropdownController);
reportModule.controller("BlockersListController", scrumdo.BlockersListController);

reportModule.directive("sdReportLead", scrumdo.ReportLead);
reportModule.directive("sdReportCfd", scrumdo.ReportCFD);
reportModule.directive("sdReportBurn", scrumdo.ReportBurn);
reportModule.directive("sdReportAging", scrumdo.ReportAging);
reportModule.directive("sdReportBlockers", scrumdo.ReportBlockers);
reportModule.directive("sdFreqBlockers", scrumdo.FreqBlockers);
reportModule.directive("sdReportIncrementProgress", scrumdo.ReportIncrementProgress);


reportModule.directive("sdReportDropdown", function() {
    return {
        controller: "ReportDropdownController",
        controllerAs: "ctrl",
        scope: {
            project: '=',
            iterations: '=',
            selectedIteration: '='
        },
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/reports/reportdropdown.html"
    };
});

reportModule.directive("sdReportBlockersTable", function() {
    return {
        scope: {
            project: "=",
            reportData: "="
        },
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/reports/blockerstable.html",
        controller: "BlockersListController",
        controllerAs: "ctrl"
    };
});