/// <reference path='../_all.ts' />

module scrumdo {

    class AgingChart {

        public margin: { top: number, right: number, bottom: number, left: number };
        public svg;
        public scope;
        public attrs;
        public compile;
        public element: ng.IAugmentedJQuery;
        public root;
        public width: number;
        public height: number

        constructor(scope, element, attrs, compile) {
            this.element = element;
            this.attrs = attrs;
            this.scope = scope;
            this.compile = compile;

            this.margin = { top: 20, right: 20, bottom: 90, left: 50 };
            this.svg = d3.select(this.element[0]).append("svg");
            this.svg.attr("class", "report").attr("width", "100%").attr("height", "100%");

            this.root = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        }

        createLegend() {

        }

        renderNoData() {
            this.root.append("svg:text").text("No data").attr("class", "no-data").attr("x", this.width / 2).attr("y", this.height / 2);
        }

        render = () => {
            var chartType, data, ref;
            this.width = this.element.width() - this.margin.left - this.margin.right;
            this.height = Math.max(200, this.element.height() - this.margin.top - this.margin.bottom - 20);
            if (((ref = this.scope.reportData) != null ? ref.data : void 0) == null || this.scope.reportData.data.locked == true) {
                return;
            }
            data = this.scope.reportData.data;
            chartType = parseInt(this.scope.chartType);
            if (chartType === 1) {
                this.renderAgeHistogram(data);
            } else if (chartType === 2) {
                this.renderAgeBreakdown(data);
            } else if (chartType === 3) {
                this.renderAgePie(data);
            }
        }

        renderAgeBreakdown(data) {
            this.root.selectAll("*").remove();
            //var x = d3.scale.linear().range([this.width, 0]);
            var y = d3.scale.linear().range([this.height, 0]);
            //x.domain([1, data.length]);
            y.domain([0, d3.max(data, (d: any) => d.max) + 1]);

            this.root.append("line")
                .attr("class", "line-axis")
                .attr("x1", 0)
                .attr("x2", this.width)
                .attr("y1", this.height)
                .attr("y2", this.height);

            var tickCount = 10; //Math.min(10, data.length) 
            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(tickCount)
                .tickFormat(d3.format("d"));


            var yGrid = d3.svg.axis()
                .scale(y)
                .innerTickSize(-this.width)
                .outerTickSize(0)
                .orient("left")
                .tickFormat("");

            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            var entries = this.root.selectAll(".entries")
                .data(data)
                .enter();

            var columnWidth = 15;
            var yOffset = 10;
            var xOffset = 15;
            var x = ((val) => {
                return val * (1 + columnWidth) * 5
            });

            this.root.append("g")
                .attr("class", "grid-line")
                .call(yGrid);

            entries.append("rect")
                .attr("x", (d, i) => x(i))
                .attr("width", columnWidth - 1)
                .attr("y", (d) => y(d.max))
                .attr("height", (d) => this.height - y(d.max))
                .attr("fill", "#3898DB");

            entries.append("rect")
                .attr("x", (d, i) => x(i) + columnWidth)
                .attr("width", columnWidth - 1)
                .attr("y", (d) => y(d.mean))
                .attr("height", (d) => this.height - y(d.mean))
                .attr("fill", "#34CC73");

            entries.append("rect")
                .attr("x", (d, i) => x(i) + columnWidth * 2)
                .attr("width", columnWidth - 1)
                .attr("y", (d) => y(d.median))
                .attr("height", (d) => this.height - y(d.median))
                .attr("fill", "#9A59B5");

            entries.append("rect")
                .attr("x", (d, i) => x(i) + columnWidth * 3)
                .attr("width", columnWidth - 1)
                .attr("y", (d) => y(d.min))
                .attr("height", (d) => this.height - y(d.min))
                .attr("fill", "#F6764E");

            var entry = entries.append("g")
                .attr("transform", (d, i) => {
                    return "translate(" + (x(i) + xOffset) + ", " + (this.height + yOffset) + ")";
                });

            entry.append("text")
                .attr("text-anchor", "end")
                .text((d) => d.name)
                .attr("transform", "rotate(-65)");

            var legendData = [
                { color: "#3898DB", label: "Maximum" },
                { color: "#34CC73", label: "Mean" },
                { color: "#9A59B5", label: "Median" },
                { color: "#F6764E", label: "Min" }
            ];

            var legend = this.root
                .append('g')
                .attr("transform", "translate(" + (this.width - 100) + ",0)")
                .selectAll(".legend").data(legendData).enter().append('g').attr("class", "legend");

            legend.append("rect")
                .attr("x", -1)
                .attr("y", (d, i) => i * 20)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#ffffff")
                .attr("opacity", 0.5);

            legend.append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => i * 20)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", (d) => d.color);

            legend.append("text")
                .text((d) => d.label)
                .attr("dy", (d, i) => i * 20 + 14)
                .attr("dx", 22);
        }

