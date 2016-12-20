/// <reference path='../_all.ts' />

module scrumdo {

    import IAugmentedJQuery = angular.IAugmentedJQuery;
    interface InboxProjectScope extends ng.IScope {
        project:Project;
        ctrl: InboxController;
    }

    export class InboxProjectController {
        public static $inject:Array<string> = ["$scope",
            "organizationSlug",
            "inboxManager",
            "$state",
            "favoriteManager",
            "exportManager",
            "projectManager"];


        public loading:boolean = false;
        public expanded:boolean = false;
        public loaded:boolean = false;
        public hasMore:boolean = false;
        public scrollPosition:number = 0;

        public maxGroups:number = 0;
        public currentGroupNum:number = 0;


        public groups:Array<InboxGroupStatic> = [];

        protected lastRecord:number = 0;

        constructor(private $scope:InboxProjectScope,
                    private organizationSlug:string,
                    private inboxManager:InboxManager,
                    private $state:ng.ui.IStateService,
                    private favoriteManager,
                    private exportManager,
                    private projectManager:ProjectManager) {
            if(this.$scope.project.watched) {
                this.expanded = true;
                this.load();
            }

            trace("Hooking up next/prev")
            $scope.$on("previousGroup", this.onPreviousGroup);
            $scope.$on("nextGroup", this.onNextGroup);
            $scope.$on('inboxGroupDeleted', this.onGroupDeleted);


            // Create a placeholder group for the project summary info to live in.
            var projSummary:InboxGroupStatic = <InboxGroupStatic>{
                date: moment().format("YYYY-MM-DD"),
                story: null,
                epic: null,
                projectSummary: true,
                id: -1 * $scope.project.id,  // we're going to use a negative value of the project id here so it doesn't conflict with a real group
                entries: [
                    {
                        status: 0,
                        body: {
                            message: {},
                            user: {
                                username: "ScrumDo",
                                first_name: "",
                                last_name: "",
                                email: "",
                                id: -1
                            },
                            event_type: "project_summary"
                        },
                        subject: "Project Summary",
                        created: moment().format("YYYY-MM-DD")
                    }
                ]
            };
            this.groups.unshift(projSummary);
            this.inboxManager.addCachedGroup(projSummary);

        }

        protected onGroupDeleted = (event, groupId) => {
            var len:number = this.groups.length;
            if(removeById(this.groups, groupId)) {
                this.currentGroupNum--;
                this.maxGroups--;
                this.setGroupCounts()
            }
        }


        public exportProject(project:Project):void {
            return this.exportManager.startProjectExport(project);
        }

        public toggleFavorite = (project) => {
            if (project.watched) {
                this.removeFavorite(project);
            } else {
                this.addFavorite(project).then(()=>{this.toggleExpanded(project, true);})
            }
        }

        public addFavorite = (project) => {
            project.watched = true;
            return this.favoriteManager.addProjectFavorite(project);
        }

        public removeFavorite = (project) => {
            project.watched = false;
            return this.favoriteManager.removeProjectFavorite(project);
        }


        public numClicked(event) {
            // We don't want to do other actions when opening this link
            event.stopPropagation();
        }

        public loadMore() {
            this.load();
        }

        protected load():ng.IPromise<any> {
            if(this.loading) {return null;}
            this.loading = true;
            this.inboxManager.loadInbox(this.$scope.project.slug, this.lastRecord).then(this.onInboxLoaded);

            if(!this.$scope.project.stats) {
                // Need to reload the projec to get the stats as well.
                this.projectManager.loadProject(this.organizationSlug, this.$scope.project.slug, true, true).then(this.onProjectLoaded)
            }
        }

        protected onProjectLoaded = (project:Project) => {
            this.$scope.project.stats = project.stats;
        }

        public toggleExpanded(project:Project, forceOpen=false) {
            this.expanded = (! this.expanded) || forceOpen;
            if(!this.loaded && !this.loading) {
                this.load();
            }
        }

        protected onInboxLoaded = (result:PagedInboxGroup) => {
            this.loaded = true;
            this.loading = false;
            var existing:Array<InboxGroupStatic> = this.groups;
            existing.push.apply(existing, result.items)
            this.hasMore = result.current_page < result.max_page;
            this.maxGroups = result.count + 1;


            if(result.items.length > 0) {
                this.lastRecord = result.items[result.items.length - 1].id;
            } else {
                this.lastRecord = 999999999;
            }

        }


        public setGroupCounts() {
            this.$scope.$root['groupCounts'] = [this.currentGroupNum, this.maxGroups];
        }


        public openGroup(group:InboxGroupStatic) {
            this.currentGroupNum = this.groups.indexOf(group) + 1;
            this.$state.go("inbox.group",{projectSlug:this.$scope.project.slug, groupId:group.id});
            this.setGroupCounts();
            this.$scope.$emit('saveScroll');
        }

        public onPreviousGroup = (event, group):void => {
            this.navigateGroup(group, -1);
        }

        public onNextGroup = (event, group):void => {
            this.navigateGroup(group, 1);
        }

        protected navigateGroup(group:InboxGroup, offset:number):void {
            if(! this.groups ){return;}

            var index:number = this.groups.indexOf(group);
            if( index == -1 ) {
                return;
            }


            index += offset;
            trace(`navigateGroup ${index} ${this.groups.length}`);

            var nearEnd:boolean = index > (this.groups.length - 5);

            if(this.hasMore && !this.loading && nearEnd) {
                // If we have more, and we're not already loading them, and we're
                // near the end of the list, fetch some more.
                this.load();
            }

            if(index < 0) {
                this.$state.go("inbox");
                return;
            }
            else if( index >= this.groups.length){
                if(!this.hasMore) {
                    this.$state.go("inbox");
                }
                return;
            }
            this.openGroup(this.groups[index]);
            //this.$state.go("inbox.group",{projectSlug:this.$scope.project.slug, groupId:this.groups[index].id});
        }
    }
}