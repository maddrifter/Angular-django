/// <reference path='../_all.ts' />

var storymodule: ng.IModule = angular.module("scrumdoStories", ['scrumdoTime',
    'scrumdoBoardManagers',
    'scrumdoNews',
    'scrumdoEpics',
    'scrumdoComments',
    'scrumdoCommon',
    'scrumdoEditor',
    'scrumdo-mixpanel',
    'scrumdoAttachments',
    'scrumdoExtrasModels',
    'scrumdoRelease',
    'cfp.hotkeys']);

storymodule.service("storyManager", scrumdo.StoryManager);
storymodule.service("storyBulkOperations", scrumdo.StoryBulkOperations);
storymodule.service("storyEditor", scrumdo.StoryEditor);
storymodule.service("storyPriorityService", ["$rootScope", scrumdo.StoryPriorityService]);
storymodule.service("milestoneProgressPopupService", scrumdo.MilestoneProgressPopupService);
storymodule.service("contextMenuService", scrumdo.contextMenuService);

storymodule.controller("MilestoneProgressPopupController", scrumdo.MilestoneProgressPopupController);
storymodule.controller("StoryController", scrumdo.StoryController);
storymodule.controller("MoveToCellWindowController", scrumdo.MoveToCellWindowController);
storymodule.controller("StoryEditWindowController", scrumdo.StoryEditWindowController);
storymodule.controller('MilestoneTeamDisplayController', scrumdo.MilestoneTeamDisplayController);
storymodule.controller("DueDateController", scrumdo.DueDateController);
storymodule.controller("AddStoryController", scrumdo.AddStoryController);
storymodule.controller("StoryBlockersController", scrumdo.StoryBlockersController);
storymodule.controller("StoryAgeDisplayController", scrumdo.StoryAgeDisplayController);
storymodule.controller("ReleasePickerController", scrumdo.ReleasePickerController);
storymodule.controller("StoryFeatureController", scrumdo.StoryFeatureController);




storymodule.directive("sdReleasePicker", function() {
    return {
        restrict: 'E',
        controller: 'ReleasePickerController',
        controllerAs: 'ctrl',
        scope: {
            story: "=?",
            project: "=",
            release: "="
        },
        templateUrl: STATIC_URL + "app/story/releasepicker.html"
    };
});


// This directive gives us inputs for all the story add/edit forms tht go in the right hand column.
storymodule.directive("sdStoryFields", function() {
    return {
        restrict: 'E',
        templateUrl: STATIC_URL + "app/story/storyfields.html"
    };
});


storymodule.directive("sdPriorityDisplay", function() {
    return {
        restrict: 'AE',
        scope: {
            story: "="
        },
        templateUrl: STATIC_URL + "app/story/prioritydisplay.html"
    };
});


storymodule.directive("sdStory", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'StoryController',
        scope: {
            story: "=",
            project: "=",
            epics: "=",
            layout: "=",
            planningMode: "=",
            iterations: "=",
            listchild: "=?"
        },
        templateUrl: STATIC_URL + "app/story/story.html"
    };
});

storymodule.directive("sdFeature", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'StoryFeatureController',
        scope: {
            story: "=",
            project: "=",
            layout: "="
        },
        templateUrl: STATIC_URL + "app/story/story.html"
    };
});

storymodule.directive("sdMiletoneTeamDisplay", function() {
    return {
        restrict: 'AE',
        controller: 'MilestoneTeamDisplayController',
        controllerAs: 'ctrl',
        scope: {
            story: "=",
            project: "="
        },
        templateUrl: STATIC_URL + "app/story/milestoneteamdisplay.html"
    };
});

storymodule.directive("sdSelectableStory", function() {
    return {
        replace: true,
        restrict: 'AE',
        controller: 'StoryController',
        scope: {
            story: "=",
            project: "=",
            epics: "=",
            layout: "="
        },
        templateUrl: STATIC_URL + "app/story/selectablestory.html"
    };
});


storymodule.directive("sdDueDate", function() {
    return {
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/story/duedate.html",
        controller: 'DueDateController',
        controllerAs: 'ddctrl',
        scope: {
            story: "="
        }
    };
});


storymodule.directive("sdAddStory", function() {
    return {
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/story/addstory/addstory.html",
        controller: 'AddStoryController',
        scope: {
            project: "=",
            iteration: "=",
            iterations: "=",
            epics: "=",
            organizationSlug: "="
        }
    };
});

storymodule.directive("sdBacklogAddStory", function() {
    return {
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/story/addstory/backlogaddstory.html",
        controller: 'AddStoryController',
        scope: {
            project: "=",
            iteration: "=",
            iterations: "=",
            epics: "=",
            organizationSlug: "="
        }
    };
});


// This directive was not workin in many situations because it was getting the scope
// from the parent of the story instead of the story itself. Many times, things like
// project were missing which caused things to fail in subtle ways.
//
// Instead, I'm moving the creation of a StoryContextMenu into the StoryController
// and using the story-context-menu attribute as a flag to turn it on.
//
// storymodule.directive("storyContextMenu", function() {
//     return {
//         restrict: 'A',
//         link: scrumdo.storyContextMenu
//     };
// });


storymodule.directive("sdAgeDisplay", function(){
   return {
       restrict: 'E',
       templateUrl: STATIC_URL + "app/story/storyagedisplay.html",
       controller: "StoryAgeDisplayController",
       controllerAs: "ctrl",
       scope: {
           story: "=",
           warning: "=",
           critical: "=",
           display: "="
       }
   }
});

storymodule.directive("sdAgingDetails", function(){
   return {
       restrict: 'E',
       templateUrl: STATIC_URL + "app/story/storyagindetails.html"
   }
});

storymodule.directive("sdCardBlockersDisplay", function(){
   return {
       restrict: 'E',
       templateUrl: STATIC_URL + "app/story/storyblockersdisplay.html"
   }
});