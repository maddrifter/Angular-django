/// <reference path='../_all.ts' />

module scrumdo {
    export class storyContextMenu {

        private $win;
        private $dom;
        private $board;
        private $plannigcolumn;
        private $modalWin;
        private windowWidth;
        private windowHeight;
        private contextMenuElm;
        private $contextMenuElm;
        private contextMenuWidth;
        private contextMenuHeight;
        private contextMenuLeftPos;
        private contextMenuTopPos;
        private caretClass: {
            topRight: string,
            topLeft: string,
            bottomRight: string,
            bottomLeft: string
        };
        private workItemName:string;
        private workItemNameP: string;

        constructor(private scope,
            public element,
            public $filter=null) {

            this.workItemName = this.scope.$root['safeTerms'].current.work_item_name;
            this.workItemNameP = pluralize(this.workItemName);
            this.$win = $(window);
            this.$dom = $(document);
            this.$board = $('.scrumdo-boards-wrapper, .planning-column-content, .scrumdo-backlog-wrapper, .inbox-group, .scrumdo-wrapper ');
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
            this.contextMenuLeftPos = 0;
            this.contextMenuTopPos = 0;
            this.caretClass = {
                topRight: 'context-caret-top-right',
                topLeft: 'context-caret-top-left',
                bottomRight: 'context-caret-bottom-right',
                bottomLeft: 'context-caret-bottom-left'
            };

            element.on('contextmenu.dirContextMenu', (e) => {
                if (!scope.$root.ctxmenus) {
                    return true;
                }
                var menuItems;
                var ctxMenue = scope.$root.ctxmenus.slice();
                var extraMenu = [];

                if (scope.$root.selectedCount > 1 && scope.$root.ctxmenus.length > 2) {
                    extraMenu = [
                        { label: `Assign Selected ${this.workItemNameP}`, action: 'assignCards', class: 'multiple line-break' },
                        { label: `Duplicate Selected ${this.workItemNameP}`, action: 'duplicateCards', class: 'multiple' },
                        { label: `Move ${this.workItemNameP} to Cell`, action: 'moveCardsToCell', class: 'multiple' },
                        { label: `Move ${this.workItemNameP} to Project/Iteration`, action: 'moveCardsToProject', class: 'multiple' },
                        { label: `Reset ${this.workItemNameP} Aging Display`, action: 'resetCardsAging', class: 'multiple' },
                        { label: `Delete Selected ${this.workItemNameP}`, action: 'deleteMultiple', class: 'multiple'}
                    ];
                    ctxMenue = extraMenu;
                }

                menuItems = ctxMenue;

                e.preventDefault();

                $('.custom-context-menu').remove();
                var fragment: DocumentFragment = document.createDocumentFragment();
                this.contextMenuElm = document.createElement('ul');
                this.$contextMenuElm = $(this.contextMenuElm);
                this.contextMenuElm.setAttribute('id', 'context-menu');
                this.contextMenuElm.setAttribute('class', 'custom-context-menu');

                menuItems.forEach((_item) => {
                    if ((typeof scope.$root.boardProject !== 'undefined'
                        && scope.$root.boardProject.backlogIterationId() !== scope.story.iteration_id)
                        || ['moveToCell', 'moveCardsToCell'].indexOf(_item.action) < 0) {

                        var li = document.createElement('li');
                        li.innerHTML = "<a>" + _item.label + "</a>";
                        if (_item.action && !_item.link) {
                            li.addEventListener('click', () => {
                                scope.$root.ctxService[_item.action](e, scope);
                                $('.custom-context-menu').remove();
                            }, false);
                        }
                        if (_item.link) {
                            li.setAttribute("class", "link");
                            li.innerHTML = "<a href='/projects/story_permalink/" + scope.story.id + "'>" + _item.label + "</a>";
                        }
                        if (_item["class"]) {
                            li.setAttribute("class", _item["class"]);
                        }
                        fragment.appendChild(li);
                    }
                });

                this.contextMenuElm.appendChild(fragment);
                document.body.appendChild(this.contextMenuElm);
                this.contextMenuWidth = this.$contextMenuElm.outerWidth(true);
                this.contextMenuHeight = this.$contextMenuElm.outerHeight(true);
                this.contextMenuLeftPos = e.pageX;
                this.contextMenuTopPos = e.pageY - this.$win.scrollTop();

                if (this.windowWidth - this.contextMenuLeftPos < this.contextMenuWidth && this.windowHeight - this.contextMenuTopPos > this.contextMenuHeight) {
                    this.contextMenuLeftPos -= this.contextMenuWidth;
                    this.$contextMenuElm.attr('class', 'custom-context-menu');
                    this.$contextMenuElm.addClass(this.caretClass.topRight);
                } else if (this.windowWidth - this.contextMenuLeftPos > this.contextMenuWidth && this.windowHeight - this.contextMenuTopPos > this.contextMenuHeight) {
                    this.$contextMenuElm.attr('class', 'custom-context-menu');
                    this.$contextMenuElm.addClass(this.caretClass.topLeft);
                } else if (this.windowHeight - this.contextMenuTopPos < this.contextMenuHeight && this.windowWidth - this.contextMenuLeftPos > this.contextMenuWidth) {
                    this.contextMenuTopPos -= this.contextMenuHeight;
                    this.$contextMenuElm.attr('class', 'custom-context-menu');
                    this.$contextMenuElm.addClass(this.caretClass.bottomLeft);
                } else if (this.windowHeight - this.contextMenuTopPos < this.contextMenuHeight && this.windowWidth - this.contextMenuLeftPos < this.contextMenuWidth) {
                    this.contextMenuTopPos -= this.contextMenuHeight;
                    this.contextMenuLeftPos -= this.contextMenuWidth;
                    this.$contextMenuElm.attr('class', 'custom-context-menu');
                    this.$contextMenuElm.addClass(this.caretClass.bottomRight);
                }

                this.$contextMenuElm.css({
                    left: this.contextMenuLeftPos,
                    top: this.contextMenuTopPos
                }).addClass('context-caret shown');

                this.$win.on('keydown.dirContextMenu', (e) => {
                    if (e.keyCode === 27) {
                        $('.custom-context-menu').remove();
                    }
                });
            });

            element.off('click.dirContextMenu').on('click.dirContextMenu', (e) => {
                $('.custom-context-menu').remove();
            });

            this.$dom.off('click.dirContextMenu').on('click.dirContextMenu', (e) => {
                if (!$(e.target).is('.custom-context-menu') && !$(e.target).parents().is('.custom-context-menu')) {
                    $('.custom-context-menu').remove();
                }
            });

            this.$win.off('scroll.dirContextMenu').on('scroll.dirContextMenu', () => {
                $('.custom-context-menu').remove();
            });

            this.$board.off('scroll.dirContextMenu').on('scroll.dirContextMenu', () => {
                $('.custom-context-menu').remove();
            });

            this.$win.on('resize.dirContextMenu', () => {
                this.windowWidth = window.innerWidth;
                this.windowHeight = window.innerHeight;
                $('.custom-context-menu').remove();
            });
        }
    }
}
