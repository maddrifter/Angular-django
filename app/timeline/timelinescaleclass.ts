/// <reference path='../_all.ts' />

module scrumdo {

    export class SDTimeScale{
        public totalDays: number; 
        public startDate: string;
        public endDate: string;
        public scaleWidth: number;
        public dayPixel: number;
        public element;
        public scope;
        public counter:number = 0;
        private incrementWidth:number = 330;
        private paddingLeft:number = 20;
        private svg: d3.Selection<any>;
        private scaleHeight:number = 50;
        private coords: Array<any>;
        private currentHighlightFlag: boolean;
        private compile;
        private totalIncrements: number;
        private wrapper;

        constructor(scope, element, $compile){
            this.element = element;
            this.scope = scope;
            this.compile = $compile;
            this.initData();
            this.scope.$on('$viewContentLoaded', this.onRendered);
        }

        private onRendered = () => {
            if(this.scope.ctrl.datelessMode || this.scope.ctrl.visibleIncrements == null) return;
            this.scrollToToday();
        }

        public initData(){
            if(this.scope.ctrl.datelessMode || this.scope.ctrl.visibleIncrements == null) return;
            this.counter = 0;
            this.coords = [];
            this.wrapper = $('#scrumdo-timeline-wrapper');
            this.totalIncrements = this.scope.ctrl.visibleIncrements.length;
            this.currentHighlightFlag = false;
            this.startDate = this.scope.ctrl.startDate;
            this.endDate = this.scope.ctrl.endDate;
            this.totalDays = moment(this.endDate).diff(moment(this.startDate), 'days');
            if(this.totalDays == 0) this.totalDays = 1;
            this.scaleWidth = angular.element(this.element).width()-350;
            this.scaleWidth = this.scaleWidth > (this.incrementWidth * this.totalIncrements) ? 
                                (this.incrementWidth * this.totalIncrements) : this.scaleWidth;
            this.dayPixel = this.scaleWidth/this.totalDays;
            this.drawIncrementPoins();

        }

        public getDatePixel(date){
            var day = moment(date).diff(moment(this.startDate), 'days');
            var point = (day*this.dayPixel)+this.paddingLeft;
            return point;
        }
        public getIncrementPixel(num){
            return (this.incrementWidth*num)+this.paddingLeft;
        }

        public drawIncrementPoins(){
            angular.element(this.element).empty();
            this.svg = d3.select(this.element[0]).append("svg");
            this.resizeSVG();
            _.each(this.scope.ctrl.visibleIncrements, (i:Iteration) => {
                this.drawPoint(i);
                this.counter +=1;
            });
            this.drawAxisLines();
            this.drawConnectingLine();
            this.highlightToday();
        }

        public drawPoint(i: Iteration){
            var point = this.getDatePixel(i.start_date),
                bottom = this.getIncrementPixel(this.counter),
                startDisplayDate = moment(i.start_date).format('MM/DD/YYYY'),
                endDisplayDate = moment(i.end_date).format('MM/DD/YYYY'),
                width = this.getDatePixel(i.end_date);

            this.coords.push({ id: i.id, sx:point, sy:0, ex:bottom, ey:this.scaleHeight });

            var pointHtml = `<span id='start-point-${i.id}' class='increment-start-point' style='left:${point}px'></span>`;
            pointHtml += `<span id='end-point-${i.id}' class='increment-bottom-point' style='left:${bottom}px'></span>`;

            if(this.isCurrentIncrement(i) && !this.currentHighlightFlag){
                this.currentHighlightFlag = true;
                pointHtml += `<span id='date_display_${i.id}' class='increment-date-display current' style='left:${point}px'>${startDisplayDate} - ${endDisplayDate}</span>`;
                pointHtml += `<span id='increment-highlighter-${i.id}' class="current-increment-highlighter" style='left:${point}px;width:${width-point+4}px'></span>`;
            }else{
                pointHtml += `<span id='date_display_${i.id}' class='increment-date-display' style='left:${point}px'>${startDisplayDate}</span>`;
            }
            angular.element(this.element).append(pointHtml);
        }

        public scrollToToday(){
            setTimeout( () => {
                if(this.ifNeedToScroll()) return;
                var position = this.getTodayPosition() - this.wrapper.width()/2;
                this.wrapper.animate({
                    scrollLeft: `+=${position}`
                }, 1000, 'easeOutQuad');
            }, 500);
        }

        private ifNeedToScroll(){
            var parentLeft = this.wrapper.scrollLeft();
            var parentRight = this.wrapper.width();
            var elemLeft = $('.today-highlighter').offset().left;
            return (elemLeft <= (parentLeft + parentRight -325));
        }

        private highlightToday(){
            var position = this.getTodayPosition(),
                today = moment().format('MM/DD/YYYY'),
                html = this.compile(`<span class="today-highlighter bounce" style="left:${position}px;">
                    <i uib-tooltip="Today - ${today}" class="fa fa-chevron-down" aria-hidden="true"></i></span>`)(this.scope);
            angular.element(this.element).append(html);
        }

        private getTodayPosition(){
            return this.getDatePixel(moment()) > this.scaleWidth ? this.scaleWidth+350: this.getDatePixel(moment());
        }

        public drawConnectingLine(){
            this.svg.selectAll(".node").remove();

            var node = this.svg.selectAll(".node")
                .data(this.coords)
                .enter()
                    .append("g")
                    .attr("class", "node")

            node.append("path")
                .attr('class', 'connector-line')
                .attr('id', (d) => 'increment-path-'+d.id)
                .attr('d', this.curve);
        }

        private drawAxisLines(){
            var startPoint = this.getDatePixel(this.startDate),
                endPoint = this.getDatePixel(this.endDate),
                html = "<div class='axis-lines'>";
            for(let i = startPoint; i < (endPoint+250); i+=70){
                html += `<span></span>`;
            }
            html += "</div>";
            angular.element(this.element).append(html);
        }

        public isCurrentIncrement(increment: Iteration){
            var today = moment();
            return moment(increment.start_date) <= today && moment(increment.end_date) >= today;
        }

        private curve = (data) => {
            var mid = this.scaleHeight/2;
            var midLeft = _.random(20, 40);
            return `M ${data.sx} ${data.sy}L ${data.sx} ${midLeft} ${data.ex} ${midLeft} ${data.ex} ${data.ey}`;

        }

        private resizeSVG() {
            this.svg.attr("width", this.element[0].scrollWidth + "px");
            this.svg.attr("height", this.scaleHeight+ "px");    
        }
    }
}