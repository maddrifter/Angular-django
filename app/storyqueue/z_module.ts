/// <reference path='../_all.ts' />

var storyQueueModule: ng.IModule = angular.module("scrumdoStoryQueue", []);

storyQueueModule.controller("StoryQueueController", scrumdo.StoryQueueController);

storyQueueModule.directive("sdStoryQueue", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/storyqueue/storyqueue.html",
        controller: "StoryQueueController",
        controllerAs: "ctrl"
    };
});