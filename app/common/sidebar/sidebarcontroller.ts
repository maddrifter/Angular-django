/// <reference path='../../_all.ts' />

module scrumdo {
    export class SideBarController {
        public expanded = false;
        public name:string;
        public hasMoreIterations = false;
        public hasTrashbin = false;


        public static $inject = ["$scope", "sidebarMultiselect", "projectSlug", "$localStorage", "organizationSlug", "$window", "sidebarMode", "iterationWindowService", "mixpanel", "scrumdoTerms", "hotkeys"];


        constructor(public scope,
                    public sidebarMultiselect:boolean,
                    public projectSlug:string,
                    public localStorage,
                    public organizationSlug:string,
                    public window,
                    public sidebarMode:string,
                    public iterationWindowService,
                    public mixpanel,
                    public scrumdoTerms:ScrumDoTerms,
                    public hotkeys) {
            this.scope.$storage = this.localStorage.$default({});
            this.filterIterations();
            this.checkAllItrMode();
            this.scope.$watch("iterations", this.filterIterations, true);
            this.scope.ctrl = this;
            this.name = "SideBarController";
            this.scope.multiselect = sidebarMultiselect;

            this.hotkeys.bindTo(this.scope).add({
                combo: "g b",
                description: "Go to Board",
                callback: (event) => {
                    event.preventDefault();
                    return window.location = "/projects/" + this.projectSlug + "/board";
                }
            });

            this.hotkeys.bindTo(this.scope).add({
                combo: "g p",
                description: "Go to Planning tool",
                callback: (event) => {
                    event.preventDefault();
                    return window.location = "/projects/" + this.projectSlug + "/planning";
                }
            });

            this.hotkeys.bindTo(this.scope).add({
                combo: "g r",
                description: "Go to Reports",
                callback: (event) => {
                    event.preventDefault();
                    return window.location = "/projects/" + this.projectSlug + "/reports";
                }
            });

            this.hotkeys.bindTo(this.scope).add({
                combo: "g d",
                description: "Go to Organization Dashboard",
                callback: (event) => {
                    event.preventDefault();
                    return window.location = "/organization/" + this.organizationSlug + "/dashboard";
                }
            });

            this.hotkeys.bindTo(this.scope).add({
                combo: "g c",
                description: "Go to Chat",
                callback: (event) => {
                    event.preventDefault();
                    return window.location = "/organization/" + this.organizationSlug + "/chat#/chat/" + this.projectSlug;
                }
            });

            if (this.hasActiveMilestones()) {
                this.hotkeys.bindTo(this.scope).add({
                    combo: "g m",
                    description: "Go to Milestones",
                    callback: (event) => {
                        event.preventDefault();
                        return window.location = "/projects/" + this.projectSlug + "/milestones/#list";
                    }
                });
            }

            // remain sidebar closed for mobile devices
            if(isMobileDevice()){
                this.scope.$storage.sidebarOpen = false;
            }
        }

        public checkAllItrMode = () => {
            var project;
            project = this.projectSlug;
            return this.expanded = this.scope.$storage[project + "_allItrMode"];
        }

        public setAllItrMode = (mode) => {
            var project;
            project = this.projectSlug;
            return this.expanded = this.scope.$storage[project + "_allItrMode"] = mode;
        }

        public hasStoryQueue = () => {
            if (this.scope.project == null) {
                return void 0;
            }
            return this.scope.canWrite && this.scope.project.story_queue_count;
        }

        public hasActiveMilestones = () => {
            if (this.scope.project == null) {
                return void 0;
            }
            return this.scope.project.milestone_counts.active > 0;
        }

        public hasMilestones = () => {
            if (this.scope.project == null) {
                return void 0;
            }
            return (this.scope.project.milestone_counts.active + this.scope.project.milestone_counts.inactive) > 0;
        }

        public expandAll = (flag) => {
            this.setAllItrMode(flag);
            return this.filterIterations();
        }

        public addIteration = () => {
            this.iterationWindowService.createIteration(this.organizationSlug, this.projectSlug);
            return this.mixpanel.track("Create Iteration");
        }

        public toggle = () => {
            return this.scope.$storage.sidebarOpen = !this.scope.$storage.sidebarOpen;
        }

        public goToBoard = (iteration) => {
            if (this.scope.multiselect) {
                _.forEach(this.scope.iterations, (i:any) => i.selected = false);
                return iteration.selected = true;
            } else {
                return this.window.location.assign(this.boardUrl(iteration));
            }
        }

        public boardUrl = (iteration) => {
            if ((iteration != null ? iteration.id : void 0) == null) {
                return void 0;
            }
            return "/projects/" + this.projectSlug + "/board#/view/iteration/" + iteration.id;
        }

        public storyListUrl = (iteration) => {
            if ((iteration != null ? iteration.id : void 0) == null) {
                return void 0;
            }
            return "/projects/" + this.projectSlug + "/iteration/" + iteration.id;
        }

