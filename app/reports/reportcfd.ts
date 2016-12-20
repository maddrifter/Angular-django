/// <reference path='../_all.ts' />
module scrumdo {

    class CFDChart {

        public margin: { top: number, right: number, bottom: number, left: number };
        public scope;
        public attrs;
        public compile;
        public element: ng.IAugmentedJQuery;
        public root;
        public svg;
        public width: number;
        public height: number;
        public detailLabels: Array<string>;
        public dragGraphic;
        public yScale;
        public xScale;
        public dragStartPositionX;
        public dragStartPositionY;
        public dataset;
        public storyList;
        public storyEditor;

        constructor(scope, element, attrs, compile, storyEditor) {
            this.element = element;
            this.attrs = attrs;
            this.scope = scope;
            this.compile = compile;

            this.detailLabels = ["", "Story", "Timestamp", "Step"];
            this.margin = { top: 20, right: 20, bottom: 90, left: 50 };
            this.svg = d3.select(this.element[0]).append("svg");
            this.svg.attr("class", "report");
            this.root = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
            this.storyEditor = storyEditor;
        }

        createLegend(data, legends) {
            if (this.scope.mini) {
                return;
            }
            var legend = this.root.append("g");
            var y = 0;
            var x = 0;

            for (var i = legends.length - 1; i >= 0; i--) {
                var series = legends[i];
                var dataEntry = _.filter(data, function (item) {
                    return item["name"] == series.name;
                });
                if (dataEntry.length > 0) {
                    series['avgHeight'] = dataEntry[0]['avgHeight'];
                } else
                    series['avgHeight'] = 0;
                var entry = legend.append("g");

                entry.append("rect")
                    .attr("x", -1)
                    .attr("y", y + 4)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", "#ffffff")
                    .attr("opacity", 0.5);
                entry.append("rect")
                    .attr("x", 0)
                    .attr("y", y + 5)
                    .attr("width", 18)
                    .attr("height", 18)
                    .attr("fill", "#" + (pad(series.color.toString(16), 6)));
                y += 20;
                entry.append("text")
                    .text((series.name).substring(0,50) + '.. (Avg. ' + series.avgHeight.toFixed(2) + ')')
                    .attr("dy", y)
                    .attr("class", "avg-values")
                    .attr("data-value", series.avgHeight.toFixed(2))
                    .attr("dx", 22);
            }
            legend.attr("transform", "translate(20,0)");
        }

        hideDragInfo() {
            if(this.dragGraphic) {
                this.dragGraphic.attr("visibility", "hidden");
            }
        }

        updateDragGraphic(sx, sy, ex, ey) {
            sx -= this.margin.left;
            ex -= this.margin.left;
            sy -= 30;
            ey -= 30;
            var dy = this.height - Math.abs(ey - sy);
            this.dragGraphic.select(".drag-hypo")
                .attr("x1", sx)
                .attr("y1", sy)
                .attr("x2", ex)
                .attr("y2", ey);

            this.dragGraphic.select(".drag-horiz")
                .attr("x1", sx)
                .attr("y1", sy)
                .attr("x2", ex)
                .attr("y2", sy);

            this.dragGraphic.select(".drag-vert")
                .attr("x1", ex)
                .attr("y1", sy)
                .attr("x2", ex)
                .attr("y2", ey);

            var cards = Math.round(this.yScale.invert(dy));
            var start = this.xScale.invert(sx);
            var end = this.xScale.invert(ex);
            var ms = end.getTime() - start.getTime();
            var days = Math.round(Math.abs(ms / 1000 / 60 / 60 / 24));
            if (days > 0) {
                var py;
                if (sy > ey) {
                    py = sy + 15;
                } else {
                    py = sy - 5;
                }
                this.dragGraphic.select(".drag-horiz-label")
                    .text("Days: " + days)
                    .attr("dx", sx + (ex - sx) / 2)
                    .attr("dy", py).attr("visibility", "inherit");
            } else {
                this.dragGraphic.select(".drag-horiz-label")
                    .attr("visibility", "hidden");
            }

            if (cards > 0) {
                this.dragGraphic.select(".drag-vert-label")
                    .text("Cards: " + cards)
                    .attr("dx", ex + 5)
                    .attr("dy", sy + (ey - sy) / 2)
                    .attr("visibility", "inherit");
            } else {
                this.dragGraphic.select(".drag-vert-label")
                    .attr("visibility", "hidden");
            }
        }

        createDragGraphic() {
            this.dragGraphic = this.root.append("g").attr("class", "drag-graphic");

            this.dragGraphic
                .append("text")
                .attr("class", "drag-horiz-label")
                .style("text-anchor", "middle");
            this.dragGraphic
                .append("text")
                .attr("class", "drag-vert-label");
            this.dragGraphic
                .append("line")
                .attr("class", "drag-hypo");
            this.dragGraphic
                .append("line")
                .attr("class", "drag-horiz");
            this.dragGraphic
                .append("line")
                .attr("class", "drag-vert");
        }

