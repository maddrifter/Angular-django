/// <reference path='../_all.ts' />
interface magicTab {
    pattern: RegExp,
    className: string
}

module scrumdo {
    export class StoryController {
        public static $inject: Array<string> = [
            "$scope",
            "$attrs",
            "$element",
            "storyEditor",
            "$timeout",
            "urlRewriter",
            "storyPriorityService",
            "extrasManager",
            "teamAssignService",
            "organizationSlug",
            "milestoneProgressPopupService",
            "contextMenuService",
            "userService",
            "epicManager",
            "confirmService",
            "$state",
            "$filter"
        ];

        public priorityMode: boolean = false;
        public milestoneAssignments = null;
        public detailVisible: boolean;
        public templateName: string;
        public listLayout: boolean;
        public tasksLayout: boolean;
        public teamLayout: boolean;
        public fullLayout: boolean;
        public cardpickerLayout: boolean;
        public dependencyLayout: boolean;
        public foundEpic;
        public epicIdToFind;
        public nestedEpics: Array<any>;
        public assigneeTooltip;
        public removeDependancy :boolean = true;
        public contextMenu:storyContextMenu;
        private canWrite: boolean;
        public workItemName:string;
        public workTypeName:string;

        public magicTags: Array<magicTab> = [
            { pattern: /^blocke[rd]$/i, className: "story-tag-blocked" },
            { pattern: /^urgent$/i, className: "story-tag-urgent" },
            { pattern: /^spike$/i, className: "story-tag-spike" },
            { pattern: /^public$/i, className: "story-tag-public" },
        ]

        constructor(
            public scope,
            public attrs,
            public element: ng.IAugmentedJQuery,
            public storyEditor: StoryEditor,
            public timeout: ng.ITimeoutService,
            public urlRewriter: URLRewriter,
            public storyPriorityService: StoryPriorityService,
            public extrasManager: ExtrasManager,
            public teamAssignService: TeamAssignService,
            public organizationSlug: string,
            public milestoneProgressPopupService: MilestoneProgressPopupService,
            public contextMenuService: contextMenuService,
            public userService: UserService,
            public epicManager: EpicManager,
            public confirmService: ConfirmationService,
            private $state:ng.ui.IStateService,
            private $filter) {

            this.scope.ctrl = this;
            this.scope.$root.ctxService = this.contextMenuService;
            this.setAssigneeTooltip();
            this.scope.$watch("layout", this.setLayout);
            this.scope.$on("selectAll", this.select);
            this.scope.$on("selectNone", this.unselect);
            this.scope.$on('priorityMode', this.setPriorityMode);
            this.templateName = '';
            this.priorityMode = storyPriorityService.priorityMode;
            this.detailVisible = false;
            this.canWrite = this.userService.canWrite(this.scope.story.project_slug);


            if(this.scope.$root['safeTerms'] == null){
                this.scope.$root['safeTerms'] = {"children": {"work_item_name": "Card", "time_period_name": "Iteration"}, 
                                                "current": {"work_item_name": "Card", "time_period_name": "Iteration"}};
            }
            if(["app.iteration.teamplanningteam", "app.iteration.dependencies"].indexOf(this.$state.current.name) > -1){
                this.workItemName = this.scope.$root['safeTerms'].children.work_item_name;
                this.workTypeName = this.scope.$root['safeTerms'].children.time_period_name;
            }else{
                this.workItemName = this.scope.$root['safeTerms'].current.work_item_name;
                this.workTypeName = this.scope.$root['safeTerms'].current.time_period_name;
            }

            if (this.scope.project) {
                if (this.userService.canWrite(this.scope.project.slug)) {
                    this.scope.$root.ctxmenus = [
                        { label: `Edit ${this.workItemName}`, action: 'editCard' },
                        { label: `Assign ${this.workItemName}`, action: 'assignCard' },
                        { label: `Add Attachment`, action: 'addAttachments' },
                        { label: `View Tasks`, action: 'openTasks' },
                        { label: `Planning Poker`, action: 'playPoker' },
                        { label: `Track Time`, action: 'trackTime' },
                        { label: `Duplicate ${this.workItemName}`, action: 'duplicateCard' },
                        { label: `Move to Cell`, action: 'moveToCell' },
                        { label: `Move to Project/Iteration`, action: 'moveToProject' },
                        { label: `Reset Aging Display`, action: 'resetCardAging'},
                        { label: `Delete ${this.workItemName}`, action: 'deleteCard'},
                        { label: `${this.workItemName} Permalink`, action: 'copyPermalink', link: true }
                    ];
                } else {
                    this.scope.$root.ctxmenus = [
                        { label: `View ${this.workItemName}`, action: 'editCard' },
                        { label: `${this.workItemName} Permalink`, action: 'copyPermalink', link: true }
                    ];
                }
            }


            let doContext = element.attr('story-context-menu');
            if(doContext != null) {
                this.contextMenu = new storyContextMenu(scope, element);
            }


        }

