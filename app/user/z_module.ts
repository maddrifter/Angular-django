/// <reference path='../_all.ts' />

interface userAttAttrs extends ng.IAttributes {
    size
}

var mod: ng.IModule = angular.module("scrumdoUser", []);

mod.service("userService", scrumdo.UserService);
mod.controller("SDPeopleController", scrumdo.SDPeopleController);
mod.controller("SDAssigneeController", scrumdo.SDAssigneeController);

mod.directive("sdPeople", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/user/sdpeople.html",
        controller: 'SDPeopleController',
        require: ['sdPeople', 'ngModel'],
        scope: {
            people: "="
        },
        link: function(scope, element, attrs, controllers) {
            var ngModelController, sdPeopleController;
            sdPeopleController = controllers[0], ngModelController = controllers[1];
            return sdPeopleController.init(element, ngModelController);
        }
    };
});

mod.directive("sdAssigneeBox", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/user/sdassignee.html",
        controller: 'SDAssigneeController',
        require: ['sdAssigneeBox', 'ngModel'],
        scope: {
            people: "=",
            label: "@"
        },
        link: function(scope, element, attrs, controllers) {
            var ngModelController, sdPeopleController;
            sdPeopleController = controllers[0], ngModelController = controllers[1];
            return sdPeopleController.init(element, ngModelController);
        }
    };
});

mod.directive("sdUserPortrait", function() {
    return {
        scope: {
            user: "=",
            size: "=",
            imgClass: "="
        },
        compile: (element, attrs: userAttAttrs) => {
            if (!attrs.size) {
                return attrs.size = "24"; // just setting a default
            }
        },
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/user/userportrait.html"
    };
});

mod.directive("avatarTooltip", function() {
    return {
        restrict: 'A',
        link: scrumdo.avatarTooltip
    };
});