        displayDragInfo(sx, sy, ex, ey) {
            var dx = Math.abs(ex - sx);
            var dy = Math.abs(ey - sy);
            var distance = Math.sqrt(dx * dx + dy + dy);

            // trace(`${sx}, ${sy}, ${ex}, ${ey} (${distance})`);

            if (distance < 10) {
                this.hideDragInfo();
                return;
            }

            if (!this.dragGraphic) {
                this.createDragGraphic();
            }
            this.dragGraphic.attr("visibility", "inherit");
            this.updateDragGraphic(sx, sy, ex, ey);
        }

        dragstart = (d) => {
            trace("dragStart");
            this.dragStartPositionX = null;
            this.dragStartPositionY = null;
        }

        dragmove = (d) => {
            var event:d3.MouseEvent = <d3.MouseEvent>d3.event;
            if (this.dragStartPositionX === null) {
                this.dragStartPositionX = event.x;
                this.dragStartPositionY = event.y;
            }
            this.displayDragInfo(this.dragStartPositionX, this.dragStartPositionY, event.x, event.y);
        }

        dragend = (d) => {
            this.hideDragInfo();
        }

        getColorForStatus(status) {
            return "#" + (pad(this.dataset.rawData.data[status - 2].color.toString(16), 6));
        }

        onCircleUnHover = () => {
            if (this.storyList) {
                this.storyList.remove();
            }
        }

        onCircleHover = (d) => {
            if ((this.dragGraphic != null) && this.dragGraphic.attr("visibility") !== "hidden") {
                return;
            }
            var event:d3.MouseEvent = <d3.MouseEvent>d3.event;
            var x = event.x - this.margin.left;
            
            var storyEditor = this.storyEditor;
            var project = this.scope.project;

            if (this.storyList) {
                this.storyList.remove();
            }

            var stories = d.stories;

            if (stories.length === 0) {
                return;
            }
            if (stories.length > 200) {
                return;
            }

            this.storyList = this.root.append("g");

            var bg = this.storyList.append("rect")
                .attr("fill", "#ffffff")
                .attr("stroke", "#888888")
                .attr("shape-rendering", "crispEdges")
                .attr("opacity", 0.8)
                .attr("class", "tip");


            var title = this.storyList.append("text").text('Cards:');
            var cards = this.storyList.append("text");
            var texts = [title, cards];
            var y = 1;

            var i, j, ref, story;

            for (i = j = 0, ref = stories.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                story = stories[i];
                var card_number= stories[i];

                console.log(stories[i], 'stories[i];');
                var text = '';
                if (i % 8 === 0) {
                    text += "";
                }
                if (i % 8 !== 0) {
                    text += ","
                }
                
                text += " #" +story;
                cards.append('tspan').text(text)
                    .attr('stroke', '#9999ff')
                    .attr('class', 'link-card')
                    .attr('data-card', card_number)
                    .style('cursor', 'pointer');
            }

            texts.map(function(obj){
                obj.attr({
                   "dx": 5,
                   "dy": y * 15 + 5
                });
                y += 1;
            });

            bg.attr("width", 400);
            bg.attr("height", y * 15);
            var event:d3.MouseEvent = <d3.MouseEvent>d3.event;
            var xPos = event.offsetX - this.margin.left;
            xPos = Math.min(xPos, this.width - 400);
            this.storyList.attr("transform", "translate(" + xPos + "," + (10 + event.offsetY - this.margin.top) + ")");
            this.storyList.on("mouseleave", this.onCircleUnHover);

            d3.selectAll('.link-card').on("click", function(){
                var cardNumber = d3.select(this).attr("data-card");
                storyEditor.editStoryByNumber(cardNumber, project);
            });
        }

        renderNoData() {
            this.root.append("svg:text")
                .text("No data")
                .attr("class", "no-data")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2);
        }

