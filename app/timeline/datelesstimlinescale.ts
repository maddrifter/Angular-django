/// <reference path='../_all.ts' />

module scrumdo {

    export class SDDatelessTimeScale{
        public totalDays: number; 
        public startDate: moment.Moment;
        public endDate: moment.Moment;
        public scaleWidth: number;
        public dayPixel: number;
        public element;
        public scope;
        public counter:number = 0;
        private incrementWidth:number = 317;
        private scaleHeight:number = 50;
        private coords: Array<any>;
        private currentHighlightFlag: boolean;
        private compile;
        private wrapper;

        constructor(scope, element, $compile){
            this.element = element;
            this.scope = scope;
            this.compile = $compile;
            this.initData();
        }

        public initData(){
            this.counter = 0;
            this.coords = [];
            this.wrapper = $('#scrumdo-timeline-wrapper');
            this.currentHighlightFlag = false;
            this.startDate = moment(this.scope.ctrl.startDate).startOf("month");
            this.endDate = moment(this.scope.ctrl.endDate).endOf("month");
            this.totalDays = moment(this.endDate).diff(moment(this.startDate), 'days');
            if(this.totalDays == 0) this.totalDays = 1;
            this.scaleWidth = this.scope.ctrl.months.length*this.incrementWidth;
            this.dayPixel = this.scaleWidth/this.totalDays;
            this.drawIncrementPoins();
            this.scrollToToday();

        }

        public getDatePixel(date){
            var day = moment(date).diff(moment(this.startDate), 'days');
            var point = (day*this.dayPixel);
            return point;
        }
        public getIncrementPixel(num){
            return (this.incrementWidth*num);
        }

        public drawIncrementPoins(){
            angular.element(this.element).empty();
            _.each(this.scope.ctrl.months, (i:any) => {
                this.drawPoint(i);
                this.counter +=1;
            });
            this.drawAxisLines();
            this.highlightToday();
        }

        public drawPoint(i){
            var start_date = moment([i.year, i.number]),
                end_date = moment(start_date).endOf('month'),
                point = this.getDatePixel(start_date),
                startDisplayDate = moment(start_date).format('MMM-YYYY'),
                endDisplayDate = moment(end_date).format('MMM-YYYY'),
                width = this.getDatePixel(end_date),
                className = this.counter%2 == 0 ? 'even':'odd';
            
            var pointHtml = `<span class='increment-start-point ${className}' style='left:${point}px'></span>`;

            if(this.isCurrentIncrement(i) && !this.currentHighlightFlag){
                this.currentHighlightFlag = true;
                pointHtml += `<span class='increment-date-display current' style='left:${point}px'>${startDisplayDate} - ${endDisplayDate}</span>`;
                pointHtml += `<span class="current-increment-highlighter" style='left:${point}px;width:${width-point+4}px'></span>`;
            }else{
                pointHtml += `<span class='increment-date-display' style='left:${point}px'>${startDisplayDate}</span>`;
            }
            angular.element(this.element).append(pointHtml);
        }

        public scrollToToday = () => {
            setTimeout( () => {
                if(this.ifNeedToScroll()) return;
                var position = this.getDatePixel(moment()) - this.wrapper.width()/2;
                this.wrapper.animate({
                    scrollLeft: `+=${position}`
                }, 1000, 'easeOutQuad');
            }, 500)
        }

        private ifNeedToScroll(){
            var parentLeft = this.wrapper.scrollLeft();
            var parentRight = this.wrapper.width();
            var elemLeft = $('.today-highlighter').offset().left;
            return (elemLeft <= (parentLeft + parentRight));
        }

        private highlightToday(){
            var position = this.getDatePixel(moment()),
                today = moment().format('MM/DD/YYYY'),
                html = this.compile(`<span class="today-highlighter bounce" style="left:${position}px;">
                    <i uib-tooltip="Today - ${today}" class="fa fa-chevron-down" aria-hidden="true"></i></span>`)(this.scope);
            angular.element(this.element).append(html);
        }

        private drawAxisLines(){
            var startPoint = this.getDatePixel(this.startDate),
                endPoint = this.getDatePixel(this.endDate),
                html = "<div class='axis-lines'>";
            for(let i = startPoint; i < (endPoint-70); i+=70){
                html += `<span></span>`;
            }
            html += "</div>";
            angular.element(this.element).append(html);
        }

        public isCurrentIncrement(m){
            var month = moment().get("month");
            return m.number == month;
        }

        private curve = (data) => {
            var mid = this.scaleHeight/2;
            var midLeft = _.random(20, 40);
            return `M ${data.sx} ${data.sy}L ${data.sx} ${midLeft} ${data.ex} ${midLeft} ${data.ex} ${data.ey}`;

        }
    }
}