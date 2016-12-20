/// <reference path='../_all.ts' />
module scrumdo {

    class BurndownChart {

        public stackedColors = ["#444444", "#777777", "#1F1581", "#448cca", "#0D7D5B", "#FFC54A", "#ff7f0e", "#A60D05", "#818B16", "#8dc73e"];
        public margin: { top: number, right: number, bottom: number, left: number };
        public scope;
        public attrs;
        public compile;
        public element: ng.IAugmentedJQuery;
        public root;
        public svg;
        public width: number;
        public height: number;
        public xScale;
        public yScale;

        constructor(scope, element, attrs, compile) {
            this.element = element;
            this.attrs = attrs;
            this.scope = scope;
            this.compile = compile;

            this.margin = { top: 20, right: 20, bottom: 90, left: 50 };
            this.svg = d3.select(this.element[0]).append("svg");
            this.svg.attr("class", "report");
            this.root = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        }

        createLegend() {
            var legend = this.root.append("g");
            var y = 0;
            var entry = legend.append("g");
            entry.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("y2", 10)
                .attr("y1", 10)
                .attr("class", "mean-line");
            entry.append("text")
                .text("Mean")
                .attr("dy", 15)
                .attr("dx", 22);

            entry = legend.append("g");

            entry.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("y1", 26)
                .attr("y2", 26)
                .attr("class", "median-line");
            entry.append("text")
                .text("Median")
                .attr("dy", 30)
                .attr("dx", 22);
            legend.attr("transform", "translate(" + (this.width - 50) + ",0)");
        }

        renderNoData() {
            this.root.append("svg:text")
                .text("No data, check your report params on the left")
                .attr("class", "no-data")
                .attr("x", 30)
                .attr("y", 30);
            this.root.append("svg:text")
                .text("and make sure your iteration has start and end dates.")
                .attr("class", "no-data")
                .attr("x", 30)
                .attr("y", 45)
        }

        render = () => {
            this.width = this.element.width() - this.margin.left - this.margin.right;
            this.height = Math.max(100, this.element.height() - this.margin.top - this.margin.bottom - 20);
            this.root.selectAll("*").remove();
            if (this.scope.reportData == null) {
                return;
            }
            if (parseInt(this.scope.chartType) === 1) {
                return this.burnDown();
            }
            if (parseInt(this.scope.chartType) === 2) {
                return this.burnUp();
            }
            if (parseInt(this.scope.chartType) === 3) {
                return this.stacked();
            }
        }

