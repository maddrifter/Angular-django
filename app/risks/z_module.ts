/// <reference path='../_all.ts' />

const riskmodule = angular.module('scrumdoRisks',[]);


riskmodule.service('risksManager', scrumdo.RisksManager);

riskmodule.controller('RiskArtifactEditorController', scrumdo.RiskArtifactEditorController);
riskmodule.controller('RisksController', scrumdo.RisksController);
riskmodule.controller("RiskEditWindowController", scrumdo.RiskEditWindowController);
riskmodule.controller("SpiderChart", scrumdo.SpiderChart);
riskmodule.controller("StoryRisksController", scrumdo.StoryRisksController);

riskmodule.directive("sdSpiderChart", ()=>{
    return {
        controller: "SpiderChart",
        controllerAs: "ctrl",
        template: "<div><div class='spider-chart'></div><span>{{ctrl.score()}}</span></div>",
        scope: {
            highlight: "=",
            risks: "=",
            portfolio: "<"
        }
    }
});

riskmodule.directive('sdTopRisks', () => {
    return {
        controller: 'RisksController',
        controllerAs: 'ctrl',
        templateUrl: STATIC_URL + 'app/risks/risks.html',
        link: (scope, element, attrs, controller:any) => controller.topFive = true
    };
})

riskmodule.directive('sdRiskArtifactsLabel',()=>{
    return {
        templateUrl: STATIC_URL + "app/risks/artifactlabels/label.html",
        scope: {
            artifacts: "<",
            clickArtifact: "&"
        }
    }
});
riskmodule.directive('sdRiskArtifactProject',()=>{
    return {
        replace: true,
        templateUrl: STATIC_URL + "app/risks/artifactlabels/project.html",
        scope: {
            project: "<"
        }
    }
});
riskmodule.directive('sdRiskArtifactIteration',()=>{
    return {
        replace: true,
        templateUrl: STATIC_URL + "app/risks/artifactlabels/iteration.html",
        scope: {
            iteration: "<"
        }
    }
});
riskmodule.directive('sdRiskArtifactCard',()=>{
    return {
        replace: true,
        templateUrl: STATIC_URL + "app/risks/artifactlabels/card.html",
        scope: {
            card: "<"
        }
    }
});
riskmodule.directive('sdRiskArtifactPicker',()=>{
    return {
        replace: true,
        templateUrl: STATIC_URL + "app/risks/artifactlabels/picker.html",
        scope: {
            item: "<"
        }
    }
});


riskmodule.directive('sdRiskArtifactEditor',()=>{
    return {
        restrict: 'AE',
        controller: 'RiskArtifactEditorController',
        controllerAs: 'ctrl',
        templateUrl: STATIC_URL + "app/risks/riskartifacteditor.html",
        scope: {
            artifacts: "=",
            portfolioId: "<",

        }
    };
});

riskmodule.directive('sdStoryRisks',()=>{
    return {
        restrict: 'AE',
        controller: 'StoryRisksController',
        controllerAs: 'ctrl',
        templateUrl: STATIC_URL + "app/risks/storyrisks.html",
        scope: {
            project: "<",
            story: "<"
        }
    };
});