        onAssign() {
            return this.teamAssignService.assignTeam([this.story()], this.scope.project);
        }

        removeDependency(story) {
            this.scope.$root.$broadcast("dependencyRemoved", story);
        }

        openExternalLink() {
            this.extrasManager.loadForStory(this.scope.project.slug, this.story().id).then((result) => {
                if (result.length > 0) {
                    var url = result[0].external_url;
                    window.open(url, '_blank');
                }
            });
        }

        setPriorityMode = (event, priority) => {
            this.priorityMode = priority;
            this.setLayout();
        }

        getCardClass() {
            var story = this.story();
            if (typeof story === "undefined" || story === null) {
                return '';
            }
            var cardClasses = "";
            cardClasses += (story.selected ? ' selected' : '');
            cardClasses += (this.listLayout ? ' story-list-style' : '');
            if ((this.scope.project != null) && !this.userService.canWrite(this.scope.project.slug)) {
                cardClasses += ' read-only';
            }
            cardClasses += this.isCardBlockedUrgent(story.tags_list);
            cardClasses += story.blocked ? ' card-blocked' : '';

            if (this.cardpickerLayout || this.dependencyLayout)
                cardClasses += ' noselect ';
            return cardClasses;
        }

        isCardBlockedUrgent(tags) {
            var blocked, classes, i, len, tag, urgent;
            if (typeof tags === "undefined" || tags === null) {
                return '';
            }
            blocked = /^blocke[rd]$/i;
            urgent = /^urgent$/i;
            classes = "";
            for (i = 0, len = tags.length; i < len; i++) {
                tag = tags[i];
                if (blocked.test(tag)) {
                    classes += ' card-blocked';
                }
                if (urgent.test(tag)) {
                    classes += ' card-urgent';
                }
            }
            return classes;
        }

        tagClass(tag) {
            var i, len, magic;
            if (!tag) {
                return "";
            }
            for (i = 0, len = this.magicTags.length; i < len; i++) {
                magic = this.magicTags[i];
                if (magic["pattern"].test(tag)) {
                    return magic["className"];
                }
            }
            return "";
        }

        setAssigneeTooltip() {
            if (!((this.scope.story != null) && (this.scope.story.assigee != null))) {
                return;
            }
            var userlist = (function() {
                var i, len, ref, results;
                ref = this.scope.story.assignee;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var a = ref[i];
                    results.push(shortuser(a));
                }
                return results;
            }).call(this);

            this.assigneeTooltip = userlist.join("<br/>");
        }

        setLayout = () => {
            var layout = this.scope.layout;
            if (layout == null) {
                layout = 'normal';
            }
            if (layout === 'dependantlist') {
                this.removeDependancy = false;
                layout = 'dependencylist';
            }
            var priority = this.priorityMode ? "_priority" : "";
            this.templateName = this.urlRewriter.rewriteAppUrl("story/story_" + layout + priority + ".html");
            this.listLayout = layout === 'list';
            this.tasksLayout = layout === 'tasks';
            this.teamLayout = layout === 'team';
            this.fullLayout = !(this.listLayout || this.tasksLayout);
            this.cardpickerLayout = layout === 'cardpicker';
            this.dependencyLayout = layout === 'dependencylist';
        }

