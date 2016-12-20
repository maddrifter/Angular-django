/// <reference path='../../_all.ts' />

module scrumdo {
    export class CellPickerController {

        public static $inject:Array<string> = ["$scope"];
        public hover:any;

        constructor(public scope) {
            this.hover = {};

            this.scope.gridsize = 6;
            this.scope.$watch("cells", this.setSize);
            this.scope.$watch("headers", this.setSize);
        }

        public mouseLeft = () => {
            this.hover.cell = null;
            return this.hover.header = null;
        }

        public setSize = () => {
            var maxHeight, maxWidth;
            if (!((this.scope.cells != null) && this.scope.headers)) {
                return;
            }
            maxWidth = 20;
            maxHeight = 20;
            this.scope.cells.forEach((cell:any) => {
                maxWidth = Math.max(maxWidth, cell.gridex() * this.scope.gridsize);
                return maxHeight = Math.max(maxHeight, cell.gridey() * this.scope.gridsize);
            });

            this.scope.headers.forEach((header:any) => {
                maxWidth = Math.max(maxWidth, header.gridex() * this.scope.gridsize);
                return maxHeight = Math.max(maxHeight, header.gridey() * this.scope.gridsize);
            });

            this.scope.width = maxWidth + this.scope.gridsize + 1;
            return this.scope.height = maxHeight + this.scope.gridsize + 1;
        }
    }
}