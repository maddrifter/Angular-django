/// <reference path='../_all.ts' />

// Class to generate the complex <table> that houses the board cells & headers
// There is a BoardTable directive defined at the end.

module scrumdo {
    export class TableBuilder {

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
            var navigator: Navigator = window.navigator;
            var ua = window.navigator.userAgent;
            return (ua.indexOf("MSIE ") !== -1)
                || (navigator.appName === 'Microsoft Internet Explorer')
                || ((navigator.appName === 'Netscape')
                    && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) !== null));
        }

        buildTable = () => {
            if (!this.boardProject.projectLoaded) {
                return;
            }
            trace("Building! " + this.boardProject.policies);
            $(".kanban-board").width(Math.max($(window).width(), 500));
            $(".kanban-board").height(Math.max($(window).height(), 500));
  
            // First, clear out any content in the element.
            this.element.html("");

            var table = $("<table />");
            var sortedItems = this.sortItemsByPosition();
            if (sortedItems.length === 0) {
                return;
            }
            var currentRow = 0;
            var currentColumn = 0;
            var count = 0;
            var currentTr = $("<tr class='row-" + currentRow + "'}></tr>");
            var i, j, len;
            for (i = j = 0; j <= 100; i = ++j) {
                currentTr.append("<td class='spacer'></td>");
            }
            table.append(currentTr);
            currentTr = $("<tr></tr>");

            var lastHeight: number = 1;
            var renderedItems: Array<any> = [];
            var hadHeader: boolean = false;
            var maxColumn: number = 50;


            for (i = 0, len = sortedItems.length; i < len; i++) {
                var item = sortedItems[i];
                var itemRow = item.gridsy();
                var itemColumn = item.gridsx();
                maxColumn = Math.max(maxColumn, item.gridex());
                if (itemRow !== currentRow) {
                    this.closeCurrentRow(table, currentTr, currentRow, itemRow, renderedItems);
                    if (this.ie) {
                        if (hadHeader) {
                            currentTr.find("td").css("height", "0px");
                            currentTr.find("td").css("max-height", "25px");
                            currentTr.css("max-height: 25px");
                            hadHeader = false;
                        } else {
                            currentTr.find("td").css("height", "350px");
                        }
                    }
                    currentTr = $("<tr class='row-" + currentRow + "'></tr>");
                    currentRow = itemRow;
                    currentColumn = 0;
                    lastHeight = 1;
                }

                this.addSpacers(currentTr, currentRow, currentColumn, itemColumn, renderedItems);
                var colspan = item.gridex() - item.gridsx() + 1;
                currentColumn = item.gridex() + 1;
                var rowspan = item.gridey() - item.gridsy() + 1;
                var itemId = item.id;

                if (item.header != null) {
                    hadHeader = true;
                    var id = "header-holder-" + itemId + " header-cell";
                    var dataid = "sd-header-holder data-header-id='" + itemId + "'";
                } else {
                    var id = "cell-holder-" + itemId + " regular-cell";
                    var dataid = "sd-cell-holder data-cell-id='" + itemId + "' data-skip-rank=\"true\" data-iteration-id=\"{{ defaultBoardIteration }}\" ";
                }
                    
                lastHeight = Math.max(lastHeight, rowspan);
                currentTr.append($("<td class='" + id + "' " + dataid + " colspan='" + colspan + "' rowspan='" + rowspan + "'></td>"));
                
                if (i ==  (sortedItems.length - 1)) {
                    currentTr.find("td:last-child").addClass('last-cell');
                }

                renderedItems.push(item);
                count += 1;
            }
            table.append(currentTr);
            
            // Append enough blank rows at the end to cover the last cell + 1 empty
            var i, j, ref, ref1;

            for (i = j = ref = currentRow, ref1 = lastHeight + 1; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
                currentRow += 1;
                currentTr = $("<tr class='row-" + currentRow + "'></tr>");
                this.addSpacers(currentTr, currentRow, currentColumn, maxColumn, renderedItems);
                this.closeCurrentRow(table, currentTr, currentRow, itemRow, renderedItems);
            }

            if (this.ie) {
                setTimeout(this.fixIEHeight, 250);
            }

            var template = this.compile(table.html());
            this.element.html(template(this.scope));
            this.scope.$broadcast("tableRendered");
        }

        sortItemsByPosition() {
            var items = this.boardProject.boardCells.concat(this.boardProject.boardHeaders);
            items = _.sortBy(items, (value: any) => (pad(value.gridsy(), 5)) + "-" + (pad(value.gridsx(), 5)));
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




    export var BoardTable = (boardProject, $compile) => {
        var link;
        return link = (scope, element, attrs) => {
            var builder;
            trace("BoardTable::link " + boardProject);
            builder = new TableBuilder(boardProject, scope, element, attrs, $compile);
            if (boardProject.projectLoaded) {
                return builder.buildTable();
            } else {
                return scope.$on("projectLoaded", builder.buildTable);
            }
        };
    };
}