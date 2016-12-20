/// <reference path='../_all.ts' />

var taskmodule: ng.IModule = angular.module("scrumdoTasks", []);

taskmodule.service("taskManager", scrumdo.TaskManager);
taskmodule.service("taskEditor", scrumdo.TaskEditor);

taskmodule.controller("NewTaskWindowController", scrumdo.NewTaskWindowController);
taskmodule.controller("TaskGridController", scrumdo.TaskGridController);
taskmodule.controller("TaskController", scrumdo.TaskController);
taskmodule.controller("TaskEditWindowController", scrumdo.TaskEditWindowController);

taskmodule.directive("sdNewTaskWindow", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'TaskController',
        templateUrl: STATIC_URL + "app/task/task.html"
    };
});

taskmodule.directive("sdTask", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'TaskController',
        templateUrl: STATIC_URL + "app/task/task.html"
    };
});

taskmodule.directive("sdTaskGrid", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'TaskGridController',
        templateUrl: STATIC_URL + "app/task/taskgrid.html",
        scope: {
            user: "=",
            project: "=",
            story: "="
        }
    };
});