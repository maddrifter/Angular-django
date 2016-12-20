/// <reference path='../_all.ts' />

module scrumdo {

    class LeadChart { 

        public margin: { top: number, right: number, bottom: number, left: number };
        public scope;
        public attrs;
        public compile;
        public element: ng.IAugmentedJQuery;
        public root;
        public svg;
        public width: number;
        public height: number;
        public storyList;
        public storyEditor;

        constructor(scope, element, attrs, compile, storyEditor) {
            this.element = element;
            this.attrs = attrs;
            this.scope = scope;
            this.compile = compile;
            this.margin = { top: 20, right: 20, bottom: 90, left: 50 };
            this.svg = d3.select(this.element[0]).append("svg");
            this.svg.attr("class", "report");
            this.root = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
            this.storyEditor = storyEditor;
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
                .text("No data, check your report params on the left.")
                .attr("class", "no-data")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2);
        }

        onBarHover = (d) => {
            var event:d3.MouseEvent = <d3.MouseEvent>d3.event;
            var x = event.x - this.margin.left;
            var storyEditor = this.storyEditor;
            var project = this.scope.project;

            if (this.storyList) {
                this.storyList.remove();
            }

            var stories = d.cards;

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
            var cards = this.storyList.append("text")
            var texts = [title, cards];
            var y = 1;

            var i, j, ref, story;
            for (i = j = 0, ref = stories.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                story = stories[i];
                var card_number= stories[i];
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
        
            d3.selectAll('.link-card').on("click", function(){
                var cardNumber = d3.select(this).attr("data-card");
                storyEditor.editStoryByNumber(cardNumber, project);
            });
        }

        render = () => {
            this.width = this.element.width() - this.margin.left - this.margin.right;
            this.height = Math.max(200, this.element.height() - this.margin.top - this.margin.bottom - 20);
            var ref;
            if (((ref = this.scope.reportData) != null ? ref.data : void 0) == null) {
                return;
            }
            var data = this.scope.reportData.data;
            var mean = 0; //this.dataset.rawData.mean
            var median = 0; //this.dataset.rawData.median
            
            this.root.selectAll("*").remove();
            if (data.length === 0) {
                this.renderNoData();
                return;
            }
            
            this.svg.attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
                .attr("preserveAspectRatio", "none");

            var x = d3.scale.linear().range([this.width, 0]);
            var y = d3.scale.linear().range([this.height, 0]);
            x.domain(d3.extent(data, (d: any) => d.column));
            y.domain([0, d3.max(data, (d: any) => d.count) + 1]);

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

            var columnWidth = Math.max(1, Math.min(50, Math.floor(this.width / (1 + d3.max(data, (d: any) => d.column)))) - 4);
            this.root.append("g")
                .attr("class", "grid-line")
                .call(yGrid);

            var t = this;
            var medianData = _.filter(data, (d: any) => d.median);
            var meanData = _.filter(data, (d: any) => d.mean);

            this.root.selectAll(".median-line")
                .data(medianData)
                .enter()
                .append("line")
                .attr("class", "median-line")
                .attr("x1", (d) => d.column * (columnWidth + 4) + columnWidth / 2 - 2)
                .attr("x2", (d) => d.column * (columnWidth + 4) + columnWidth / 2 - 2)
                .attr("y1", 0)
                .attr("y2", this.height);

            this.root.selectAll(".mean-line")
                .data(meanData)
                .enter()
                .append("line")
                .attr("class", "mean-line")
                .attr("x1", (d) => { trace(d.column); return d.column * (columnWidth + 4) + columnWidth / 2 })
                .attr("x2", (d) => d.column * (columnWidth + 4) + columnWidth / 2)
                .attr("y1", 0)
                .attr("y2", this.height);

            this.root.selectAll(".lead-bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "lead-bar")
                .attr("x", (d) => d.column * (columnWidth + 4))
                .attr("width", columnWidth)
                .attr("y", (d) => y(d.count))
                .attr("height", (d) => t.height - y(d.count))
                .on("mouseover", this.onBarHover);
                
            var maxLabelLength = 1;
            for (var i = 0, len = data.length; i < len; i++) {
                var entry = data[i];
                maxLabelLength = Math.max(maxLabelLength, entry.label.length);
            }

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
                .attr("transform", (d) => {
                    return "translate(" + (xOffset + d.column * (columnWidth + 4) + columnWidth / 2) + ", " + (t.height + yOffset) + ")";
                })
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

            this.createLegend();
            //this.renderDetail();

        }
    }

    export var ReportLead = function($compile, storyEditor) {
        return {
            restrict: 'EA',
            scope: {
                project: "=",
                reportData: "="
            },
            link: function(scope, element, attrs) {
                var report;
                trace("ReportLead::link");
                report = new LeadChart(scope, element, attrs, $compile, storyEditor);
                report.render();
                return scope.$watchGroup(["reportData", "project"], report.render);
            }
        };
    };
}