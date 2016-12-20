/// <reference path='../_all.ts' />

module scrumdo {

    var SCROLL_MARGIN:number = 30;
    var INTERVAL_DELAY:number = 15;
    var STEP_AMOUNT:number = 8;

    export function autoscrollVerticalDirective($interval:ng.IIntervalService) {
        var currentInterval;
        var lastY = NaN;

        function clearScroll() {
            if(currentInterval != null) {
                $interval.cancel(currentInterval);
                currentInterval = null;
            }
        }

        function onMouseMove(event) {
            var offset = $(this).offset();
            var y:number = event.originalEvent.pageY - offset.top;

            if(y == lastY){return;}
            lastY = y;

            var target:Element = event.currentTarget;
            var height:number = target.clientHeight;

            clearScroll();
            if(y < SCROLL_MARGIN && y >= 0) {
                currentInterval = $interval(function(){
                    target.scrollTop -= STEP_AMOUNT;
                }, INTERVAL_DELAY, 0, false);
            }
            else if(y <= height && y > (height-SCROLL_MARGIN)) {
                currentInterval = $interval(function () {
                    target.scrollTop += STEP_AMOUNT;
                }, INTERVAL_DELAY, 0, false);
            }
        }


        return function(scope:ng.IScope, element:ng.IAugmentedJQuery, attrs:ng.IAttributes) {
            scope.$on('cardDragStart', function() {
                element.on('dragover', onMouseMove);
                element.on('mouseout', clearScroll);
                element.on('mouseup', clearScroll);
            });

            scope.$on('cardDragStop', function() {
                clearScroll();
                element.off('dragover', onMouseMove);
                element.off('mouseout', clearScroll);
                element.off('mouseup', clearScroll);
            });
        }
    }


    export function autoscrollHorizontalDirective($interval:ng.IIntervalService) {
        var currentInterval;
        var lastX = NaN;

        function clearScroll() {
            if(currentInterval != null) {
                $interval.cancel(currentInterval);
                currentInterval = null;
            }
        }

        function onMouseMove(event) {
            var offset = $(this).offset();
            var x:number = event.originalEvent.pageX - offset.left;

            if(x == lastX){return;}
            lastX = x;

            var target:Element = event.currentTarget;
            var width:number = target.clientWidth;

            clearScroll();
            if(x < SCROLL_MARGIN && x >= 0) {
                currentInterval = $interval(function(){
                    target.scrollLeft -= STEP_AMOUNT;
                }, INTERVAL_DELAY, 0, false);
            }
            else if(x <= width && x > (width-SCROLL_MARGIN)) {
                currentInterval = $interval(function () {
                    target.scrollLeft += STEP_AMOUNT;
                }, INTERVAL_DELAY, 0, false);
            }
        }


        return function(scope:ng.IScope, element:ng.IAugmentedJQuery, attrs:ng.IAttributes) {
            scope.$on('cardDragStart', function() {
                element.on('dragover', onMouseMove);
                element.on('mouseout', clearScroll);
                element.on('mouseup', clearScroll);
            });

            scope.$on('cardDragStop', function() {
                clearScroll();
                element.off('dragover', onMouseMove);
                element.off('mouseout', clearScroll);
                element.off('mouseup', clearScroll);
            });
        }
    }

    autoscrollVerticalDirective.$inject = ["$interval"];
    autoscrollHorizontalDirective.$inject = ["$interval"];
}