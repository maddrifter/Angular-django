/// <reference path='../_all.ts' />

var exportmodule: ng.IModule = angular.module("scrumdoExport", ['ngCookies']);

exportmodule.service("exportManager", scrumdo.ExportManager);
exportmodule.controller("ExportDialogController", scrumdo.ExportDialogController);
exportmodule.controller("ImportDialogController", scrumdo.ImportDialogController);
