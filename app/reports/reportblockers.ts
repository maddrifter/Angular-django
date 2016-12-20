/// <reference path='../_all.ts' />

module scrumdo {

    class BlockerChart {

        public margin: { top: number, right: number, bottom: number, left: number };
        public scope;
        public attrs;
        public compile;
        public element: ng.IAugmentedJQuery;
        public root;
        public svg;
        public width: number;
        public height: number;
        public data;
        public circles;
        public moveTowardDataPosition;

        constructor(scope, element, attrs, compile) {
            this.element = element;
            this.attrs = attrs;
            this.scope = scope;
            this.compile = compile;

            this.margin = { top: 20, right: 20, bottom: 90, left: 50 };
            this.svg = d3.select(this.element[0]).append("svg");
            this.svg.attr("class", "report blockers");
            this.root = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        }

        createLegend() {
            var legend = this.root.append("g");
            var y = 0;
            var entry = legend.attr("class", "legends").append("g");

            entry.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 25)
                .attr("height", 25)
                .attr("class", "external-legend");
            entry.append("text")
                .text("External Blocker")
                .attr("dy", 15)
                .attr("dx", 35);
            entry = legend.append("g");

            entry.append("rect")
                .attr("x", 0)
                .attr("y", 35)
                .attr("width", 25)
                .attr("height", 25)
                .attr("class", "internal-legend");
            entry.append("text")
                .text("Internal Blocker")
                .attr("dy", 50)
                .attr("dx", 35);

            legend.attr("transform", "translate(" + this.margin.left  + ", 10)");
        }


        renderNoData() {
            var no_data = this.root.append("svg:text")
                .text("No data, check your report params on the left.")
                .attr("class", "no-data")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2);
            no_data.attr("x", (this.width / 2) - no_data.node().getBBox().width / 2);
        }
        
        render = () => {
            this.scope.cards = [];
            this.width = this.element.width() - this.margin.left - this.margin.right;
            this.height = Math.max(200, this.element.height() - this.margin.top - this.margin.bottom - 20);
            var ref;
            if (((ref = this.scope.reportData) != null ? ref.data : void 0) == null) {
                return;
            }
            var common = this.scope.reportData.data.blockers.common;
            var others = this.scope.reportData.data.blockers.others;
            var data = this.data = common.concat(others);
            
            this.svg.attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
                .attr("preserveAspectRatio", "none");
            
            this.root.selectAll("*").remove();
            if (data.length === 0) {
                this.renderNoData();
                return;
            }

            data.forEach((d) => {
                d.total = +d.total;
                d.age.average = +d.age.average;
            });

            var x = d3.scale.linear().range([0, this.width]);
            var y = d3.scale.linear().range([this.height, 0]);

            x.domain([0, 1 + d3.max(data, (d: any) => { return d.total; })]).nice();
            y.domain([0, 1 + d3.max(data, (d: any) => { return d.age.average; })]).nice();

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

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(tickCount)
                .tickFormat(d3.format("d"));

            var xGrid = d3.svg.axis()
                .scale(x)
                .innerTickSize(-this.height)
                .outerTickSize(0)
                .orient("bottom")
                .tickFormat("");

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html((d) => {
                    return "<span>" + d.reason + "</span>";
                });

            var force = d3.layout.force()
                .nodes(data)
                .size([this.width, this.height])
                .on("tick", this.tick)
                .charge(-10)
                .gravity(0)
                .chargeDistance(20);

            this.moveTowardDataPosition = (alpha) => {
                return (d) => {
                    d.x += (x(d.total) - d.x) * 0.1 * alpha;
                    d.y += (y(d.age.average) - d.y) * 0.1 * alpha;
                };
            }

            this.root.call(tip);

            this.root.append("text")
                .attr("text-anchor", "middle")
                .attr("x", this.width / 2)
                .attr("y", this.height + 50)
                .text("Frequency of occurance(# of blockers)");

            this.root.append("text")
                .attr("text-anchor", "middle")
                .attr("y", -45)
                .attr("x", -this.height / 2)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("Average Impact(days)");

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("transform", "translate(0," + this.height + ")")
                .attr("pointer-events", "none")
                .call(xGrid);

            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .selectAll("text")
                .attr("dx", "-0.5em");

            this.root.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + this.height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", ".5em")
                .attr("dy", "1.5em");
                
            this.createLegend();

            this.circles = this.root.append('g')
                .attr('class', 'circles')
                .selectAll(".dot")
                .data(data)
                .enter()
                .append("g")
                .append("circle")
                .attr('reason', (d) => d.reason)
                .attr("class", (d) => {
                    return d.external ? "external-legend dot" : "internal-legend dot";
                })
                .attr("r", (d) => {
                    return 12;
                })
                .attr("cx", (d) => x(d.total))
                .attr("cy", (d) => y(d.age.average))
                .on('mouseenter', tip.show)
                .on('mouseleave', tip.hide)
                .on('click', (d) => {
                    this.scope.showStories(d);
                });
            force.start();
            

        }

        tick = (e) => {
            this.circles.each(this.moveTowardDataPosition(e.alpha));
            this.circles.each(this.collide(e.alpha));
            this.circles
                .attr("cx", (d) => d.x)
                .attr("cy", (d) => d.y);
        }

        collide(alpha) {
            var quadtree = d3.geom.quadtree(this.data);
            var padding = 1;
            var radius = 6;
            return (d) => {
                var r = d.radius + radius + padding,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit((quad: any, x1, y1, x2, y2) => {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.point.radius + (1) * padding;
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }
    }


    export var ReportBlockers = function($compile) {
        return {
            restrict: 'EA',
            scope: {
                project: "=",
                reportData: "=",
                reportManager: "&",
                organizationSlug: "@",
                filters: "&",
                iteration: "="
            },
            templateUrl: STATIC_URL + "app/reports/blockercards.html",
            link: function(scope, element, attrs) {
                var report;
                var reportManager = scope.reportManager();
                trace("ReportBlocker::link");
                scope.cards = [];
                scope.epics = scope.$root.epics;
                scope.showStories = (blocker) => {
                    scope.loading = true;
                    var storyFilter;
                    if(scope.iteration != null){
                        storyFilter = { 'reason': blocker.reason.slice(0, -11), 'iteration':scope.iteration.id }
                    }else{
                        storyFilter = { 'reason': blocker.reason.slice(0, -11)} 
                    }
                    var options = _.extend(storyFilter, scope.filters());
                    reportManager.loadBlockerCards(scope.organizationSlug, scope.project.slug, options).then((result) => {
                        scope.loading = false;
                        scope.cards = result.data;
                    });
                }
                var reportElement = $(element[0].querySelector(".blocker-report"));
                report = new BlockerChart(scope, reportElement, attrs, $compile);
                report.render();
                return scope.$watchGroup(["reportData", "project"], report.render);
            }
        };
    };
}