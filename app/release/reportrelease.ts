/// <reference path='../_all.ts' />

module scrumdo {

    class ReleaseChart {

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
        public dataset;
        public storyList;
        public dragGraphic;
        public reportPoints;
        public xScale;
        public yScale;


        constructor(scope, element, attrs, compile) {
            this.element = element;
            this.attrs = attrs;
            this.scope = scope;
            this.compile = compile;

            this.detailLabels = ["", "Story", "Timestamp", "Step"];
            this.margin = { top: 20, right: 20, bottom: 90, left: 50 };
            this.svg = d3.select(this.element[0]).append("svg");
            this.svg.attr("class", "report");
            this.root = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        }

        createLegend(data) {
            var legend = this.root.append("g");
            var y = 0;
            var ref = data.reverse();
            for (var i = 0, len = ref.length; i < len; i++) {
                var series = ref[i];
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
                    .text(series.name)
                    .attr("dy", y)
                    .attr("dx", 22);
            }

            legend.attr("transform", "translate(20,0)");
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
            //var x = d3.event.x - this.margin.left;
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

            var y = 1;
            var bg = this.storyList.append("rect")
                .attr("fill", "#ffffff")
                .attr("stroke", "#888888")
                .attr("shape-rendering", "crispEdges")
                .attr("opacity", 0.8);

            var text = "Cards: ";
            var i, j, ref, story;

            for (i = j = 0, ref = stories.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                story = stories[i];
                if (i % 8 === 0) {
                    this.storyList.append("text").text(text).attr("dx", 5).attr("dy", y * 15 + 5);
                    y += 1;
                    text = '';
                }
                if (i % 8 !== 0) {
                    text += ", ";
                }
                text += "#" + story;
            }

            this.storyList.append("text")
                .text(text)
                .attr("dx", 5)
                .attr("dy", y * 15 + 5);
            y += 1;

            bg.attr("width", 400);
            bg.attr("height", y * 15);
            var event:d3.MouseEvent = <d3.MouseEvent>d3.event;
            var xPos = event.offsetX - this.margin.left;
            xPos = Math.min(xPos, this.width - 400);
            this.storyList.attr("transform", "translate(" + xPos + "," + (10 + event.offsetY - this.margin.top) + ")");
        }

        renderNoData() {

        }

        render = () => {
            this.width = this.element.width() - this.margin.left - this.margin.right;
            this.height = Math.max(250, this.element.height() - this.margin.top - this.margin.bottom - 20);
            this.root.selectAll("*").remove();
            this.svg.attr("width", this.width + this.margin.left + this.margin.right).attr("height", this.height + this.margin.top + this.margin.bottom);

            var unprocessedData = this.scope.reportData;

            if ((typeof unprocessedData === "undefined" || unprocessedData === null) || unprocessedData.length === 0) {
                this.renderNoData();
                // nothing loaded yet.
                return;
            }
            var parseDate = d3.time.format("%Y-%m-%d").parse;
            var data;
            if (this.reportPoints) {
                data = [
                    { prop: ((d) => d['points_completed']), name: 'Points Completed', values: [], color: 0x8DC73E },
                    { prop: ((d) => d['points_in_progress']), name: 'Points In Progress', values: [], color: 0x3898DB },
                    { prop: ((d) => d['points_total'] - d['points_completed'] - d['points_in_progress']), name: 'Points Todo', values: [], color: 0x747E89 }
                ]
            } else {
                data = [
                    { prop: ((d) => d['cards_completed']), name: 'Cards Completed', values: [], color: 0x8DC73E },
                    { prop: ((d) => d['cards_in_progress']), name: 'Cards In Progress', values: [], color: 0x3898DB },
                    { prop: ((d) => d['cards_total'] - d['cards_completed'] - d['cards_in_progress']), name: 'Cards Todo', values: [], color: 0x747E89 }
                ]
            }
            data.map((series) => {
                series.values = unprocessedData.map((d) => {
                    return {
                        date: d.date,
                        pdate: parseDate(d.date),
                        y: series.prop(d)
                    }
                });
            });

            this.root.selectAll("*").remove();

            var x = d3.time.scale().range([0, this.width]);
            this.xScale = x;

            var y = d3.scale.linear().range([this.height, 0]);
            this.yScale = y;

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickFormat(d3.time.format("%Y-%m-%d"));

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
                .y((d) => d.y);

            var stacked = stack(data);

            var area = d3.svg.area()
                .x((d: any) => x(d.pdate))
                .y0((d: any) => y(d.y0))
                .y1((d: any) => y(d.y0 + d.y));
                
            // All series have the same # of x coords...
            x.domain(d3.extent(data[0].values, (d: any) => d.pdate));

            var m = d3.max(stacked[stacked.length - 1]['values'], (d: any) => d.y + d.y0);
            y.domain([0, m])

            var color = d3.scale.category20();
            
            // These are the main colored lines
            this.root.selectAll(".area-band")
                .data(stack(data))
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
                
            // Horizontal grid lines
            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            this.createLegend(data);

        }
    }

    export var ReportRelease = function($compile) {
        return {
            restrict: 'EA',
            scope: {
                project: "=",
                reportData: "="
            },
            link: function(scope, element, attrs) {
                var report;
                trace("ReportRelease::link");
                report = new ReleaseChart(scope, element, attrs, $compile);
                if('type' in attrs && attrs['type'] == 'points') {
                    report.reportPoints = true;
                }
                report.render();
                return scope.$watchGroup(["reportData", "project"], report.render);
            }
        };
    };
}