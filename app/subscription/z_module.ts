/// <reference path='../_all.ts' />

var subModule: ng.IModule = angular.module("scrumdoSubscription", []);

subModule.controller("SubscriptionPlansController", scrumdo.SubscriptionPlansController);
subModule.controller("SubscriptionController", scrumdo.SubscriptionController);

subModule.directive("sdCurrentSubscription", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/subscription/currentsubscription.html"
    };
});

subModule.directive("sdSubscriptionTable", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/subscription/subscriptiontable.html"
    };
});

subModule.directive("sdSubscriptionFeatures", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/subscription/subscriptionfeatures.html"
    };
});

subModule.directive("sdPlansPage", function() {
    return {
        controller: "SubscriptionPlansController",
        controllerAs: "ctrl"
    };
});

subModule.directive("sdSubscriptionPage", function() {
    return {
        controller: "SubscriptionController",
        controllerAs: "ctrl"
    };
});

subModule.directive("sdPremiumUpgrade", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/subscription/subscriptionupgrade.html"
    };
});

subModule.directive("sdSubscriptionMembers", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/subscription/subscriptionmembers.html"
    };
});