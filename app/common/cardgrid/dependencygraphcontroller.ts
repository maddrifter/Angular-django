/// <reference path='../../_all.ts' />


module scrumdo {

    interface CurveData {
        sx:number,
        sy:number,
        ex:number,
        ey:number,
   }

    export class DependencyGraphController {
        public svg:d3.Selection<any>;
        private drawDependencies;

        public static $inject:Array<string> = [
            "$element",
            "$scope"
        ];

        constructor(private $element, private $scope) {
            // $scope.$parent.$on('cardsLoaded', _.debounce(this.onCardsChanged, 150));

            $scope.$parent.$on('cardsLoaded', this.onCardsChanged);
            $scope.$watch(this.getDependencyVersion, this.onCardsChanged);

            this.svg = d3.select($element.find(".dependency-graph")[0]).append("svg");
            this.drawDependencies = _.debounce(this._drawDependencies, 100);
            this.drawDependencies();

        }

        private lastDependencies;
        private dependencyVersion:number = 0;
        private getDependencyVersion = () => {
            let dep = this.getDepdendencyCoordinates();
            if(!angular.equals(this.lastDependencies, dep)) {
                this.lastDependencies = dep;
                this.dependencyVersion++;
            }

            return this.dependencyVersion;
        }

        private getDepdendencyCoordinates():Array<CurveData> {

            return this.$scope.dependencies.map((dependency) => {
                let from = dependency[0];
                let to = dependency[1];
                let fromElement = $(`[data-story-id="${from}"]`);
                let toElement = $(`[data-story-id="${to}"]`);

                if(fromElement.length == 0 || toElement.length == 0) return null;

                let fromOff = fromElement[0].getBoundingClientRect();
                let toOff = toElement[0].getBoundingClientRect();


                let scrollTop = this.$element.parent().scrollTop();
                let scrollLeft = this.$element.parent().scrollLeft();
                // debugger


                return {
                    sx: fromOff.left + fromOff.width + scrollLeft,
                    sy: fromOff.top - fromOff.height/2 - 70 + scrollTop,
                    ex: toOff.left + scrollLeft,
                    ey: toOff.top - toOff.height/2 - 40 + scrollTop
                }

            }).filter((d) => d!=null);

        }

        private resizeSVG() {
            this.svg.attr("width", this.$element.parent()[0].scrollWidth + "px");
            this.svg.attr("height", this.$element.parent()[0].scrollHeight + "px");
        }



        private curve(data:CurveData) {
            let mid = Math.floor((data.sx + data.ex)/2);
            return `M ${data.sx} ${data.sy}C ${mid} ${data.sy} ${mid} ${data.ey} ${data.ex} ${data.ey}`;
        }

        private onCardsChanged = () => {
            this.drawDependencies();
        }

        public _drawDependencies = () => {
            let coords;
            try {
                coords = this.getDepdendencyCoordinates();
            } catch(e) {
                return;
            }
            this.resizeSVG()

            this.svg.selectAll(".node").remove();

            var node = this.svg.selectAll(".node")
                .data(coords)
                .enter()
                    .append("g")
                    .attr("class", "node")

            node.append("circle")
                .attr("r", 3)
                .style("fill", function(d) { return "#F6764E"; })
                .attr("transform", function(d:CurveData) { return "translate(" + d.sx + "," + d.sy + ")"; });

            node.append("circle")
                .attr("r", 3)
                .style("fill", function(d) { return "#F6764E"; })
                .attr("transform", function(d:CurveData) { return "translate(" + d.ex + "," + d.ey + ")"; });

            node.append("path")
                .attr('class', (d:CurveData) => (d.ex>d.sx) ? 'connector-line' : 'backwards-connector-line')
                .attr('d', this.curve);

        }


    }
}