        onChecked = () => {
            this.scope.$emit("selectionChanged");
        }

        select = () => {
            if (!this.story().selected) {
                this.story().selected = true;
                this.scope.$emit("selectionChanged");
            }
        }

        unselect = () => {
            if (this.story().selected) {
                this.story().selected = false;
                this.scope.$emit("selectionChanged");
            }
        }

        onMouseDown = (event: MouseEvent) => {
            trace("Story mouse down");
            if (!(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
                if (!this.story().selected) {
                    this.scope.$emit("singleStoryClicked");
                    // If we have several stories selected, then we start to drag an unrelated one,
                    // we want to deselect the others, this helps that.
                }
            }
        }

        onDoubleClick = (event: MouseEvent) => {
            this.onEdit();
        }

        onClicked = (event) => {
            trace("Story clicked");
            if (event.isDefaultPrevented()) {
                return;
            }
            if ((typeof event !== "undefined" && event !== null) && ((event.target.nodeName === 'A') || event.target.hasAttribute('ng-click'))) {
                return;
            }
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
                this.story().selected = !this.story().selected;
                this.scope.$emit("selectionChanged");
            } else {
                if (!this.story().selected) {
                    this.toggleDetail();
                }
                this.scope.$emit("singleStoryClicked");
            }
        }

        toggleDetail() {
            if (this.story().detail.length > 1) {
                this.detailVisible = !this.detailVisible;
            }
        }

        story() {
            return this.scope.story;
        }

        css() {
            var story = this.story();
            return (story.selected ? ' story-selected' : '') + (this.listLayout ? ' story-style-list' : '');
        }

        onEdit() {
            this.storyEditor.editStory(this.scope.story, this.scope.project);
        }

        openTasks() {
            this.storyEditor.editStory(this.scope.story, this.scope.project, true);
        }

        attachFile() {
            trace("attachFile");
        }

        onMilestoneProgress = () => {
            this.milestoneProgressPopupService.showProgress(this.scope.story);
        }

        fetchEpics() {
            this.nestedEpics = [];
            var p = this.epicManager.loadEpics(this.organizationSlug, this.scope.story.project_slug).then((e) => {
                var epics = this.epicManager.toNested(e)
                this.buildEpicTree(epics, this.scope.story.epic.id)
            });
            return p;
        }

        epicToolTipHtml() {
            var epicToolTip = "";
            var ref = this.nestedEpics.reverse();
            for (var i = 0, len = ref.length; i < len; i++) {
                var epic = ref[i];
                var epicSummary = epic.indentedSummary.replace(/^([\s\S]{100}\S*)[\s\S]*/, "$1").replace(new RegExp("(#E\\d+\\s)"), "<strong>$1</strong> ");
                epicToolTip += "<p>" + epicSummary + "</p>";
            }

            return epicToolTip;
        }

        buildEpicTree(epics, id) {
            this.epicIdToFind = id;
            var counter = 0;
            while (true) {
                this.findEpicById(epics, this.epicIdToFind);
                if (this.foundEpic.parent_id === null || counter > 1000) {
                    break;
                }
                counter++;
            }
        }

        findEpicById(epics, id) {
            _.each(epics, (e: any) => {
                if (e.id === id) {
                    this.foundEpic = e;
                    this.nestedEpics.push(e);
                    this.epicIdToFind = e.parent_id;
                }

                if (e.children.length > 0) {
                    this.findEpicById(e.children, id);
                }
            });
        }

        trackByTagIdName = (index, tag) => {
            return index + "_" + tag;
        }

        // code related to portfolio type cards
        onPortfolioToggle = ($event) => {
            this.scope.listchild = this.scope.listchild != null ? !this.scope.listchild : true;
            this.scope.$emit("toggleReleaseCards", {release:this.story(), action: this.scope.listchild});
        }

        doNothing = ($event) => {
            $event.preventDefault();
            $event.stopPropagation();
        }
    }
}
