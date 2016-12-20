/// <reference path='../../_all.ts' />

var alertmodule: ng.IModule = angular.module("scrumdoAlert", []);

alertmodule.service("alertService", ["$uibModal", "urlRewriter", "$rootScope", scrumdo.AlertService]);
alertmodule.service("confirmService", ["$uibModal", "urlRewriter", scrumdo.ConfirmationService]);