        renderAgePie(inputData) {

            this.root.selectAll("*").remove();
            var radius = Math.min(this.width + this.margin.left + this.margin.right,
                this.height + this.margin.top + this.margin.bottom) / 2;

            var arc = d3.svg.arc()
                .outerRadius(radius - 10)
                .innerRadius(0);

            var pie = d3.layout.pie()
                .sort(null)
                .value((d: any) => d.days);

            if(inputData.length == 0) return;
            if(! inputData[0].color) return;

            var root = this.root.append("g")
                .attr("transform", "translate(" + this.width / 2 + "," + (10 + this.margin.top + this.height / 2) + ")");

            var g = root.selectAll(".arc")
                .data(pie(inputData))
                .enter()
                .append("g")
                .attr("class", "arc");

            var color = d3.scale.category20c();

            g.append("path")
                .attr("d", arc)
                .attr("fill", (d, i) => "#" + (colorToHex(d.data.color)));

            var legend = this.root.selectAll(".legend").data(inputData)
                .enter()
                .append("g")
                .attr("class", "legend");

            legend.append("rect")
                .attr("x", -1)
                .attr("y", (d, i) => i * 20)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#ffffff")
                .attr("opacity", 0.5);

            legend.append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => i * 20)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", (d) => "#" + (colorToHex(d.color)));

            legend.append("text")
                .text((d) => d.label)
                .attr("dy", (d, i) => i * 20 + 14)
                .attr("dx", 22);
        }

        renderAgeHistogram(inputData) {
            var mean = 0;
            var median = 0;
            this.root.selectAll("*").remove();

            if (inputData.length === 0) {
                this.renderNoData();
                return;
            }

            var data = [];
            for (var k in inputData) {
                var v = inputData[k];
                data.push({
                    column: parseInt(k),
                    count: v,
                    label: k
                });
            }

            //this.svg.attr("width", this.width + this.margin.left + this.margin.right)
            //    .attr("height", this.height + this.margin.top + this.margin.bottom);
            this.svg.attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
                .attr("preserveAspectRatio", "none");

            var x = d3.scale.linear().range([this.width, 0]);
            var y = d3.scale.linear().range([this.height, 0]);
            x.domain(d3.extent(data, (d) => d.column));
            y.domain([0, d3.max(data, (d) => d.count) + 1]);
            var tickCount = Math.min(10, data.length);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(tickCount)
                .tickFormat(d3.format("d"));

            var yGrid = d3.svg.axis()
                .scale(y)
                .innerTickSize(-this.width)
                .outerTickSize(0)
                .orient("left")
                .tickFormat("");

            var columnWidth = Math.max(1, Math.min(50, Math.floor(this.width / (1 + d3.max(data, (d) => d.column)))) - 4);

            this.root.append("g")
                .attr("class", "grid-line")
                .call(yGrid);

            var t = this;
            this.root.selectAll(".lead-bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "lead-bar")
                .attr("x", (d) => d.column * (columnWidth + 4))
                .attr("width", columnWidth)
                .attr("y", (d) => y(d.count))
                .attr("height", (d) => t.height - y(d.count));

            var maxLabelLength = 1;


            if (maxLabelLength >= 3) {
                var rotateLabels = columnWidth < 35;
            } else {
                var rotateLabels = columnWidth < 20;
            }

            var xOffset, yOffset;
            if (rotateLabels) {
                yOffset = 10;
                xOffset = 5;
            } else {
                yOffset = 20;
                xOffset = 0;
            }

            this.root.selectAll(".bar-label")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", (d) =>
                    "translate(" + (xOffset + d.column * (columnWidth + 4) + columnWidth / 2) + ", " + (t.height + yOffset) + ")")
                .append("text")
                .attr("text-anchor", (d) => {
                    if (rotateLabels) {
                        return "end";
                    } else {
                        return "middle";
                    }
                })
                .text((d) => d.label)
                .attr("transform", (d) => {
                    if (rotateLabels) {
                        return "rotate(-65)";
                    } else {
                        return "";
                    }
                });
            this.root.append("text")
                .attr("text-anchor", "middle")
                .attr("x", 0)
                .attr("y", this.height + 50)
                .text("# of days");

            this.root.append("text")
                .attr("text-anchor", "middle")
                .attr("y", -35)
                .attr("x", -this.height / 2)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("# of cards");

            this.root.append("line")
                .attr("class", "line-axis")
                .attr("x1", 0)
                .attr("x2", this.width)
                .attr("y1", this.height)
                .attr("y2", this.height);

            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis);

        }
    }

    export var ReportAging = function($compile) {
        return {
            restrict: 'EA',
            scope: {
                project: "=",
                reportData: "=",
                chartType: "="
            },
            link: function(scope, element, attrs) {
                var report;
                trace("ReportAging::link");
                report = new AgingChart(scope, element, attrs, $compile);
                report.render();
                return scope.$watchGroup(["chartType", "reportData", "project"], report.render);
            }
        };
    };
}