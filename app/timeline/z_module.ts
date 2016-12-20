/// <reference path='../_all.ts' />

const timelinemodule = angular.module('scrumdoTimeline', ['scrumdoProgramIncrement'])

timelinemodule.controller('TimelineController', scrumdo.TimelineController);
timelinemodule.controller('TimelineIncrementController', scrumdo.TimelineIncrementController);
timelinemodule.controller('DatelessIncrementController', scrumdo.DatelessIncrementController);

timelinemodule.directive("timelineSidebar", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/timeline/sidebar.html",
    };
});

timelinemodule.directive("timelineIncrement", () => {
    return {
        restrict: "E",
        replace: true,
        controller: "TimelineIncrementController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/timeline/increment.html",
        scope: {
            increment: "=",
            project: "=",
            canWrite: "="
        }
    };
});

timelinemodule.directive("datelessIncrement", () => {
    return {
        restrict: "E",
        replace: true,
        controller: "DatelessIncrementController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/timeline/datelessincrement.html",
        scope: {
            increment: "=",
            project: "=",
            canWrite: "="
        }
    };
});


timelinemodule.directive("monthlyFeatures", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/timeline/monthlyfeatures.html",
        scope: {
            month: "="
        }
    };
});

timelinemodule.directive('timescale' , ($compile) => {
    return {
        link: (scope, element, attrs:any) => {

            var ts = new scrumdo.SDTimeScale(scope, element, $compile);
            scope.timeScale = ts;
        }
    }
});

timelinemodule.directive('datelessTimescale' , ($compile) => {
    return {
        link: (scope, element, attrs:any) => {

            var ts = new scrumdo.SDDatelessTimeScale(scope, element, $compile);
            scope.timeScale = ts;
        }
    }
});


timelinemodule.directive('timelineScroll' , ($compile) => {
    return {
        link: (scope, element, attrs:any) => {
            var scrollWidth = document.getElementById("scrumdo-timeline-wrapper").scrollWidth,
                direction = attrs["direction"];

            angular.element(element).on("mouseenter", function(){
                var scrollLeft = document.getElementById("scrumdo-timeline-wrapper").scrollLeft,
                    scrollTime = direction == "right" ? scrollWidth : scrollLeft;

                angular.element(this).parent().animate({
                    scrollLeft: direction == "right" ? scrollWidth : 0
                }, scrollTime);
            });

            angular.element(element).on("mouseleave", function(){
                angular.element(this).parent().stop();
            });
        }
    }
});