/// <reference path='../../_all.ts' />

const scrumdoCardGrid: ng.IModule = angular.module("scrumdoCardGrid", []);


scrumdoCardGrid.controller("CardGridController", scrumdo.CardGridController);
scrumdoCardGrid.controller("CardGridListController", scrumdo.CardGridListController);
scrumdoCardGrid.controller("DependencyGraphController", scrumdo.DependencyGraphController);



scrumdoCardGrid.directive("sdCardGrid", () => {
    return {
        scope: {
            columns: "<",
            rows: "<",
            dependencies: "<",
            cardProvider: "=",
            sortOrder: "="
        },
        transclude: {
            'topright': '?topright',
            'rowtitle': '?rowtitle'
        },
        restrict: 'E',
        controller: "CardGridController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/common/cardgrid/cardgrid.html"
    };
});


scrumdoCardGrid.directive("sdCardGridList", () => {
    return {
        scope: {
            cellData: "<",
            sortOrder: "=",
            canWrite: "="
        },
        restrict: 'E',
        controller: "CardGridListController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/common/cardgrid/cardgridlist.html"
    };
});


scrumdoCardGrid.directive("sdDependencyGraph", () => {
    return {
        scope: {
            dependencies: "<"
        },
        restrict: 'E',
        controller: "DependencyGraphController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/common/cardgrid/dependencygraph.html"
    };
});
