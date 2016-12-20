/// <reference path='../_all.ts' />

module scrumdo {
    export class SpiderChart {
        public static $inject:Array<string> = [
            "$element",
            "$scope"
        ];

        constructor(private $element, private $scope) {
            setTimeout(this.render);
            this.$scope.$watch("highlight", this.render)
        }

        public score() {
            if(!this.$scope.highlight) return '';

            return `Score: ${riskScore(this.$scope.highlight).toFixed(2)}`;
        }

        private riskToAxis = (risk) => {
            const r = [];

            this.$scope.portfolio.risk_types.forEach((riskType, index)=>{
                if(riskType != '') {
                    r.push({
                        id: risk.id,
                        axis: riskType,
                        value: risk.probability / 100 * (1+risk['severity_' + (index + 1)])
                    });
                }
            })

            return r;
        }

        public render = () => {
            if(!this.$scope.risks || this.$scope.risks.length == 0) return;
            trace("Rendering spider chart");

            var margin = {top: 35, right: 35, bottom: 35, left: 35},
                width = this.$element.parent().width()-70,
                height = this.$element.parent().width()-70;

            var data = this.$scope.risks.map(this.riskToAxis);

            // var color = d3.scale.ordinal().range(SCRUMDO_BRIGHT_COLORS)
            var color = (risk) =>  {
                if(risk.hasOwnProperty('id')) return SCRUMDO_BRIGHT_COLORS[risk.id % SCRUMDO_BRIGHT_COLORS.length];

                return SCRUMDO_BRIGHT_COLORS[risk[0].id % SCRUMDO_BRIGHT_COLORS.length]
            }



            var radarChartOptions = {
                w: width,
                h: height,
                margin: margin,
                maxValue: 0.5,
                levels: 3,
                roundStrokes: false,
                color: color,
                labelFactor: 1.1,
                opacityArea: 0,
                highlight: this.$scope.highlight && this.$scope.highlight.id
            };


            RadarChart(".spider-chart", data, radarChartOptions);
        }

    }
}