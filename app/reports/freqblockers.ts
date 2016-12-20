/// <reference path='../_all.ts' />

module scrumdo {

    function shortReason(value:string, max:number){
        if (value.length <= max) return value;
        value = value.substr(0, max);
        return value + (' …');
    }

    function checkForBlocker(blockers, blocker){
        var r:any = _.countBy(blockers, (d:any) => { return (d.reason==blocker.reason && d.id != blocker.id && 
                d.age == blocker.age && d.external == blocker.external) ? 'match':'nomatch' });
        return r;
    }

    function getReason(blocker):string{
        var ex = (blocker.external ? "(External)": "(Internal)"); 
        return blocker.reason+" "+ex;
    }

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
        public rects;
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
                .attr("width", 20)
                .attr("height", 20)
                .attr("class", "external-legend");
            entry.append("text")
                .text("External Blocker")
                .attr("dy", 15)
                .attr("dx", 25);
            entry = legend.append("g");

            entry.append("rect")
                .attr("x", 165)
                .attr("y", 0)
                .attr("width", 20)
                .attr("height", 20)
                .attr("class", "internal-legend");
            entry.append("text")
                .text("Internal Blocker")
                .attr("dy", 15)
                .attr("dx", 190);

            legend.attr("transform", "translate(" + this.margin.left  + ", -20)");
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

            var data = this.data = this.scope.reportData.data;
            this.svg.attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
                .attr("preserveAspectRatio", "none");
            
            this.root.selectAll("*").remove();
            if (data.length === 0) {
                this.renderNoData();
                return;
            }
            var graphHeight = this.height*0.8;
            var y = d3.scale.linear().range([graphHeight, 0]);
            var x = d3.scale.ordinal();

            x.domain(data.map((d :any) => { return getReason(d); })).rangeBands([0, this.width]);
            y.domain([0, 1 + d3.max(data, (d:any) => { return d.age;})]);

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
                .ticks(tickCount);

            var xGrid = d3.svg.axis()
                .scale(x)
                .innerTickSize(-graphHeight)
                .outerTickSize(0)
                .orient("bottom")
                .tickFormat("");

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html((d) => {
                    var sameBlocker = checkForBlocker(this.data, d);
                    if(sameBlocker["match"] != null && sameBlocker["match"] > 0){
                        return "<span>" + d.reason + " ("+ (sameBlocker["match"]+1) +")</span>";
                    }else{
                        return "<span>" + d.reason + "</span>";
                    }
                });

            this.root.call(tip);

            this.root.append("text")
                .attr("text-anchor", "middle")
                .attr("y", -45)
                .attr("x", -graphHeight / 2)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("Days");

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("pointer-events", "none")
                .call(yGrid);

            this.root.append("g")
                .attr("class", "grid-line")
                .attr("transform", "translate(0," + graphHeight + ")")
                .attr("pointer-events", "none")
                .call(xGrid);

            this.root.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .selectAll("text")
                .attr("dx", "-0.5em");

            this.root.append("g")
                .attr("class", "x axis xAxis")
                .attr("transform", "translate(0," + graphHeight + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("class", "xlabels")
                .style("text-anchor", "end")
                .attr("dx", "1.5em")
                .attr("dy", "0em")
                .attr("transform", (d) =>
                    "rotate(90)"
                )
                .style("text-anchor", "start")
                .call(this.wrap);

            this.createLegend();

            this.rects = this.root.append('g')
                .attr('class', 'rects')
                .selectAll(".dot")
                .data(data)
                .enter()
                .append("g")
                .append("rect")
                .attr('reason', (d) => getReason(d))
                .attr("class", (d) => {
                    return d.external ? "external-legend dot" : "internal-legend dot";
                })
                .attr("height", (d) => {
                    var yStep = y(0) - y(1);
                    return 10 > yStep ? yStep : 10;
                })
                .attr("width", (d) => {
                    return this.getRectWidth(d, x);
                })
                .attr("x", (d) => (x(getReason(d))))
                .attr("y", (d) => y(d.age)) 
                .attr("transform", (d) => {
                    var tr = (x.rangeBand()/2 - (this.getRectWidth(d, x)/2))
                    return "translate("+ tr +", -10)"
                })
                .on('mouseenter', tip.show)
                .on('mouseleave', tip.hide)
                .on('click', (d) => {
                    this.scope.showStories(d);
                });
        }

        getRectWidth = (d, x) => {
            var sameBlocker = checkForBlocker(this.data, d);
            if(sameBlocker["match"] != null && sameBlocker["match"] > 0){
                var total = sameBlocker["match"]+1;
                return total*20 > x.rangeBand()?x.rangeBand():total*20;
            }else{
                return 20;
            }
        }

        wrap = (text) => {
            text.each(function() {
                var text = d3.select(this);
                var reason = text.text();
                var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", 0);
                tspan.text(shortReason(reason, 30));
            });
        }
    }

    export var FreqBlockers = function($compile) {
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
                        storyFilter = { 'reason': blocker.reason, 'iteration':scope.iteration.id }
                    }else{
                        storyFilter = { 'reason': blocker.reason}
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
