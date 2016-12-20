/// <reference path='../../_all.ts' />

var teammodule: ng.IModule = angular.module("scrumdoTeams", []);

teammodule.service("teamManager", scrumdo.TeamManager);
teammodule.controller("projectTeamController", scrumdo.ProjectTeamController);

teammodule.directive("sdTeam", function() {
    return {
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/dashboard/teams/team.html",
        scope: {
            team: "="
        }
    };
});

teammodule.directive("sdProjectTeam", function() {
    return {
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/dashboard/teams/projectteam.html",
        controller: "projectTeamController",
        controllerAs: "ctrl",
        scope: {
            team: "=",
            accessby: "=",
            accessLabel: "="
        }
    };
});