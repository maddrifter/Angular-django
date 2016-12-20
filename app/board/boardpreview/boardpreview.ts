/// <reference path='../../_all.ts' />

// This directive can create a preview image of a board's structure.  It's currently
// used as the main view in the board editor.  But I also plan on using it in a few
// other places in a smaller size so a user can pick a cell.
module scrumdo {

    var __indexOf = [].indexOf || function (item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item) return i;
            }
            return -1;
        };

    interface PreviewScope extends ng.IScope {
        width: number;
        height: number;
        gridsize: number;
        headers: Array<BoardHeader>;
        hover: {cell:BoardCell; header:BoardHeader;};
        selectedCells:Array<BoardCell|BoardHeader>;
        grid:boolean;
        gridSize:number;
        cells:Array<BoardCell>;
        selectionChanged: Function;
        //cellSelected:Function;
        //headerSelected:Function;
        selectionMode:number;
        workflowSteps:Array<any>;
        drawMode:Number;
        singleSelectMode:boolean;
        cellCounts:Array<{cell_id:number, id__count:number}>;

    }



    export class BoardPreview {
        public static $inject:Array<string> = [];

        public MOUSE_MODE_SELECT = 0;  // Selecting a single cell/header
        public MOUSE_MODE_DRAW = 1;  // Drawing new cells/headers
        public MOUSE_MODE_SELECTION = 2;  // Selecing multiple cells

        private svg:any;
        private duplicateHelper:DuplicateHelper;
        private resizeHelper:BoardResizeHelper;
        private uiLayer:any;
        private headerLayer:any;
        private cellLayer:any;
        private gridLayer:any;
        private workflowNumberLayer:any;
        private selectionLayer:any;
        private mouseMode:number;

        private lastGrid:{width:number, height:number, grid:number};

        private currentDrawing:{
            sx:number;
            sy:number;
            ex:number;
            ey:number;
        };

        constructor(public scope:PreviewScope, public element) {
            this.initialize();
            this.currentDrawing = {
                sx: -1,
                sy: -1,
                ex: -1,
                ey: -1
            };
        }

        public initialize = () => {
            this.scope.$watch("width", this.render);
            this.scope.$watch("height", this.render);
            this.scope.$watch("cells", this.render, true);
            this.scope.$watch("headers", this.render, true);
            this.scope.$watchCollection("selectedCells", this.renderCells);
            this.scope.$watch("grid", this.render);
            this.scope.$on("clearSelection", this.selectNone);
            this.scope.$watch("workflowSteps", this.render, true);
            if (this.scope.width == null) {
                this.scope.width = 300;
            }
            if (this.scope.height == null) {
                this.scope.height = 300;
            }
            if (this.scope.gridsize == null) {
                this.scope.gridsize = 10;
            }
            if (this.scope.grid == null) {
                this.scope.grid = true;
            }

            this.scope.$on('beginDuplicate', this.onBeginDuplicate)
            this.scope.$on('cancelDuplicate', this.onCancelDuplicate)
            this.scope.$on('duplicateTargeted', this.onCancelDuplicate)


            return this.render();
        }

        protected onCancelDuplicate = ($event=null) => {
            if(this.duplicateHelper) {
                this.setDefaultMouseHandlers();
                this.uiLayer.selectAll("*").remove();
                this.duplicateHelper = null;
            }
        }

        protected onBeginDuplicate = ($event, cells) => {
            this.duplicateHelper = new DuplicateHelper(this.uiLayer, cells, this.scope.cells, this.scope.gridsize, this.scope);
            this.svg.on("mousemove", this.duplicateHelper.mouseMove);
            this.svg.on("mousedown", this.duplicateHelper.mouseDown);
        }

        public mouseCoords = () => {
            var c, gridsize;
            gridsize = this.scope.gridsize;
            c = d3.mouse(this.svg[0][0]);
            return [Math.floor(c[0] / gridsize), Math.floor(c[1] / gridsize)];
        }

        public cellAt = (coords) => {
            var cell, ex, ey, sx, sy, x, y, _i, _len, _ref;
            if (this.scope.cells == null) {
                return;
            }
            x = coords[0];
            y = coords[1];
            _ref = this.scope.cells;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                cell = _ref[_i];
                sx = cell.gridsx();
                sy = cell.gridsy();
                ex = cell.gridex();
                ey = cell.gridey();
                if (((sx <= x && x <= ex)) && ((sy <= y && y <= ey))) {
                    return cell;
                }
            }
            return null;
        }

        public headerAt = (coords) => {
            var ex, ey, header, sx, sy, x, y, _i, _len, _ref;
            if (this.scope.headers == null) {
                return;
            }
            x = coords[0];
            y = coords[1];
            _ref = this.scope.headers;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                header = _ref[_i];
                sx = header.gridsx();
                sy = header.gridsy();
                ex = header.gridex();
                ey = header.gridey();
                if (((sx <= x && x <= ex)) && ((sy <= y && y <= ey))) {
                    return header;
                }
            }
            return null;
        }

        public addRemoveCellToSelection = (cell) => {
            var i, _ref;
            if (this.scope.selectedCells == null) {
                return;
            }

            if (this.scope.singleSelectMode) {
                this.scope.selectedCells.splice(0, this.scope.selectedCells.length);
            }

            if (this.scope.selectedCells.indexOf(cell) >= 0) {
                i = this.scope.selectedCells.indexOf(cell);
                this.scope.selectedCells.splice(i, 1);
            } else {
                this.scope.selectedCells.push(cell);
            }
        }


        public startCellResize = (cell, isHeader:boolean = false, startMove:boolean = true, multiselect:boolean = false) => {
            if ((this.resizeHelper != null) && this.resizeHelper.cells.indexOf(cell) !== -1) {
                return;  // We're already resizing this cell
            }

            if (multiselect) {
                if( this.scope.selectedCells.indexOf(cell) >= 0) {
                    removeById(this.scope.selectedCells, cell.id)
                } else {
                    this.scope.selectedCells.push(cell);
                }
            } else {
                this.scope.selectedCells.splice(0, this.scope.selectedCells.length, cell);
            }

            this.removeResizeHelper();
            this.resizeHelper = new scrumdo.BoardResizeHelper(this.uiLayer,
                this.scope.selectedCells,
                isHeader,
                this.scope.gridsize,
                startMove,
                this.scope);

            this.svg.on("mousemove", this.resizeHelper.mouseMove);
            this.svg.on("mouseup", this.resizeHelper.mouseUp);
        }

        public onMouseDown = () => {
            return this.scope.$apply(this._onMouseDown);
        }

        public _onMouseDown = () => {
            var cell, coords, header;
            coords = this.mouseCoords();
            cell = this.cellAt(coords);
            header = this.headerAt(coords);
            if (this.scope.selectionMode) {
                if (cell != null) {
                    this.addRemoveCellToSelection(cell);
                    this.renderCells();
                }
                return true;
            }

            if (this.scope.drawMode) {

                //d3.event
                var event:d3.MouseEvent = <d3.MouseEvent>d3.event;
                var shiftKey = event.shiftKey;

                /*
                    Selected cells/headers can change in the following ways:
                    No shift key:
                      Previous are removed, current is added
                    With shift key:
                      Current is added, nothing is removed
                 */
                var original = this.scope.selectedCells.concat();

                if(cell) {
                    this.startCellResize(cell, false, true, shiftKey);

                    this.scope.selectionChanged({
                        added:_.difference(this.scope.selectedCells, original),
                        removed:_.difference(original, this.scope.selectedCells),
                        current:this.scope.selectedCells
                    });

                    return true;
                }

                if(header) {
                    var added:boolean = this.scope.selectedCells.indexOf(header) == -1;
                    this.startCellResize(header, true, true, shiftKey);

                    this.scope.selectionChanged({
                        added:_.difference(this.scope.selectedCells, original),
                        removed:_.difference(original, this.scope.selectedCells),
                        current:this.scope.selectedCells
                    });

                    return true;
                }


                this.removeResizeHelper();

                this.scope.selectionChanged({added:[], removed:this.scope.selectedCells, current:[]});

                this.scope.selectedCells.splice(0, this.scope.selectedCells.length);


                // Otherwise, we're starting to draw on blank squares.
                this.svg.on("mousemove", this.onDrawingMouseMove);
                this.mouseMode = this.MOUSE_MODE_DRAW;
                this.currentDrawing.sx = coords[0];
                this.currentDrawing.sy = coords[1];
                this.currentDrawing.ex = coords[0];
                this.currentDrawing.ey = coords[1];
                this.renderDrawing();
            }
            return true;
        }

        public selectNone = () => {
            this.removeResizeHelper();
            this.scope.selectionChanged({added:[], removed:this.scope.selectedCells, current:[]});
            this.scope.selectedCells.splice(0, this.scope.selectedCells.length);
        }

        public onSelectionMouseMove = () => {
            return this.scope.$apply(this._onSelectionMouseMove);
        }

        public _onSelectionMouseMove = () => {
            var coords;
            coords = this.mouseCoords();
            if (!coords) {
                return;
            }
            if (this.scope.hover == null) {
                return;
            }

            this.scope.hover.cell = this.cellAt(coords);
            return this.scope.hover.header = this.headerAt(coords);
        }

        public onDrawingMouseMove = () => {
            var coords;
            coords = this.mouseCoords();
            this.currentDrawing.ex = coords[0];
            this.currentDrawing.ey = coords[1];
            return this.renderDrawing();
        }

        public hideDrawing = () => {
            this.uiLayer.select(".current-drawing").remove();
            return this.uiLayer.select(".current-drawing-header").remove();
        }

        public renderDrawing = () => {
            // Renders the drawing the user is currently making.
            // It might turn into a cell, a header, or nothing at all.
            var coords, ex, ey, sx, sy;
            this.uiLayer.select(".current-drawing").remove();
            this.uiLayer.select(".current-drawing-header").remove();

            coords = this.currentDrawingCoordinates();
            sx = coords.sx * this.scope.gridsize;
            ex = coords.ex * this.scope.gridsize;
            sy = coords.sy * this.scope.gridsize;
            ey = coords.ey * this.scope.gridsize;

            this.uiLayer.append("svg:rect").attr("class", "current-drawing").attr("x", sx).attr("y", sy).attr("width", ex - sx).attr("height", ey - sy);

            return this.uiLayer.append("svg:rect").attr("class", "current-drawing-header").attr("x", sx).attr("y", sy).attr("width", ex - sx).attr("height", this.scope.gridsize);
        }

        public removeResizeHelper = () => {
            if (this.resizeHelper != null) {
                this.svg.on("mousemove", null);
                this.svg.on("mouseup", this.onMouseUp);
                // @svg.on("mouseup",null)
                this.resizeHelper.destroy();
                return this.resizeHelper = null;
            }
        }

        public onMouseUp = () => {
            if (this.mouseMode === this.MOUSE_MODE_SELECT || this.mouseMode === this.MOUSE_MODE_SELECTION) {
                return true;
            }

            if (this.mouseMode === this.MOUSE_MODE_DRAW) {
                this.createObjectFromDrawing();
            }

            this.svg.on("mousemove", null);
            if (this.scope.selectionMode) {
                this.svg.on("mousemove", this.onSelectionMouseMove);
            }

            this.mouseMode = this.MOUSE_MODE_SELECT;
            return true;
        }

        public _isHeader(coords) {
            if (coords.width > 2 && coords.height === 1) {
                return true;
            }
            if (coords.height > 2 && coords.width === 1) {
                return true;
            }
            return false;
        }

        public currentDrawingCoordinates = () => {
            // Normalizes the coordinates
            var coords;
            coords = {
                sx: Math.min(this.currentDrawing.sx, this.currentDrawing.ex),
                ex: Math.max(this.currentDrawing.sx, this.currentDrawing.ex) + 1,
                sy: Math.min(this.currentDrawing.sy, this.currentDrawing.ey),
                ey: Math.max(this.currentDrawing.sy, this.currentDrawing.ey) + 1
            };
            coords.width = coords.ex - coords.sx;
            coords.height = coords.ey - coords.sy;
            return coords;
        }

        public createObjectFromDrawing = () => {
            var coords;
            coords = this.currentDrawingCoordinates();
            this.hideDrawing();
            if (this._isHeader(coords)) {
                return this.createHeader(coords);
            }

            if (coords.width > 2) {
                return this.createCell(coords);
            }
        }

        public createHeader = (coords) => {
            return this.scope.$root.$broadcast("createHeader", coords);
        }

        public createCell = (coords) => {
            return this.scope.$root.$broadcast("createCell", coords);
        }

        private setDefaultMouseHandlers() {
            this.svg.on("mousedown", this.onMouseDown);
            this.svg.on("mouseup", this.onMouseUp);
            this.svg.on("mousemove", null);
        }

        public render = () => {
            var chart;
            if (this.svg == null) {
                chart = d3.select(this.element[0]);
                this.svg = chart.append("svg");
                this.setDefaultMouseHandlers();
                this.gridLayer = this.svg.append("g");
                this.cellLayer = this.svg.append("g");
                this.headerLayer = this.svg.append("g");
                this.uiLayer = this.svg.append("g");
                this.selectionLayer = this.svg.append("g");
                this.workflowNumberLayer = this.svg.append("g");
            }

            // The size could have changed...
            this.svg.attr("width", this.scope.width);
            this.svg.attr("height", this.scope.height);

            this.renderGrid();
            this.renderCells();
            this.renderHeaders();
            if (this.scope.selectionMode) {
                this.svg.on("mousemove", this.onSelectionMouseMove);
                return this.svg.on("dragover", this.onDragOver);
            }
        }

        public onDragOver = (evt) => {
            return this.onSelectionMouseMove();
        }

        public renderHeader = (header) => {
            // Render one cell in the grid.
            var c, gridsize, headerg, id;
            id = "header_" + header.id;
            gridsize = this.scope.gridsize;
            c = this.headerLayer.selectAll("#" + id).data([header]);

            headerg = c.enter().append("g").attr("id", id);
            c.exit().remove();

            // # Header
            headerg.append("svg:rect").attr("x", (d) => d.gridsx() * gridsize).attr("y", (d) => d.gridsy() * gridsize).attr("width", (d) => (d.gridex() - d.gridsx() + 1) * gridsize).attr("height", (d) => (d.gridey() - d.gridsy() + 1) * gridsize).attr("fill", (d) => "#" + (d.backgroundColorHex())).attr("class", "header-rect");
            return true;
        }

        public renderHeaders = () => {
            this.headerLayer.selectAll("g").remove();
            return _.forEach(this.scope.headers, this.renderHeader);
        }

        public renderCell = (cell) => {
            // Render one cell in the grid.
            var c, cellg, gridsize, id, step, w, x, y, _ref;
            id = "cell_" + cell.id;
            gridsize = this.scope.gridsize;
            c = this.cellLayer.selectAll("#" + id).data([cell]);

            cellg = c.enter().append("g").attr("id", id);
            c.exit().remove();

            // Body
            cellg.append("svg:rect").attr("x", (d) => d.gridsx() * gridsize).attr("y", (d) => d.gridsy() * gridsize).attr("width", (d) => (d.gridex() - d.gridsx() + 1) * gridsize).attr("height", (d) => (d.gridey() - d.gridsy() + 1) * gridsize).attr("fill", (d) => "#" + (d.backgroundColorHex())).attr("class", "cell-rect");

            // Header
            cellg.append("svg:rect").attr("x", (d) => d.gridsx() * gridsize).attr("y", (d) => d.gridsy() * gridsize).attr("width", (d) => (d.gridex() - d.gridsx() + 1) * gridsize).attr("height", (d) => gridsize).attr("fill", (d) => "#" + (d.headerColorHex())).attr("class", "cell-rect");

            if ((this.scope.selectedCells != null) &&
                (this.scope.selectedCells.indexOf(cell) >= 0)) {
                cellg.append("svg:rect")
                    .attr("x", (d) => d.gridsx() * gridsize)
                    .attr("y", (d) => d.gridsy() * gridsize)
                    .attr("width", (d) => (d.gridex() - d.gridsx() + 1) * gridsize)
                    .attr("height", (d) => (d.gridey() - d.gridsy() + 1) * gridsize)
                    .attr("opacity", 0.2).attr("fill", "#00ff00")
                    .attr("class", "cell-selected");
            }

            if (this.scope.cellCounts) {
                var count = _.findWhere(this.scope.cellCounts, {cell_id:cell.id});
                if(count) {
                    x = cell.gridsx() + (cell.gridex() - cell.gridsx()) / 2;
                    y = cell.gridsy() + (cell.gridey() - cell.gridsy()) / 2;
                    w = cell.gridex() - cell.gridsx();
                    x *= gridsize;
                    y *= gridsize;
                    w *= gridsize;
                    this.workflowNumberLayer.append("g")
                        .append("svg:text")
                        .text(count.id__count)
                        .attr("class", "no-data")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", w)
                        .style("text-anchor", "middle");
                }
            }

            if (this.scope.workflowSteps) {
                cell.steps.forEach((stepId) => {
                    step = _.findWhere(this.scope.workflowSteps, {
                        id: stepId
                    });
                    if (step != null) {
                        x = cell.gridsx() + (cell.gridex() - cell.gridsx()) / 2;
                        y = cell.gridsy() + (cell.gridey() - cell.gridsy()) / 2;
                        w = cell.gridex() - cell.gridsx();
                        x *= gridsize;
                        y *= gridsize;
                        w *= gridsize;
                        this.workflowNumberLayer.append("g").append("svg:text").text(step.name).attr("class", "no-data").attr("x", x).attr("y", y).attr("width", w).style("text-anchor", "middle");
                    }
                });
            }

            return true;
        }

        public renderCells = () => {
            if((!this.scope.selectedCells) || (this.scope.selectedCells.length == 0) ) {
                this.removeResizeHelper();
            }
            this.cellLayer.selectAll("g").remove();
            this.workflowNumberLayer.selectAll("g").remove();
            return _.forEach(this.scope.cells, this.renderCell);
        }

        public renderGrid = () => {
            // Just renders the background grid lines

            if (!this.scope.grid) {
                this.gridLayer.selectAll(".vline").remove();
                this.gridLayer.selectAll(".hline").remove();
                return;
            }

            var gridsize:number = this.scope.gridsize;

            // Don't re-render the same grid repeatedly.
            var params = {width:this.scope.width, height:this.scope.height, grid:gridsize};
            if(angular.equals(this.lastGrid, params) ){return;}
            this.lastGrid = params;

            this.gridLayer
                .selectAll(".vline")
                .data(d3.range(1 + Math.ceil(this.scope.width / gridsize)))
                    .enter()
                        .append("line")
                            .attr("x1", (d) => d * gridsize)
                            .attr("x2", (d) => d * gridsize)
                            .attr("y1", 0)
                            .attr("y2", this.scope.height)
                            .attr("class", "vline");

            this.gridLayer
                .selectAll(".hline")
                .data(d3.range(1 + Math.round(this.scope.height / gridsize)))
                    .enter()
                        .append("line")
                            .attr("y1", (d) => d * gridsize)
                            .attr("y2", (d) => d * gridsize)
                            .attr("x1", 0)
                            .attr("x2", this.scope.width)
                            .attr("class", "hline");
        }
    }

    export function boardPreview($compile) {
        return {
            scope: {
                cells: "=",
                headers: "=",
                gridsize: "=",
                width: "=",
                height: "=",
                grid: "=",
                selectionChanged: "&",
                selectedCells: "=",
                selectionMode: "=",
                singleSelectMode: "=",
                drawMode: "=",
                workflowSteps: "=",
                hover: "=",
                cellCounts: "="
            },
            restrict: "AE",
            link: (scope, element, attrs) => {
                var preview;
                trace("boardPreview::link " + element);
                preview = new BoardPreview(scope, element);
            }
        };
    }

}