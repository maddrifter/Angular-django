/// <reference path='../_all.ts' />

const bigpicturemod = angular.module('scrumdoBigPicture', [])

bigpicturemod.controller('BigPictureItrController', scrumdo.BigPictureItrController);
bigpicturemod.controller('bigPictureStatsController', scrumdo.BigPictureStatsController);
bigpicturemod.controller('bigPictureLevelStatsController', scrumdo.BigPictureLevelStatsController);
bigpicturemod.controller('bigPictureSummaryController', scrumdo.BigPictureSummaryController);
bigpicturemod.service('bigPictureManager', scrumdo.BigPictureManager);


bigpicturemod.directive('bigpictureNav' ,() => {
    return{
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/bigpicture/subnav.html"
    }
});

bigpicturemod.directive('projectStats' ,() => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/bigpicture/projectstats.html",
        controller: "bigPictureStatsController",
        controllerAs: "ctrl",
        scope:{
            project: "<",
            iterationid :"<",
            incrementid : "<",
            isroot: "<",
            ispremiumuser: "<"
        }
    }
});

bigpicturemod.directive('levelStats' ,() => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/bigpicture/levelstats.html",
        controller: "bigPictureLevelStatsController",
        controllerAs: "ctrl",
        scope:{
            rootproject: "<",
            level: "<",
            incrementid : "<"
        }
    }
});

bigpicturemod.directive("adjustBoxPosition", ($timeout) => {
    return{
        link: (scope, element, atrrs) => {
            var el = $(element[0]);
            el.on("click", () => {
                var searchBox = el.parents('.content').find('.cards-list'),
                    posX = el.offset().left,
                    winWidth = $(window).outerWidth(),
                    boxWidth = 370,
                    contentWidth = el.parents('.content').outerWidth();
                searchBox.removeClass('left');
               
                if((winWidth - posX) < (boxWidth-contentWidth) ){
                    $timeout( () => {
                        searchBox.addClass('left');
                   }, 1);
               } 
            });
        }
    }
});