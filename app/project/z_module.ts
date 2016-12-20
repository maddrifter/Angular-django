/// <reference path='../_all.ts' />

var projmodule: ng.IModule = angular.module("scrumdoProject", ['scrumdoCommon', 'scrumdoPortfolio']);

projmodule.controller("ProjectPickerWindowController", scrumdo.ProjectPickerWindowController);
projmodule.controller("ProjectPickerController", scrumdo.ProjectPickerController);
projmodule.controller("SafeProjectDropdownCtrl", scrumdo.SafeProjectDropdownCtrl);

projmodule.service("projectManager", scrumdo.ProjectManager);

projmodule.controller("ProjectSelectController", scrumdo.ProjectSelectController);

projmodule.directive("safeProjectDropdown", () => {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/project/safeprojectdropdown.html",
        controller: "SafeProjectDropdownCtrl",
        controllerAs: 'spdctrl',
        require: ['safeProjectDropdown'],
        replace: true,
        scope: {
            alignment: '@',
            project: "=",
            projectSelected: "&"
        }

    };
});

projmodule.directive("sdProjectSelect", function () {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/project/projectselect.html",
        controller: "ProjectSelectController",
        controllerAs: 'ctrl',
        require: ['sdProjectSelect', 'ngModel'],
        replace: true,
        scope: {
            projects: "="
        },
        link: function (scope, element, attrs, controllers) {
            var myController, ngModelController;
            myController = controllers[0];
            ngModelController = controllers[1];
            return myController.init(ngModelController);
        }
    };
});
projmodule.service("projectPickerService", scrumdo.ProjectPickerService);

projmodule.directive('sdProjectPicker', () => ({
    scope: {
        projects: "=",
        selected: "&"
    },
    restrict: "E",
    templateUrl: STATIC_URL + "app/project/projectpicker.html",
    controller: "ProjectPickerController",
    controllerAs: "ctrl"
}));

// portfolios: "=",