        burnUp() {
            /* 
            # series:
            #  0 - total
            # 1 - 10 - statuses
            # 11 - Estimated Hours
            # 12 - Completed Estimated Hours
            # 13 - Hours Spent
            # 14 - Hours Left */
            if (this.scope.reportData.data.length === 0) {
                return this.renderNoData();
            }
            var completed, total;
            if (this.scope.reportData.data.length === 2) {
                total = this.scope.reportData.data[0];
                completed = this.scope.reportData.data[1];
            } else {
                total = this.scope.reportData.data[0];
                completed = this.scope.reportData.data[10];
            }

            total.values.sort((a, b) => a.x - b.x);
            completed.values.sort((a, b) => a.x - b.x);

            //this.svg.attr("width", this.width + this.margin.left + this.margin.right)
            //    .attr("height", this.height + this.margin.top + this.margin.bottom);
            this.svg.attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
                .attr("preserveAspectRatio", "none");

            var x = d3.time.scale().range([0, this.width]);
            this.xScale = x;

            var y = d3.scale.linear().range([this.height, 0]);
            this.yScale = y;

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickFormat(d3.time.format("%Y-%m-%d"));

            var dayAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .ticks(d3.time.day, 1)
                .tickPadding(6)
                .tickSize(1)
                .tickFormat((d) => "");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var area = d3.svg.area()
                .x((d: any) => x(d.x))
                .y0((d) => y(0))
                .y1((d: any) => y(d.y));
                
            // All series have the same # of x coords...
            x.domain(d3.extent(total.values, (d: any) => d.x));

            var m = d3.max(total.values, (d: any) => d.y);
            y.domain([0, m]);

            var xGrid = d3.svg.axis()
                .scale(x)
                .innerTickSize(-this.height)
                .outerTickSize(0)
                .orient("bottom")
                .tickFormat("");

            var yGrid = d3.svg.axis()
                .scale(y)
                .innerTickSize(-this.width)
                .outerTickSize(0)
                .orient("left")
                .tickFormat("");
                
            // These are the main colored lines
            this.root.append("path")
                .datum(total.values)
                .attr("d", area)
                .attr("class", "area-band")
                .attr("fill", (d) => "#3B98DB");

            var line = d3.svg.line()
                .x((d: any) => x(d.x))
                .y((d: any) => y(d.y));

            this.root.append("path")
                .datum(total.values)
                .attr("d", line)
                .attr("class", "total-line");

            this.root.append("path")
                .datum(completed.values)
                .attr("d", area)
                .attr("class", "area-band")
                .attr("fill", (d) => "#39CC74");

            this.root.append("path")
                .datum(completed.values)
                .attr("d", line)
                .attr("class", "completed-line");

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
                )
                
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
                    d3.select(this)
                        .append('rect')
                        .attr("width", (2 * Math.abs(colWidth)))
                        .attr("height", rectHeight)
                        .attr("transform", "translate(0," + -rectHeight + ")")
                        .style("opacity", "0.04")
                        .style("color", "grey")
                        .attr("shape-rendering", "crispEdges");
                }
            });

            if (this.scope.showIdeal) {
                var maxY = d3.max(total.values, (d: any) => d.y);
                var maxX: any = d3.max(total.values, (d: any) => d.x);
                this.root.append("line")
                    .attr("class", "ideal-line")
                    .attr("x1", 0)
                    .attr("stroke-dasharray", "10,5")
                    .attr("y1", y(0))
                    .attr("x2", x(maxX))
                    .attr("y2", y(maxY));
            }
            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("transform", "translate(0," + this.height + ")")
                .attr("pointer-events", "none")
                .call(xGrid);
                
            // Labels along the left.
            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        }

        burnDown() {
            /*
            # series:
            #  0 - total
            # 1 - 10 - statuses
            # 11 - Estimated Hours
            # 12 - Completed Estimated Hours
            # 13 - Hours Spent
            # 14 - Hours Left */
            if (this.scope.reportData.data.length === 0) {
                return this.renderNoData();
            }
            var completed, total;
            if (this.scope.reportData.data.length === 2) {
                total = this.scope.reportData.data[0];
                completed = this.scope.reportData.data[1];
            } else {
                total = this.scope.reportData.data[0];
                completed = this.scope.reportData.data[10];
            }

            total.values.sort((a, b) => a.x - b.x);
            completed.values.sort((a, b) => a.x - b.x);

            var burndownData = []
            var l = Math.min(total.values.length, completed.values.length);
            var i, j, ref;
            for (i = j = 0, ref = l - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                if (total.values[i].x !== completed.values[i].x) {
                    trace("WARNING: Chart data mismatch!");
                }
                burndownData.push({
                    x: total.values[i].x,
                    y: total.values[i].y - completed.values[i].y
                });
            }
            if (burndownData.length === 0) {
                this.renderNoData();
                return;
            }

            this.svg
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.height + this.margin.top + this.margin.bottom);

            var x = d3.time.scale().range([0, this.width]);
            this.xScale = x;

            var y = d3.scale.linear().range([this.height, 0]);
            this.yScale = y;

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickFormat(d3.time.format("%Y-%m-%d"));

            var dayAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .ticks(d3.time.day, 1)
                .tickPadding(6)
                .tickSize(1)
                .tickFormat((d) => "");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var xGrid = d3.svg.axis()
                .scale(x)
                .innerTickSize(-this.height)
                .outerTickSize(0)
                .orient("bottom")
                .tickFormat("");

            var yGrid = d3.svg.axis()
                .scale(y)
                .innerTickSize(-this.width)
                .outerTickSize(0)
                .orient("left")
                .tickFormat("");

            var area = d3.svg.area()
                .x((d: any) => x(d.x))
                .y0((d) => y(0))
                .y1((d: any) => y(d.y));
                
            // All series have the same # of x coords...
            x.domain(d3.extent(total.values, (d: any) => d.x));
            var maxY;
            if (this.scope.showIdeal) {
                maxY = d3.max(this.scope.reportData.data[0].values, (d: any) => d.y);
            } else {
                maxY = d3.max(burndownData, (d: any) => d.y)
            }
            y.domain([0, maxY]);
            
            // These are the main colored lines
            this.root.append("path")
                .datum(burndownData)
                .attr("d", area)
                .attr("class", "area-band")
                .attr("fill", (d) => "#3E98DB");

            if (this.scope.showIdeal) {
                var maxX: any = d3.max(total.values, (d: any) => d.x);
                this.root.append("line")
                    .attr("class", "ideal-line")
                    .attr("x1", 0)
                    .attr("stroke-dasharray", "10,5")
                    .attr("y1", y(maxY))
                    .attr("x2", x(maxX))
                    .attr("y2", y(0))
            }
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
                
            //weekends highlighted
            var daySvg = this.root.append('g')
                .classed('axis', true)
                .classed('hours', true)
                .classed('labeled', true)
                .attr("transform", "translate(0," + this.height + ")")
                .call(dayAxis)

            var tickCount = dayAxis.ticks()[0];
            var firstVal = x(x.ticks(tickCount)[0]);
            var secondVal = x(x.ticks(tickCount)[1]);
            var colWidth = firstVal - secondVal;
            var rectHeight = this.height;

            daySvg.selectAll('.tick').each(function(d, i) {
                var day = new Date(d).getDay();
                if (day === 6) {
                    d3.select(this)
                        .append('rect')
                        .attr("width", (2 * Math.abs(colWidth)))
                        .attr("height", rectHeight)
                        .attr("transform", "translate(0," + -rectHeight + ")")
                        .style("opacity", "0.1")
                        .style("color", "grey")
                        ;
                }
            });

            var line = d3.svg.line()
                .x((d: any) => x(d.x))
                .y((d: any) => y(d.y));

            this.root.append("path")
                .datum(burndownData)
                .attr("d", line)
                .attr("class", "total-line");

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("transform", "translate(0," + this.height + ")")
                .attr("pointer-events", "none")
                .call(xGrid);
                
            // Labels along the left.
            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        }

        stacked() {
            /*
            # series:
            #  0 - total
            # 1 - 10 - statuses
            # 11 - Estimated Hours
            # 12 - Completed Estimated Hours
            # 13 - Hours Spent
            # 14 - Hours Left */
            var data = this.scope.reportData.data.slice(1, 11);
            if (data.length === 0) {
                this.renderNoData();
                return;
            }

            this.svg
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.height + this.margin.top + this.margin.bottom);

            var x = d3.time.scale().range([0, this.width]);
            this.xScale = x;

            var y = d3.scale.linear().range([this.height, 0]);
            this.yScale = y;

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickFormat(d3.time.format("%Y-%m-%d"));

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var stack = d3.layout.stack()
                .values((d: any) => d.values)
                .x((d) => d.x)
                .y((d) => d.y);

            var xGrid = d3.svg.axis()
                .scale(x)
                .innerTickSize(-this.height)
                .outerTickSize(0)
                .orient("bottom")
                .tickFormat("");

            var yGrid = d3.svg.axis()
                .scale(y)
                .innerTickSize(-this.width)
                .outerTickSize(0)
                .orient("left")
                .tickFormat("");

            var stacked = stack(data);

            var area = d3.svg.area()
                .x((d: any) => x(d.x))
                .y0((d: any) => y(d.y0))
                .y1((d: any) => y(d.y0 + d.y));
                
            // All series have the same # of x coords...
            x.domain(d3.extent(data[0].values, (d: any) => d.x));
            var m = d3.max(stacked[stacked.length - 1]['values'], (d: any) => d.y + d.y0);
            y.domain([0, m]);
            
            // These are the main colored lines
            this.root.selectAll(".area-band")
                .data(stack(data))
                .enter()
                .append("path")
                .attr("class", "area-band")
                .attr("d", (d) => area(d.values))
                .attr("fill", (d) => this.stackedColors[d.statusType])

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

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

        }
    }

    export var ReportBurn = function($compile) {
        return {
            restrict: 'EA',
            scope: {
                project: "=",
                chartType: "=",
                reportData: "=",
                showIdeal: "="
            },
            link: function(scope, element, attrs) {
                var report;
                trace("ReportBurn::link");
                report = new BurndownChart(scope, element, attrs, $compile);
                report.render();
                return scope.$watchGroup(["reportData", "project"], report.render);
            }
        };
    };

}