/// <reference path='../_all.ts' />

// Class to generate the complex <table> that houses the board cells & headers
// There is a BoardTable directive defined at the end.

module scrumdo {
    export class FixedBuilder {

        public gridSize: number = 10;
        public ie: boolean;

        constructor(
            public boardProject,
            public scope,
            public element,
            public attrs: ng.IAttributes,
            public compile: ng.ICompileService) {
            this.ie = this.isIE();
        }

        isIE(): boolean {
            var navigator = window.navigator
            var ua = window.navigator.userAgent;
            return (ua.indexOf("MSIE ") !== -1)
                || (navigator.appName === 'Microsoft Internet Explorer')
                || ((navigator.appName === 'Netscape')
                    && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) !== null));
        }

        buildFixed = () => {
            if (!this.boardProject.projectLoaded) {
                return;
            }

            var root = $("<div></div>");
            // First, clear out any content in the element.
            this.element.html("");
            var sortedItems = this.sortItemsByPosition();
            if (sortedItems.length === 0) {
                return;
            }

            var renderedItems = [];
            var hadHeader = false;
            var maxColumn = 50;
            var dataid, geometry, i, id, item, itemId, len;

            for (i = 0, len = sortedItems.length; i < len; i++) {
                item = sortedItems[i];
                itemId = item.id;
                if (item.header != null) {
                    hadHeader = true;
                    id = "header-holder-" + itemId + " header-cell position-absolute";
                    dataid = "sd-header-holder data-header-id='" + itemId + "'";
                    geometry = ("top: " + item.sy + "px; ") +
                        ("left: " + item.sx + "px; ") +
                        ("width: " + (item.ex - item.sx) + "px; ") +
                        ("height: " + (item.ey - item.sy) + "px;");
                } else {
                    id = "cell-holder-" + itemId + " regular-cell position-absolute";
                    dataid = "sd-cell-holder data-cell-id='" + itemId + "' data-skip-rank=\"true\" data-iteration-id=\"{{ defaultBoardIteration }}\" ";
                    geometry = ("top: " + item.y + "px; ") +
                        ("left: " + item.x + "px; ") +
                        ("width: " + item.width + "px; ") +
                        ("height: " + item.height + "px;");
                }

                root.append($("<div style='" + geometry + "' class='" + id + "' " + dataid + "></div>"));
                renderedItems.push(item);
            }
            var template = this.compile(root.html());
            this.element.html(template(this.scope));
            this.scope.$broadcast("tableRendered");
        }

        sortItemsByPosition() {
            var items = this.boardProject.boardCells.concat(this.boardProject.boardHeaders);
            items = _.sortBy(items, (value: any) => {
                return (pad(value.gridsy(), 5)) + "-" + (pad(value.gridsx(), 5));
            });
            return items;
        }

        closeCurrentRow(table, currentTr, currentRow, itemRow, renderedItems) {
            table.append(currentTr);  // Append the current data
            var i, j, ref, ref1, row;
            // and then create empty rows until we catch up to the data
            for (i = j = ref = currentRow, ref1 = itemRow - 2; j <= ref1; i = j += 1) {
                row = $("<tr class='empty-row'></tr>");
                this.addSpacers(row, i, 0, 50, renderedItems);
                table.append(row);
            }
        }

        gridContains(item, x, y) {
            return ((item.gridsx() <= x && x <= item.gridex())) && ((item.gridsy() <= y && y <= item.gridey()));
        }

        gridCellOccupied(items, x, y) {
            var i, item, len;
            for (i = 0, len = items.length; i < len; i++) {
                item = items[i];
                if (this.gridContains(item, x, y)) {
                    return item.gridex();
                }
            }
            return 0;
        }

        addSpacers(tr, currentRow, currentColumn, targetColumn, renderedItems, placholder = "&nbsp;") {
            var i, j, occupiedUntil, ref, ref1;
            for (i = j = ref = currentColumn, ref1 = targetColumn; j < ref1; i = j += 1) {
                occupiedUntil = this.gridCellOccupied(renderedItems, i, currentRow);
                if (occupiedUntil === 0) {
                    tr.append("<td class='spacer'>" + placholder + "</td>");
                }
            }
        }

        fixIEHeight() {
            var count, headerTd, i, len, nextRow, ref, row;
            ref = $(".header-cell");
            for (i = 0, len = ref.length; i < len; i++) {
                headerTd = ref[i];
                headerTd = $(headerTd);
                if (headerTd.height() > 25) {
                    row = headerTd.parent();
                    nextRow = row.next();
                    count = 0;
                    while (count <= 5 && nextRow.length > 0 && nextRow.find(".kanban-header").length > 0) {
                        nextRow = row.next();
                        count += 1;
                    }
                    if (count < 5) {
                        nextRow.css("min-height", "300px");
                    }
                }
            }
        }
    }


    export var BoardFixed = (boardProject, $compile) => {
        var link;
        return link = (scope, element, attrs) => {
            var builder;
            trace("BoardFixed::link " + boardProject);
            builder = new FixedBuilder(boardProject, scope, element, attrs, $compile);
            if (boardProject.projectLoaded) {
                return builder.buildFixed();
            } else {
                return scope.$on("projectLoaded", builder.buildFixed);
            }
        };
    };
}