/// <reference path='../../_all.ts' />

module scrumdo {
    var boardPreviewModule:ng.IModule = angular.module("scrumdoBoardPreview", []);

    boardPreviewModule.controller("CellPickerController", CellPickerController);
    boardPreviewModule.controller("CellSelectController", CellSelectController);

    boardPreviewModule.directive("sdBoardPreview", boardPreview);

    boardPreviewModule.directive("sdCellPicker", function() {
        return {
            controller: "CellPickerController",
            controllerAs: "ctrl",
            templateUrl: STATIC_URL + "app/board/boardpreview/cellpicker.html",
            scope: {
                cells: "=",
                headers: "=",
                selectedCells: "="
            },
            restrict: "E"
        }
    });

    boardPreviewModule.directive("sdCellSelect", function() {
        return {
            templateUrl: STATIC_URL + "app/board/boardpreview/cellselect.html",
            controller: "CellSelectController",
            controllerAs: "ctrl",
            scope: {
                cells: "=",
                headers: "=",
                cellId: "=",
                dropdownClass: "@"
            },
            restrict: "E"
        }
    });
}