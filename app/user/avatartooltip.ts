/// <reference path='../_all.ts' /> 

module scrumdo {
    export class avatarTooltip {

        private $win;
        private $dom;
        private $board;
        private $plannigcolumn;
        private $modalWin;
        private windowWidth;
        private windowHeight;
        private avatarTipElm;
        private $avatarTipElm;
        private avatarTipWidth;
        private avatarTipHeight;
        private avatarTipLeftPos;
        private avatarTipTopPos;
        private caretClass;

        constructor(private scope,
            public element,
            public attr) {

            this.$win = $(window);
            this.$dom = $(document);
            this.$board = $('.scrumdo-boards-wrapper, .planning-column-content, .scrumdo-backlog-wrapper, .inbox-group, .scrumdo-wrapper');
            this.$plannigcolumn = $('.planning-column-content');
            this.$modalWin = $('body > .modal');
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
            this.avatarTipLeftPos = 0;
            this.avatarTipTopPos = 0;
            this.caretClass = {
                topRight: 'context-caret-top-right',
                topLeft: 'context-caret-top-left',
                bottomRight: 'context-caret-bottom-right',
                bottomLeft: 'context-caret-bottom-left'
            };

            element.addClass('avatar-tooltip').css('cursor', 'pointer');

            element.on('click', (e: MouseEvent) => {
                e.preventDefault();
                $('.avatar-tooltip-holder').remove();
                var fragment: DocumentFragment = document.createDocumentFragment();
                this.avatarTipElm = document.createElement('div');
                this.$avatarTipElm = $(this.avatarTipElm);
                this.avatarTipElm.setAttribute('id', 'avatar-tooltip-holder');
                this.avatarTipElm.setAttribute('class', 'avatar-tooltip-holder');

                var avatarHtmlWrapper: HTMLElement = document.createElement('div');
                avatarHtmlWrapper.setAttribute('class', 'avatar-tooltip-inner');
                var avatarHtml: string = "";

                var users = scope.story ? scope.story.assignee : [scope.user];
                for (var i = 0, len = users.length; i < len; i++) {
                    var user = users[i];
                    avatarHtml += "<div class='row'><div class='col-xs-4'><div class='avatar-img' style='background:url(\"/avatar/avatar/" +
                        attr.size + "/" + user.username + "\") 50% 100% / cover no-repeat'>";
                    avatarHtml += "<img src='/avatar/avatar/64/" + user.username + "' /></div></div><div class='col-xs-8 avatar-info'>";
                    if (user.first_name !== "" || user.last_name !== "") {
                        avatarHtml += "<p class='fullname'>" + user.first_name + " " + user.last_name + "</p>";
                    }
                    avatarHtml += "<p class='username'>@" + user.username + "</p></div></div>";
                }

                avatarHtmlWrapper.innerHTML = avatarHtml;
                fragment.appendChild(avatarHtmlWrapper);

                this.avatarTipElm.appendChild(fragment);
                document.body.appendChild(this.avatarTipElm);
                this.avatarTipWidth = this.$avatarTipElm.outerWidth(true);
                this.avatarTipHeight = this.$avatarTipElm.outerHeight(true);

                this.avatarTipLeftPos = e.pageX;
                this.avatarTipTopPos = e.pageY - this.$win.scrollTop();

                if (this.windowWidth - this.avatarTipLeftPos < this.avatarTipWidth && this.windowHeight - this.avatarTipTopPos > this.avatarTipHeight) {
                    this.avatarTipLeftPos -= this.avatarTipWidth;
                    this.$avatarTipElm.addClass(this.caretClass.topRight);
                } else if (this.windowWidth - this.avatarTipLeftPos > this.avatarTipWidth && this.windowHeight - this.avatarTipTopPos > this.avatarTipHeight) {
                    this.$avatarTipElm.addClass(this.caretClass.topLeft);
                } else if (this.windowHeight - this.avatarTipTopPos < this.avatarTipHeight && this.windowWidth - this.avatarTipLeftPos > this.avatarTipWidth) {
                    this.avatarTipTopPos -= this.avatarTipHeight;
                    this.$avatarTipElm.addClass(this.caretClass.bottomLeft);
                } else if (this.windowHeight - this.avatarTipTopPos < this.avatarTipHeight && this.windowWidth - this.avatarTipLeftPos < this.avatarTipWidth) {
                    this.avatarTipTopPos -= this.avatarTipHeight;
                    this.avatarTipLeftPos -= this.avatarTipWidth;
                    this.$avatarTipElm.addClass(this.caretClass.bottomRight);
                }

                this.$avatarTipElm.css({
                    left: this.avatarTipLeftPos,
                    top: this.avatarTipTopPos
                }).addClass('context-caret shown');

                this.$avatarTipElm.on('mousedown.dirAvatarTooltip', (e: MouseEvent) => {
                    e.stopPropagation();
                });

                this.$dom.one('mousedown.dirAvatarTooltip', () => {
                    this.$avatarTipElm.remove();
                });

                this.$dom.one('contextmenu.dirAvatarTooltip', () => {
                    this.$avatarTipElm.remove();
                });

                this.$win.one('scroll.dirAvatarTooltip', () => {
                    this.$avatarTipElm.remove();
                });

                this.$board.one('scroll.dirAvatarTooltip', () => {
                    this.$avatarTipElm.remove();
                });

                this.$modalWin.one('scroll.dirAvatarTooltip', () => {
                    this.$avatarTipElm.remove();
                });

                this.$win.one('resize.dirAvatarTooltip', () => {
                    this.windowWidth = window.innerWidth;
                    this.windowHeight = window.innerHeight;
                    this.$avatarTipElm.remove();
                });
            });
        }
    }
}