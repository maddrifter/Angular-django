/// <reference path='../../_all.ts' />
// Logic for moving & resizing cells and headers.

module scrumdo {
    export class BoardResizeHelper {
        public mouseOffsets = {};
        private lastCoordinates:{x:number, y:number} = {x:-1, y:-1};

        public mode:any;
        private me:number;

        constructor(public layer,
                    public cells:Array<BoardCell|BoardHeader>,
                    public isHeader,
                    public gridsize,
                    startMove:boolean,
                    public scope) {
            this.redraw();
            if (startMove) {
                this.beginMove();
            }

        }

        public mouseUp = () => {
            this.mode = "idle";
            return true;
        }

        public mouseMove = () => {
            if (this.mode === "idle") {
                return;
            }
            // Only want to trigger updates if we've actually moved the mouse past a grid boundry
            // from the last update.
            var pos = this.mouseCoordsObj();
            if( angular.equals(this.lastCoordinates, pos ) ) {
                return;
            }
            this.lastCoordinates = pos;

            return this.scope.$apply(this.processMouseMove);
        }

        public processMouseMove = () => {
            if (this.mode === "idle") {
                return;
            } else if (this.mode === "move") {
                this.moveCell();
            } else if (this.mode === "resizeTl") {
                this.resizeCell(true, true, false, false);
            } else if (this.mode === "resizeTr") {
                this.resizeCell(true, false, false, true);
            } else if (this.mode === "resizeBl") {
                this.resizeCell(false, true, true, false);
            } else if (this.mode === "resizeBr") {
                this.resizeCell(false, false, true, true);
            }
            this.redraw();
            return true;
        }

        public resizeCell = (top, left, bottom, right) => {
            var cell, coords, ex, ey, sx, sy;
            if (this.cells.length !== 1) {
                return;
            }
            cell = this.cells[0];
            cell.dirty = true;
            coords = this.mouseCoords();
            sx = cell.gridsx();
            sy = cell.gridsy();
            ex = cell.gridex();
            ey = cell.gridey();
            if (top) {
                cell.setGridsy(coords[1]);
                cell.setGridHeight(Math.max(ey - coords[1] + 1, 2));
            }
            if (left) {
                cell.setGridsx(coords[0]);
                cell.setGridWidth(Math.max(ex - coords[0] + 1, 2));
            }
            if (bottom) {
                cell.setGridHeight(Math.max(coords[1] - sy, 2));
            }
            if (right) {
                return cell.setGridWidth(Math.max(coords[0] - sx, 2));
            }
        }

        public moveCell = () => {
            var coords;
            if (this.cells.length === 0) {
                return;
            }

            this.cells.forEach((cell) => {
                coords = this.mouseCoords();
                coords[0] -= this.mouseOffsets[cell.id][0];
                coords[1] -= this.mouseOffsets[cell.id][1];
                cell.setGridsx(coords[0]);
                cell.setGridsy(coords[1]);
                cell.dirty = true;
            });

        }

        public beginMove = () => {
            var offset;
            this.lastCoordinates = this.mouseCoordsObj();
            this.cells.forEach((cell) => {
                offset = this.mouseCoords();
                offset[0] -= cell.gridsx();
                offset[1] -= cell.gridsy();
                return this.mouseOffsets[cell.id] = offset;
            });

            this.mode = "move";
            return false;
        }

        public resizeTl = () => {
            this.mode = "resizeTl";
            return false;
        }

        public resizeTr = () => {
            this.mode = "resizeTr";
            return false;
        }

        public resizeBl = () => {
            this.mode = "resizeBl";
            return false;
        }

        public resizeBr = () => {
            this.mode = "resizeBr";
            return false;
        }

        public mouseCoords() {
            var c;
            c = d3.mouse(this.layer[0][0]);
            return [Math.floor(c[0] / this.gridsize), Math.floor(c[1] / this.gridsize)];
        }

        public mouseCoordsObj():{x:number, y:number} {
            var c;
            c = d3.mouse(this.layer[0][0]);
            return {x:Math.floor(c[0] / this.gridsize), y:Math.floor(c[1] / this.gridsize)};
        }

        public destroy() {
            this.layer.selectAll(".resize-rect").remove();
            return this.layer.selectAll(".resize-handle").remove();
        }

        public redraw() {
            var bl, cell, isCell, m, tl, tr;
            this.layer.selectAll(".resize-rect").remove();
            this.layer.selectAll(".resize-handle").remove();

            if (this.cells.length == 0) { return; }

            this.cells.forEach((cell) => m = this.layer.append("svg:rect").attr("class", "resize-rect").attr("x", cell.gridsx() * this.gridsize).attr("y", cell.gridsy() * this.gridsize).attr("width", (cell.gridex() - cell.gridsx() + 1) * this.gridsize).attr("height", (cell.gridey() - cell.gridsy() + 1) * this.gridsize).on("mousedown", this.beginMove));

            if (this.cells.length > 1) {
                // No resize handles on multiselected cells.
                return;
            }

            cell = this.cells[0];

            isCell = !this.isHeader;

            tl = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridsx() * this.gridsize).attr("y", cell.gridsy() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeTl);

            if (isCell || !cell.isVertical()) {
                tr = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridex() * this.gridsize).attr("y", cell.gridsy() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeTr);
            }

            if (isCell || cell.isVertical()) {
                bl = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridsx() * this.gridsize).attr("y", cell.gridey() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeBl);
            }

            if (isCell) {
                tl = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridex() * this.gridsize).attr("y", cell.gridey() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeBr);
            }
        }
    }
}