        render = () => {
            this.width = this.element.width() - this.margin.left - this.margin.right;
            this.height = Math.max(200, this.element.height() - this.margin.top - this.margin.bottom - 20);
            this.root.selectAll("*").remove();
            this.dragGraphic = null;

            this.svg.attr("width", "100%").attr("height", "100%")
                .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
                .attr("preserveAspectRatio", "none");

            var data = this.scope.reportData;
            var legends = this.scope.legends;
            if ((typeof data === "undefined" || data === null) || data.length === 0) {
                this.renderNoData();
                // nothing loaded yet.
                return;
            }


            //this.removeNoData();
            this.root.selectAll("*").remove();
            var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;


            for (var i = 0, len = data.length; i < len; i++) {
                var series = data[i];
                var ref = series['values'];
                if(ref)
                for (var j = 0, len1 = ref.length; j < len1; j++) {
                    var entry = ref[j];
                    entry.pdate = parseDate(entry.date);
                }
            }

            var x = d3.time.scale().range([0, this.width]);
            this.xScale = x;

            var y = d3.scale.linear().range([this.height, 0]);
            this.yScale = y;

            if (this.scope.mini) {
                var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat('');
            } else {
                var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y-%m-%d"));
            }

            var dayAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .ticks(d3.time.day, 1)
                .tickPadding(6)
                .tickSize(1)
                .tickFormat((d) => { return "" });

            var xGrid = d3.svg.axis()
                .scale(x)
                .innerTickSize(-this.height)
                .outerTickSize(0)
                .orient("bottom")
                .tickFormat("");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var yGrid = d3.svg.axis()
                .scale(y)
                .innerTickSize(-this.width)
                .outerTickSize(0)
                .orient("left")
                .tickFormat("");

            var stack = d3.layout.stack()
                .values((d: any) => d.values)
                .x((d: any) => d.pdate)
                .y((d: any) => d.y);

            var stacked = stack(data);

            var area = d3.svg.area()
                .x((d: any) => x(d.pdate))
                .y0((d: any) => y(d.y0))
                .y1((d: any) => y(d.y0 + d.y));

            // All series have the same # of x coords...
            x.domain(d3.extent(data[0].values, (d: any) => d.pdate));
            var m = d3.max(stacked[stacked.length - 1]['values'], (d: any) => d.y + d.y0);
            y.domain([0, m]);


            // These are the main colored lines
            this.root.selectAll(".area-band")
                .data(stacked)
                .enter()
                .append("path")
                .attr("class", "area-band")
                .attr("d", (d) => area(d.values))
                .attr("fill", (d) => "#" + (pad(d.color.toString(16), 6)));



            // The vertical grid lines
            this.root.append("g")
                .attr("class", "grid-line")
                .attr("transform", "translate(0," + this.height + ")")
                .attr("pointer-events", "none")
                .call(xGrid);

            // Labels along the bottom
            this.root.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + this.height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", (d) =>
                    "rotate(-65)"
                );

            // Labels along the left.
            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            //weekends highlighted
            var daySvg = this.root.append('g')
                .classed('axis', true)
                .classed('hours', true)
                .classed('labeled', true)
                .attr("transform", "translate(0," + this.height + ")")
                .call(dayAxis);

            var tickCount = dayAxis.ticks()[0];
            var firstVal = x(x.ticks(tickCount)[0]);
            var secondVal = x(x.ticks(tickCount)[1]);
            var colWidth = firstVal - secondVal;
            var rectHeight = this.height;

            daySvg.selectAll('.tick').each(function(d, i) {
                var day = new Date(d).getDay();
                if (day === 6) {
                    d3.select(this).append('rect')
                        .attr("width", 2 * Math.abs(colWidth))
                        .attr("height", rectHeight)
                        .attr("transform", "translate(0," + -rectHeight + ")")
                        .style("opacity", "0.04")
                        .style("color", "grey")
                        .attr("shape-rendering", "crispEdges");
                }
            });

            // Dots at the datapoints
            this.root.selectAll(".point-circles")
                .data(stacked)
                .enter()
                .append("g")
                .attr("class", "point-circles")
                .selectAll(".point-circle")
                .data((d) => d.values)
                .enter()
                .append("circle")
                .attr("cy", (d) => y(d.y + d.y0))
                .attr("cx", (d) => x(d.pdate) - 1)
                .attr("r", 3)
                .attr("class", "data-point")
                .attr("visibility", (d) => {
                    if (d.y > 0) {
                        return "inherit";
                    } else {
                        return "hidden";
                    }
                })
                .on("mouseover", this.onCircleHover);
                // .on("mouseout", this.onCircleUnHover);

            // Horizontal grid lines
            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            var drag = d3.behavior.drag()
                .on("drag", this.dragmove)
                .on("dragstart", this.dragstart)
                .on("dragend", this.dragend);

            this.svg.call(drag);

            this.createLegend(data, legends);
        }
    }

    export var ReportCFD = function($compile, storyEditor) {
        return {
            restrict: 'EA',
            scope: {
                project: "=",
                mini: "=",
                reportData: "=",
                legends: "="
            },
            link: function(scope, element, attrs) {
                var report;
                trace("ReportCFD::link");
                report = new CFDChart(scope, element, attrs, $compile, storyEditor);
                report.render();
                return scope.$watchGroup(["reportData", "project"], report.render);
            }
        };
    };
}