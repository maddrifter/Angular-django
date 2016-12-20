/// <reference path='../_all.ts' />

// Separate board managers from other board services since they're used in other places.
var boardmanagermodule: ng.IModule = angular.module("scrumdoBoardManagers", []);

boardmanagermodule.service("boardCellManager", scrumdo.BoardCellManager);
boardmanagermodule.service("boardHeadersManager", scrumdo.BoardHeadersManager);
boardmanagermodule.service("policyManager", scrumdo.PolicyManager);
boardmanagermodule.service("workflowManager", scrumdo.WorkflowManager);
boardmanagermodule.service("sharingManager", scrumdo.SharingManager);
boardmanagermodule.service("milestoneAssignmentManager", scrumdo.MilestoneAssignmentManager);
boardmanagermodule.service("teamAssignService", scrumdo.TeamAssignService);

// ################################################### sharedboardmodule ##################################################### //

// Some fake services for the read-only shared board
var sharedboardmodule: ng.IModule = angular.module("scrumdSharedBoardServices", []);
sharedboardmodule.service("userService", scrumdo.SharedUserService);
sharedboardmodule.service("projectManager", scrumdo.SharedProjectManager);
sharedboardmodule.service("taskManager", scrumdo.SharedStoryManager);
sharedboardmodule.service("storyManager", scrumdo.SharedStoryManager);
sharedboardmodule.service("boardProject", scrumdo.SharedBoardProject);
sharedboardmodule.controller("StoryEditWindowController", scrumdo.SharedStoryEditWindowController);

// ################################################### boardmodule ##################################################### //

// Main board module
var boardmodule: ng.IModule = angular.module("scrumdoBoard", ['as.sortable', 'scrumdoBoardManagers', 'scrumdo-mixpanel', 'scrumdoCommon', 'scrumdoTeams']);

//############ Services: ###############//
boardmodule.service("deleteCellConfirmService", scrumdo.DeleteCellConfirmService);
boardmodule.service("boardProject", scrumdo.BoardProject);
boardmodule.service("initialBoardService", scrumdo.InitialBoardService);

//############ Controllers: ###############//

boardmodule.controller("TeamAssignmentController", scrumdo.TeamAssignmentController);
boardmodule.controller("BacklogEpic", scrumdo.BacklogEpic);
boardmodule.controller("ProjectSettingsController", scrumdo.ProjectSettingsController);
boardmodule.controller("WorkflowStepEditController", scrumdo.WorkflowStepEditController);
boardmodule.controller("DeleteCellConfirmationController", scrumdo.DeleteCellConfirmationController);
boardmodule.controller("BacklogController", scrumdo.BacklogController);
boardmodule.controller("CellController", scrumdo.CellController);
boardmodule.controller("HeaderController", scrumdo.HeaderController);
boardmodule.controller("SettingsController", scrumdo.SettingsController);
boardmodule.controller("BoardEditController", scrumdo.BoardEditController);
boardmodule.controller("BoardController", scrumdo.BoardController);
boardmodule.controller('EmailCardExtraController', scrumdo.EmailCardExtraController);
boardmodule.controller("SharingController", scrumdo.SharingController);
boardmodule.controller("FlowdockExtraController", scrumdo.FlowdockExtraController);
boardmodule.controller("SlackExtraController", scrumdo.SlackExtraController);
boardmodule.controller("HipChatExtraController", scrumdo.HipChatExtraController);
boardmodule.controller("WelcomeDialogController", scrumdo.WelcomeDialogController);

//############ Directives: ###############//
boardmodule.directive("sdCellHolder", function() {
    return { templateUrl: STATIC_URL + "app/board/cell/cell.html" };
});

boardmodule.directive("sdHeaderHolder", function() {
    return {
        scope: true,
        templateUrl: STATIC_URL + "app/board/header/header.html"
    };
});

boardmodule.directive("sdBacklogEpics", function() {
    return {
        templateUrl: STATIC_URL + "app/board/backlogepics.html"
    };
});

boardmodule.directive("sdBacklogNoEpics", function() {
    return {
        templateUrl: STATIC_URL + "app/board/backlognoepics.html"
    };
});

boardmodule.directive("sdBacklogLabels", function() {
    return {
        templateUrl: STATIC_URL + "app/board/backloglabels.html"
    };
});

boardmodule.directive("sdBoardSubnav", function() {
    return {
        templateUrl: STATIC_URL + "app/board/subnav.html"
    };
});

boardmodule.directive("sdArchive", function() {
    return {
        templateUrl: STATIC_URL + "app/board/archive.html",
        controller: "BacklogController",
        scope: {
            boardProject: "="
        }
    };
});

boardmodule.directive("sdBacklog", function() {
    return {
        templateUrl: STATIC_URL + "app/board/backlog.html",
        controller: "BacklogController",
        scope: {
            boardProject: "=",
            project: "=",
            canDrag: "="
        }
    };
});

boardmodule.directive("sdBoardTable", scrumdo.BoardTable);
boardmodule.directive("sdBoardFixed", scrumdo.BoardFixed);