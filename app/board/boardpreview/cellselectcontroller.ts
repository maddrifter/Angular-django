/// <reference path='../../_all.ts' />

module scrumdo {

    interface CellSelectScope extends ng.IScope {
        cells:Array<BoardCell>;
        cellId: number;
    }

    export class CellSelectController {
        public selectedCells:Array<BoardCell>;
        public isopen:boolean;


        public static $inject:Array<string> = ["$scope"];

        constructor(public scope:CellSelectScope) {
            this.selectedCells = [];
            this.onSelectedCellIdChanged();
            this.scope.$watch("ctrl.selectedCells", this.onSelectionChanged, true);
            this.scope.$watch("cellId", this.onSelectedCellIdChanged, true);
        }

        public onSelectedCellIdChanged = () => {

            return this.selectedCells = _.where(this.scope.cells, {id:this.scope.cellId});
        }

        public onSelectionChanged = () => {

            if (this.selectedCells == null) {
                return;
            }
            if (this.selectedCells.length > 0) {
                this.scope.cellId = this.selectedCells[0].id;
            } else {
                this.scope.cellId = -1;
            }
            return this.isopen = false;
        }

        public currentSelection = () => {
            var cell;
            if ((this.scope.cells == null) || this.scope.cellId === -1 || (this.scope.cellId == null)) {
                return "None";
            }
            cell = _.findWhere(this.scope.cells, {
                id: this.scope.cellId
            });
            if (cell != null) {
                return cell.full_label;
            }
            return "";
        }
    }
}