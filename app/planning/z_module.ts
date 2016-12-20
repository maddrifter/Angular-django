/// <reference path='../_all.ts' />

var epiccolumnmod: ng.IModule = angular.module("scrumdoEpicColumn", ['scrumdo-mixpanel', 'scrumdoRelease']);

epiccolumnmod.controller("EpicColumnController", scrumdo.EpicColumnController);
epiccolumnmod.controller("NoEpicColumnController", scrumdo.NoEpicColumnController);
epiccolumnmod.controller("PlanningEpicController", scrumdo.PlanningEpicController);

epiccolumnmod.directive("sdEpicColumn", function() {
    return {
        restrict: "E",
        scope: {
            epics: "=",
            project: "=",
            iteration: "=",
            iterations: "=",
            cardSize: "=",
            nestedEpics: "=",
            showArchived: "="
        },
        templateUrl: STATIC_URL + "app/planning/epiccolumn.html",
        controller: "EpicColumnController",
        controllerAs: 'ctrl'
    };
});

epiccolumnmod.directive("sdNoEpicColumn", function() {
    return {
        restrict: "E",
        replace: true,
        scope: {
            project: "=",
            iteration: "=",
            iterations: "=",
            cardSize: "=",
            canWrite: "=",
            showArchived: "="
        },
        templateUrl: STATIC_URL + "app/planning/noepiccolumn.html",
        controller: "NoEpicColumnController",
        controllerAs: 'ctrl'
    };
});

var planningmod: ng.IModule = angular.module("scrumdoPlanning", ["scrumdoEpicColumn"])

planningmod.controller("PlanningController", scrumdo.PlanningController);
planningmod.controller("ReleaseColumnController", scrumdo.ReleaseColumnController);
planningmod.controller("PlanningReleaseController", scrumdo.PlanningReleaseController);
planningmod.controller("ListColumnController", scrumdo.ListColumnController);
planningmod.controller("PlanningIterationController", scrumdo.PlanningIterationController);
planningmod.controller("PlanningToolController", scrumdo.PlanningToolController);
planningmod.controller("StoryMappingController", scrumdo.StoryMappingController);
planningmod.controller("EpicController", scrumdo.EpicController);
planningmod.controller("SafeColumnController", scrumdo.SafeColumnController);
planningmod.controller("PlanningSafeController", scrumdo.PlanningSafeController);

planningmod.directive("sdPlanning", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/planning/planning.html",
        controller: "PlanningController",
        controllerAs: 'planningCtrl'
    };
});

planningmod.directive("sdReleaseColumn", function() {
    return {
        restrict: "E",
        scope: {
            project: "=",
            cardSize: "=",
            iterations: "=",
            filter: "="
        },
        templateUrl: STATIC_URL + "app/planning/releasecolumn.html",
        controller: "ReleaseColumnController",
        controllerAs: 'ctrl'
    };
});


planningmod.directive("sdListColumn", function() {
    return {
        restrict: "E",
        scope: {
            project: "=",
            iteration: "=",
            iterations: "=",
            cardSize: "=",
            epics: "=",
            showArchived: "=",
            filter: "="
        },
        templateUrl: STATIC_URL + "app/planning/listcolumn.html",
        controller: "ListColumnController",
        controllerAs: 'ctrl'
    };
});


planningmod.directive("sdPlanningIteration", function() {
    return {
        restrict: "E",
        scope: {
            iteration: "=",
            project: "=",
            autoOpen: "=",
            cardSize: "=",
            epics: "=",
            filter: "="
        },
        templateUrl: STATIC_URL + "app/planning/planningiteration.html",
        controller: "PlanningIterationController",
        controllerAs: 'ctrl'
    };
});


planningmod.directive("sdPlanningRelease", function() {
    return {
        restrict: "E",
        scope: {
            project: "=",
            cardSize: "=",
            stats: "=",
            release: "=",
            iterations: "="
        },
        templateUrl: STATIC_URL + "app/planning/planningrelease.html",
        controller: "PlanningReleaseController",
        controllerAs: 'ctrl'
    };
});

planningmod.directive("sdPlanningSubnav", function() {
    return {
        templateUrl: STATIC_URL + "app/planning/subnav.html",
        replace: true,
    };
});

planningmod.directive("sdStoryMapping", () => {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/planning/storymapping/storymapping.html",
        controller: "StoryMappingController",
        controllerAs: 'mappingCtrl'
    };
});

planningmod.directive("sdStoryMappingEpics", () => {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/planning/storymapping/epictree.html",
    };
});

planningmod.directive("sdStoryMappingHeader", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/planning/storymapping/boardheader.html",
    }
});
planningmod.directive("sdStoryMappingBody", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/planning/storymapping/boardbody.html",
    }
});

planningmod.directive("sdStoryMappingNavbar", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/planning/storymapping/navbar.html",
    }
});

planningmod.directive("sdEpic", () => {
    return {
        replace: false,
        controller: "EpicController",
        controllerAs: "ctrl",
        restrict: "AE",
        scope: {
            epic: "=",
            epics: "=",
            project: "=",
            parent: "="
        },
        templateUrl: STATIC_URL + "app/planning/storymapping/epic.html",
    }
});

planningmod.directive("sdEpicStory", () => {
    return {
        replace: true,
        restrict: "E",
        scope: {
            epic: "=",
            parent: "=",
            iteration: "="
        },
        templateUrl: STATIC_URL + "app/planning/storymapping/epicstory.html",
    }
});

planningmod.directive("sdSafeColumn", () => {
    return {
        restrict: "E",
        scope: {
            project: "=",
            cardSize: "=",
            iterations: "=",
            filter: "="
        },
        templateUrl: STATIC_URL + "app/planning/safecolumn.html",
        controller: "SafeColumnController",
        controllerAs: 'ctrl'
    };
});

planningmod.directive("sdPlanningSafe", function() {
    return {
        restrict: "E",
        scope: {
            project: "=",
            cardSize: "=",
            parent: "=",
            iterations: "="
        },
        templateUrl: STATIC_URL + "app/planning/planningsafe.html",
        controller: "PlanningSafeController",
        controllerAs: 'ctrl'
    };
});
