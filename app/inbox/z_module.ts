/// <reference path='../_all.ts' />



var inboxmod:ng.IModule = angular.module("scrumdoInbox", ["scrumdoExport"]);

inboxmod.controller("InboxController", scrumdo.InboxController);
inboxmod.controller("InboxProjectController", scrumdo.InboxProjectController);
inboxmod.controller("GroupController", scrumdo.GroupController);
inboxmod.controller("IterationSummaryController", scrumdo.IterationSummaryController);
inboxmod.controller("ProjectSummaryController", scrumdo.ProjectSummaryController);

inboxmod.service("inboxManager", scrumdo.InboxManager);

inboxmod.directive("projectSummary", function(){
   return {
       templateUrl: STATIC_URL + "app/inbox/projectsummary.html",
       controller: "ProjectSummaryController",
       controllerAs: "pctrl"
   }
});

inboxmod.directive("iterationSummary", function(){
   return {
       scope: {
           iteration: "=",
           iterationId: "=",
           project: "="
       },
       templateUrl: STATIC_URL + "app/inbox/iterationsummary.html",
       controller: "IterationSummaryController",
       controllerAs: "ictrl"
   }
});

inboxmod.directive("sdInbox", function() {
    return {
        templateUrl: STATIC_URL + "app/inbox/inbox.html",
        controller: "InboxController",
        controllerAs: "ctrl"
    }
});

inboxmod.directive("sdInboxProject", function() {
    return {
        replace: true,
        templateUrl: STATIC_URL + "app/inbox/project.html",
        controller: "InboxProjectController",
        controllerAs: "pctrl"
    }
});