        public goToStoryList = (iteration) => {
            return this.window.location.assign("/projects/" + this.projectSlug + "/iteration/" + iteration.id);
        }

        public iterationSortOrder(a, b) {
            if (a.hidden && !b.hidden) {
                return 1;
            }
            if (b.hidden && !a.hidden) {
                return -1;
            }

            if ((a.end_date == null) && (b.end_date != null)) {
                return -1;
            }

            if ((b.end_date == null) && (a.end_date != null)) {
                return 1;
            }

            if ((a.end_date == null) && (b.end_date == null)) {
                // Both are null, compare by name
                if (a.name > b.name) {
                    return -1;
                } else {
                    return 1;
                }
            }

            if (a.end_date > b.end_date) {
                return -1;
            } else if (a.end_date < b.end_date) {
                return 1;
            }
            return 0;
        }

        public filterIterations = () => {
            var TARGET_COUNT, current, dateless, hasHidden, hasTrash, more,  today;
            if (this.scope.iterations == null) {
                return;
            }

            trace("Filtering Iterations for Sidebar");
            TARGET_COUNT = 7;

            this.hasMoreIterations = false;

            this.scope.backlog = _.findWhere(this.scope.iterations, {
                "iteration_type": 0
            });
            this.scope.archive = _.findWhere(this.scope.iterations, {
                "iteration_type": 2
            });
            this.scope.trashbin = _.findWhere(this.scope.iterations, {
                "iteration_type": 3
            });

            hasTrash = _.where(this.scope.iterations, {
                    "iteration_type": 3
                }).length;

            if (hasTrash>0){
                this.hasTrashbin = true;
            }

            if (this.expanded) {
                this.scope.filteredIterations = _.where(this.scope.iterations, {
                    "iteration_type": 1
                });
            } else {
                this.scope.filteredIterations = _.where(this.scope.iterations, {
                    "iteration_type": 1,
                    hidden: false
                });
            }

            this.scope.filteredIterations.sort(this.iterationSortOrder);

            // We now have a nice sorted list of work iterations.

            if (this.scope.filteredIterations.length === 1) {
                // Only one iteration, don't give options.
                this.sidebarMultiselect = false;
            }

            // If we're in expanded mode, we want to show them all, so stop here.
            if (this.expanded) {
                this.scope.filteredIterations = _.uniq(this.scope.filteredIterations);
                this.hasMoreIterations = true;
                return;
            }

            // If we have 10 or fewer, show them all.
            if (this.scope.filteredIterations.length <= TARGET_COUNT) {
                this.hasMoreIterations = this.scope.filteredIterations.length !== _.where(this.scope.iterations, {
                        "iteration_type": 1
                    }).length;
                this.scope.filteredIterations = _.uniq(this.scope.filteredIterations);
                return;
            }

            this.hasMoreIterations = true;

            // If we have too many, we need to prioritize.
            // #1 priority = selected iterations
            // #2 priority = any current iterations. (always show, no matter how many)
            // #3 priority = dateless iterations (always show, no matter how many)
            // #4 priority = future iterations
            // #5 priority = past iterations
            today = moment().format("YYYY-MM-DD");

            dateless = _.where(this.scope.filteredIterations, {
                end_date: null
            });


            current = _.filter(this.scope.filteredIterations, ((iteration:any) => iteration.selected || (iteration.start_date <= today && iteration.end_date >= today) || (iteration.start_date === null && iteration.end_date >= today) || (iteration.start_date <= today && iteration.end_date === null)));

            var future:Array<Iteration> = _.filter(this.scope.filteredIterations, ((iteration:any) => !iteration.selected && (iteration.start_date > today && iteration.end_date !== null )));
            var past:Array<Iteration> = _.filter(this.scope.filteredIterations, ((iteration:any) => !iteration.selected && (iteration.end_date < today)));

            hasHidden = this.scope.filteredIterations.length !== _.where(this.scope.iterations, {
                    "iteration_type": 1
                }).length;

            if (hasHidden) {
                this.hasMoreIterations = true;
            }

            if ( (future.length + past.length) === 0 && !hasHidden) {
                this.hasMoreIterations = false;
            }

            this.scope.filteredIterations = dateless.concat(current);

            more = TARGET_COUNT - this.scope.filteredIterations.length;
            if (more > 0) {
                var toAdd = future.slice(Math.max(0,future.length - more));
                this.scope.filteredIterations = this.scope.filteredIterations.concat(toAdd);
            }

            more = TARGET_COUNT - this.scope.filteredIterations.length;
            if (more > 0) {
                this.scope.filteredIterations = this.scope.filteredIterations.concat(past.slice(0, more));
            }

            this.scope.filteredIterations = _.uniq(this.scope.filteredIterations);

            return this.scope.filteredIterations.sort(this.iterationSortOrder);
        }
    }
}