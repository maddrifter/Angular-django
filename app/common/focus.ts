/// <reference path='../_all.ts' />

var focusModule: ng.IModule = angular.module("scrumdoFocus", []);

focusModule.directive('initialFocus', ($timeout) => {
    return (scope, elem, attr) => {
        return $timeout((() => {
            return elem.focus();
        }), attr["initialFocus"] || 0);
    }
});

focusModule.directive('focusOn', () => {
    return (scope, elem, attr) => {
        if ((attr.focusOn != null) && attr.focusOn !== '') {
            return scope.$on('focusOn', function(e, name) {
                if (name === attr.focusOn) {
                    return elem[0].focus();
                }
            });
        }
    }
});

focusModule.factory('focus', ($rootScope, $timeout) => {
    return (name) => {
        $timeout(() => {
            $rootScope.$broadcast('focusOn', name);
        });
    }
});