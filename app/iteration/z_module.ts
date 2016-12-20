/// <reference path='../_all.ts' />

var iterationmodule: ng.IModule = angular.module("scrumdoIterations", ["ngResource"]);

iterationmodule.service("iterationManager", scrumdo.IterationManager);
iterationmodule.service("iterationWindowService", scrumdo.IterationWindowService);
iterationmodule.controller("IterationWindowController", scrumdo.IterationWindowController);
iterationmodule.controller("IterationSelectController", scrumdo.IterationSelectController);
iterationmodule.controller('IterationController', scrumdo.IterationController);
iterationmodule.controller("IterationMultiSelectController", scrumdo.IterationMultiSelectController);

iterationmodule.directive("sdIterationSelect", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/iteration/iterationselect.html",
        controller: "IterationSelectController",
        controllerAs: 'ctrl',
        require: ['sdIterationSelect', 'ngModel'],
        replace: true,
        scope: {
            iterations: "=",
            defaultLabel: "=",
            alignment: "@",
            timePeriodName: "<"
        },
        link: function(scope, element, attrs, controllers) {
            var myController, ngModelController;
            myController = controllers[0];
            ngModelController = controllers[1];
            return myController.init(ngModelController);
        }
    };
});

///////////////////////// *************** SENTIMENTS *************** ////////////////////////

iterationmodule.service("SentimentsManager", scrumdo.SentimentsManager);
iterationmodule.controller("TeamSentimentController", scrumdo.TeamSentimentController);

iterationmodule.directive("teamSentiments", () => {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/iteration/teamsentiments.html",
        controller: "TeamSentimentController",
        controllerAs: "ctrl",
        replace: true,
        scope: {
            iteration: "=",
            members: "=",
            team: "=",
            parent: "="
        }
    }
});

iterationmodule.directive("incrementSentiments", () => {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/iteration/incrementsentiments.html",
        controller: "TeamSentimentController",
        controllerAs: "ctrl",
        replace: true,
        scope: {
            iteration: "=",
            team: "="
        }
    }
});

iterationmodule.directive("popoverHtml", ($compile, $sce) => { 
    return {
        restrict: "E",
        replace: true,
        link: (scope:any, element, attrs) =>{
            var sentiment = scope['sentiment'];
            var name = sentiment.creator.first_name != "" ? sentiment.creator.first_name : '@'+sentiment.creator.username;
            var header = `<div class="header"><span class="pull-left">${name}</span><span class="pull-right">
                <img height="25" width="25" src="/avatar/avatar/32/${ sentiment.creator.username }" /></span></div>`;
            var body = `<div class="body"><p class="number">${sentiment.number}</p><p class="reason">${sentiment.reason}</p></div>`;
            var html = $sce.trustAsHtml(`<div class="sentiment-popover">${header}${body}</div>`);
            scope.getHtml = () => {
                return html; 
            }
            var $span = $(`<span uib-popover-html="getHtml()" 
                        popover-placement='right-bottom' popover-trigger='mouseenter'
                        class="sentiment-number">${sentiment.number}</span>`);
            $compile($span)(scope);
            angular.element(element).append($span);
        }
    }
});


/////////////////////////// ******************* Vision *********************** //////////////////////////////
iterationmodule.controller('IncrementVisionController', scrumdo.IncrementVisionController);

iterationmodule.directive("incrementVision", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/iteration/incrementvision.html",
        controller: "IncrementVisionController",
        controllerAs: "ctrl",
        scope: {
            increment: "=",
            project: "="
        }
    }
});

/////////////////////////// ******************* Blockers *********************** //////////////////////////////
iterationmodule.controller('IncrementBlockersController', scrumdo.IncrementBlockersController);

iterationmodule.directive("incrementBlockers", () => {
    return {
        restrict: "E",
        replace: true,
        templateUrl: STATIC_URL + "app/iteration/incrementblockers.html",
        controller: "IncrementBlockersController",
        controllerAs: "ctrl",
        scope: {
            increment: "=",
            project: "="
        }
    }
});
iterationmodule.directive("sdIterationMultiSelect", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/iteration/iterationmultiselect.html",
        controller: "IterationMultiSelectController",
        controllerAs: 'ctrl',
        require: ['sdIterationMultiSelect', 'ngModel'],
        replace: true,
        scope: {
            iterations: "=",
            defaultLabel: "=",
            showAllOption: "=",
            timePeriodName: "<"
        },
        link: function(scope, element, attrs, controllers) {
            var myController, ngModelController;
            myController = controllers[0];
            ngModelController = controllers[1];
            return myController.init(ngModelController);
        }
    };
});
