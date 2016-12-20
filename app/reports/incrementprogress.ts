/// <reference path='../_all.ts' />
module scrumdo {

    class IncrementProgress {

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

        createLegend(data, legends) {
            var legend = this.root.append("g")
                        .attr("class", "legends");
            var y = 0;
            var x = (this.width/2)-300;

            for (var i = legends.length - 1; i >= 0; i--) {
                var series = legends[i];
                var dataEntry = _.filter(data, function (item) {
                    return item["name"] == series.name;
                });
                var entry = legend.append("g");
                x += 150;
                entry.append("circle")
                    .attr("cx", x-15)
                    .attr("cy", this.height+45)
                    .attr("r", 10)
                    .attr("fill", "#" + (pad(series.color.toString(16), 6)));

                entry.append("text")
                    .text((series.name).substring(0,50))
                    .attr("dy", this.height+50)
                    .attr("dx", x);
            }
            legend.attr("transform", "translate(20,0)");
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
            var parseDate = d3.time.format("%Y-%m-%d").parse;


            for (var i = 0, len = data.length; i < len; i++) {
                var series = data[i];
                var ref = series['values'];
                if(ref)
                for (var j = 0, len1 = ref.length; j < len1; j++) {
                    var entry = ref[j];
                    entry.pdate = parseDate(entry.created);
                }
            }

            var x = d3.time.scale().range([0, this.width]);
            this.xScale = x;

            var y = d3.scale.linear().range([this.height, 0]);
            this.yScale = y;

            var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%d %b"));

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


            // Labels along the bottom
            this.root.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + this.height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "1.8em")
                .attr("dy", ".8em");

            // Labels along the left.
            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            // Horizontal grid lines
            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            this.createLegend(data, legends);
        }
    }

    export var ReportIncrementProgress = function($compile) {
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
                report = new IncrementProgress(scope, element, attrs, $compile);
                report.render();
                return scope.$watchGroup(["reportData", "project"], report.render);
            }
        };
    };
}