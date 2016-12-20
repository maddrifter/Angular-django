/// <reference path='../../_all.ts' />
// Draws the duplicated cells.

module scrumdo {
    export class DuplicateHelper {
        private lastCoordinates:{x:number, y:number} = {x:-1, y:-1};

        private sx:number = 0;
        private sy:number = 0;

        constructor(public layer,
                    public duplicatedCells:Array<BoardCell|BoardHeader>,
                    public allCells:Array<BoardCell|BoardHeader>,
                    public gridsize,
                    public scope) {
            this.sx = _.min(this.duplicatedCells, function(c:BoardCell|BoardHeader):number{return c.gridsx()}).gridsx();
            this.sy = _.min(this.duplicatedCells, function(c:BoardCell|BoardHeader):number{return c.gridsy()}).gridsy();
            this.redraw();
        }

        public mouseDown = () => {
            this.scope.$emit("duplicateTargeted",
                {x:this.lastCoordinates.x-this.sx, y:this.lastCoordinates.y-this.sy},
                this.duplicatedCells);

            this.layer.selectAll("*").remove();
            return true;
        }

        public mouseMove = () => {
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
            this.redraw();
            return true;
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
            var data = this.layer.selectAll(".duplicatebox").data(this.duplicatedCells);
            data.enter()
                .append("svg:rect")
                    .attr("x", (d) => (this.lastCoordinates.x + d.gridsx()-this.sx) * this.gridsize)
                    .attr("y", (d) => (this.lastCoordinates.y + d.gridsy()-this.sy) * this.gridsize)
                    .attr("width", (d) => (d.gridex() - d.gridsx() + 1) * this.gridsize)
                    .attr("height", (d) => (d.gridey() - d.gridsy() + 1) * this.gridsize)
                    .attr("opacity", 0.2)
                    .attr("fill", "#0000ff")
                    .attr("class", "duplicatebox");

            data.attr("x", (d) => (this.lastCoordinates.x + d.gridsx() - this.sx) * this.gridsize)
                .attr("y", (d) => (this.lastCoordinates.y + d.gridsy() - this.sy) * this.gridsize)
                .attr("width", (d) => (d.gridex() - d.gridsx() + 1) * this.gridsize)
                .attr("height", (d) => (d.gridey() - d.gridsy() + 1) * this.gridsize);

            data.exit().remove();


            this.duplicatedCells.forEach((cell:BoardCell|BoardHeader) => {

            });
            //var bl, cell, isCell, m, tl, tr;
            //this.layer.selectAll(".resize-rect").remove();
            //this.layer.selectAll(".resize-handle").remove();
            //
            //if (this.cells.length == 0) { return; }
            //
            //this.cells.forEach((cell) => m = this.layer.append("svg:rect").attr("class", "resize-rect").attr("x", cell.gridsx() * this.gridsize).attr("y", cell.gridsy() * this.gridsize).attr("width", (cell.gridex() - cell.gridsx() + 1) * this.gridsize).attr("height", (cell.gridey() - cell.gridsy() + 1) * this.gridsize).on("mousedown", this.beginMove));
            //
            //if (this.cells.length > 1) {
            //    // No resize handles on multiselected cells.
            //    return;
            //}
            //
            //cell = this.cells[0];
            //
            //isCell = !this.isHeader;
            //
            //tl = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridsx() * this.gridsize).attr("y", cell.gridsy() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeTl);
            //
            //if (isCell || !cell.isVertical()) {
            //    tr = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridex() * this.gridsize).attr("y", cell.gridsy() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeTr);
            //}
            //
            //if (isCell || cell.isVertical()) {
            //    bl = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridsx() * this.gridsize).attr("y", cell.gridey() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeBl);
            //}
            //
            //if (isCell) {
            //    tl = this.layer.append("svg:rect").attr("class", "resize-handle").attr("x", cell.gridex() * this.gridsize).attr("y", cell.gridey() * this.gridsize).attr("width", this.gridsize).attr("height", this.gridsize).on("mousedown", this.resizeBr);
            //}
        }
    }
}