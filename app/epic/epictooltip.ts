/// <reference path='../_all.ts' />

module scrumdo {
    export class epicTooltip {
        /*        
        public static $inject:Array<string> = [
            "$scope",
            "element",
            "attr"
        ];
        */

        private $win;
        private $dom;
        private $board;
        private $modalWin;
        private windowWidth;
        private windowHeight;
        private toolTipElm;
        private $toolTipElm;
        private toolTipWidth;
        private toolTipHeight;
        private toolTipLeftPos;
        private toolTipTopPos;
        private caretClass;

        constructor(private scope,
            public element,
            public attr) {

            this.$win = $(window);
            this.$dom = $(document);
            this.$board = $('.scrumdo-boards-wrapper, .planning-column-content, .scrumdo-backlog-wrapper');
            this.$modalWin = $('body > .modal');
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
            this.toolTipElm;
            this.$toolTipElm;
            this.toolTipWidth;
            this.toolTipHeight;
            this.toolTipLeftPos = 0;
            this.toolTipTopPos = 0;
            this.caretClass = {
                topRight: 'context-caret-top-right',
                topLeft: 'context-caret-top-left',
                bottomRight: 'context-caret-bottom-right',
                bottomLeft: 'context-caret-bottom-left'
            };

            element.addClass('avatar-tooltip').css('cursor', 'pointer');

            element.on('click', (e: MouseEvent) => {
                var fragment: DocumentFragment;

                e.preventDefault();
                $('.avatar-tooltip-holder').remove();
                fragment = document.createDocumentFragment();
                this.toolTipElm = document.createElement('div');
                this.$toolTipElm = $(this.toolTipElm);
                this.toolTipElm.setAttribute('id', 'avatar-tooltip-holder');
                this.toolTipElm.setAttribute('class', 'avatar-tooltip-holder');

                scope.ctrl.fetchEpics().then((e) => {
                    var epicHtml = scope.ctrl.epicToolTipHtml();
                    $('.avatar-tooltip-inner .epicToolTip').html(epicHtml);
                    $('p', '.avatar-tooltip-inner .epicToolTip').each(function(index){
                        $(this).css({ marginLeft: (index * 10) + "px" });
                    });
                });

                var tooltipHtml, tooltipHtmlWrapper;
                tooltipHtmlWrapper = document.createElement('div');
                tooltipHtmlWrapper.setAttribute('class', 'avatar-tooltip-inner');
                tooltipHtml = "";
                tooltipHtml += "<div class='row'>";
                tooltipHtml += "<div class='col-xs-12 epicToolTip'>Loading...</div>";
                tooltipHtml += "</div>";
                tooltipHtmlWrapper.innerHTML = tooltipHtml;
                fragment.appendChild(tooltipHtmlWrapper);

                this.toolTipElm.appendChild(fragment);
                document.body.appendChild(this.toolTipElm);
                this.toolTipWidth = this.$toolTipElm.outerWidth(true);
                this.toolTipHeight = this.$toolTipElm.outerHeight(true);
                this.toolTipLeftPos = e.pageX;
                this.toolTipTopPos = e.pageY - this.$win.scrollTop();

                if (this.windowWidth - this.toolTipLeftPos < this.toolTipWidth && this.windowHeight - this.toolTipTopPos > this.toolTipHeight) {
                    this.toolTipLeftPos -= this.toolTipWidth;
                    this.$toolTipElm.addClass(this.caretClass.topRight);
                } else if (this.windowWidth - this.toolTipLeftPos > this.toolTipWidth && this.windowHeight - this.toolTipTopPos > this.toolTipHeight) {
                    this.$toolTipElm.addClass(this.caretClass.topLeft);
                } else if (this.windowHeight - this.toolTipTopPos < this.toolTipHeight && this.windowWidth - this.toolTipLeftPos > this.toolTipWidth) {
                    this.toolTipTopPos -= this.toolTipHeight;
                    this.$toolTipElm.addClass(this.caretClass.bottomLeft);
                } else if (this.windowHeight - this.toolTipTopPos < this.toolTipHeight && this.windowWidth - this.toolTipLeftPos < this.toolTipWidth) {
                    this.toolTipTopPos -= this.toolTipHeight;
                    this.toolTipLeftPos -= this.toolTipWidth;
                    this.$toolTipElm.addClass(this.caretClass.bottomRight);
                }

                this.$toolTipElm.css({
                    left: this.toolTipLeftPos,
                    top: this.toolTipTopPos
                }).addClass('context-caret shown');

                this.$toolTipElm.on('mousedown.dirEpicTooltip', (e) => {
                    e.stopPropagation()
                });

                this.$dom.one('mousedown.dirEpicTooltip', () => {
                    this.$toolTipElm.remove();
                });

                this.$dom.one('contextmenu.dirEpicTooltip', () => {
                    this.$toolTipElm.remove();
                });

                this.$win.one('scroll.dirEpicTooltip', () => {
                    this.$toolTipElm.remove();
                });

                this.$board.one('scroll.dirEpicTooltip', () => {
                    this.$toolTipElm.remove();
                });

                this.$modalWin.one('scroll.dirEpicTooltip', () => {
                    this.$toolTipElm.remove();
                });

                this.$win.one('resize.dirEpicTooltip', () => {
                    this.windowWidth = window.innerWidth;
                    this.windowHeight = window.innerHeight;
                    this.$toolTipElm.remove()
                });
            });
        }
    }
}