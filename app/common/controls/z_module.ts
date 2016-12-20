/// <reference path='../../_all.ts' />

var mod: ng.IModule = angular.module("scrumdoControls", ['scrumdo-mixpanel']);

mod.controller("SDSelectController", scrumdo.SDSelectController);
mod.controller("DatePickerController", scrumdo.DatePickerController);
mod.controller("SDTimeEntryController", scrumdo.SDTimeEntryController);
mod.controller("SDMultiSelectController", scrumdo.SDMultiSelectController);
mod.controller("SDLabelsBoxController", scrumdo.SDLabelsBoxController);
mod.controller("SDTagsBoxController", scrumdo.SDTagsBoxController);
mod.controller("BusinessValueController", scrumdo.BusinessValueController);
mod.controller("DropdownFilterController", scrumdo.DropdownFilterController);
mod.controller("SDDependenciesBoxController", scrumdo.SDDependenciesBoxController);
mod.controller("CardPickerController", scrumdo.CardPickerController);
mod.controller("LimitBarController", scrumdo.LimitBarController);
mod.controller("LimitSettingsWindowController", scrumdo.LimitSettingsWindowController)


mod.service("cardPicker", scrumdo.CardPicker);
mod.service("dependencyManager", scrumdo.DependencyManager);
mod.service("limitSettingsService", scrumdo.LimitSettingsService);


mod.controller("DropdownFilterController", scrumdo.DropdownFilterController)
mod.controller("SafeProjectSelectCtrl", scrumdo.SafeProjectSelectCtrl);

mod.directive("sdDatePicker", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/datepicker.html",
        controller: "DatePickerController",
        controllerAs: "ctrl",
        require: ['sdDatePicker', 'ngModel'],
        scope: {
            dateOptions: "=",
            placeholder: "@"
        },
        link: function(scope, element, attrs, controllers) {
            var ctrl, ngModel;
            ctrl = controllers[0], ngModel = controllers[1];
            return ctrl.init(ngModel);
        }
    };
});

mod.directive("sdSelect", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/sdselect.html",
        controller: "SDSelectController",
        controllerAs: "ctrl",
        require: '?ngModel',
        scope: {
            options: "=",
            buttonIcon: "@",
            iconTooltip: "@",
            faIcon: "@",
            archiveProperty: "@",
            placeholder: "@",
            allowEmpty: "=",
            showFilter: "@",
            controlType: "@"
        },
        link: function(scope, element, attrs, ngModel:ng.INgModelController) {
            if (!ngModel) {
                return;
            }
            scope.getLabel = function(obj) {
                var prop;
                if (obj == null) {
                    return scope.placeholder || "";
                }
                prop = attrs['labelProperty'] || "label";
                return obj[prop];
            };
            ngModel.$render = function() {
                return scope.currentValue = ngModel.$modelValue;
            };
            return scope.select = function($event, newValue) {
                ngModel.$setViewValue(newValue);
                scope.currentValue = newValue;
                return $event.preventDefault();
            };
        }
    };
});

mod.directive("sdMultiSelect", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/sdmultiselect.html",
        controller: "SDMultiSelectController",
        require: ['sdMultiSelect', 'ngModel'],
        replace: true,
        transclude: true,
        scope: {
            options: "=",
            buttonIcon: "@",
            defaultLabel: "@",
            compareFunction: "&",
            labelFunction: "&",
            showFilter: "@",
            controlType: "@"
        },
        link: function(scope, element, attrs, controllers) {
            var myCtrl, ngModel;
            myCtrl = controllers[0], ngModel = controllers[1];
            return myCtrl.init(element, ngModel, attrs['labelProperty'] || "label", attrs['templateName'] || "common/controls/multiselectbody.html",
                attrs['compareFunction'] != null, attrs['labelFunction'] != null);
        }
    };
});



mod.directive("sdLimitBar", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/limitbar.html",
        controller: "LimitBarController",
        controllerAs: "ctrl",
        scope: {
            stats: "=",
            setLimit: "&",
            canWrite: "="
        }
    };
});


mod.directive("sdLabelsBox", function() {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/common/controls/labelsbox.html",
        controller: "SDLabelsBoxController",
        require: ['sdLabelsBox', 'ngModel'],
        scope: {
            labels: "="
        },
        link: function(scope, element, attrs, controllers) {
            var myCtrl, ngModel;
            myCtrl = controllers[0], ngModel = controllers[1];
            return myCtrl.init(element, ngModel);
        }
    };
});

mod.directive("sdDependencyBox", function () {
    return {
        restrict: "E",
        replace:true,
        templateUrl: STATIC_URL + "app/common/controls/dependencybox.html",
        controller: "SDDependenciesBoxController",
        controllerAs: "ctrl",
        scope: {
            project: "<",
            iteration: "<",
            story: "<",
        }
    };
});

mod.directive("sdTagsBox", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/tagsbox.html",
        controller: "SDTagsBoxController",
        require: ['sdTagsBox', 'ngModel'],
        scope: {
            tags: "="
        },
        link: function(scope, element, attrs, controllers) {
            var myCtrl, ngModel;
            myCtrl = controllers[0], ngModel = controllers[1];
            return myCtrl.init(element, ngModel);
        }
    };
});

mod.directive("sdBusinessValue", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/businessvalue.html",
        controller: "BusinessValueController",
        controllerAs: "ctrl",
        require: ['sdBusinessValue', 'ngModel'],
        scope: {
            tags: "=",
            renderMode: "=",
            pointScale: "="
        },
        link: function(scope, element, attrs, controllers) {
            var myCtrl, ngModel;
            myCtrl = controllers[0], ngModel = controllers[1];
            return myCtrl.init(element, ngModel);
        }
    };
});

mod.directive("sdTimeEntry", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/timeentry.html",
        controller: "SDTimeEntryController",
        controllerAs: "ctrl",
        require: ['sdTimeEntry', 'ngModel'],
        scope: {
            tags: "=",
            placeholder: "@"
        },
        link: function(scope, element, attrs, controllers) {
            var myCtrl, ngModel;
            myCtrl = controllers[0], ngModel = controllers[1];
            return myCtrl.init(element, ngModel);
        }
    };
});

mod.directive("dropdownFilter", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/dropdownfilter.html",
        controller: "DropdownFilterController",
        controllerAs: "ctrl",
        require: ['dropdownFilter', 'ngModel'],
        scope: {

        },
        link: function(scope, element, attrs, controllers) {
            var ctrl, ngModel;
            ctrl = controllers[0], ngModel = controllers[1];
            return ctrl.init(ngModel, element);
        }
    };
});

mod.directive("sdSafeProjectSelect", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/common/controls/safeprojectselect.html",
        controller: "SafeProjectSelectCtrl",
        controllerAs: "ctrl",
        require: '?ngModel',
        scope: {
            showFilter: "@",
            placeholder: "@",
        },
        link: function(scope, element, attrs, ngModel:ng.INgModelController) {
            if (!ngModel) {
                return;
            }
            ngModel.$render = function() {
                return scope.currentValue = ngModel.$modelValue;
            };
            return scope.select = function($event, newValue) {
                ngModel.$setViewValue(newValue);
                scope.currentValue = newValue;
                return $event.preventDefault();
            };
        }
    };
});
