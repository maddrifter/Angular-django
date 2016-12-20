/// <reference path='../_all.ts' />

module scrumdo {

    import IState = angular.ui.IState;
    import IStateService = angular.ui.IStateService;
    export class ReportsController {
        public REPORT_CFD = 0;
        public REPORT_LEAD = 1;
        public REPORT_BURN = 2;
        public REPORT_AGING = 3;
        public REPORT_BLOCKERS_CLUSTER = 5;
        public REPORT_BLOCKERS_REPORT = 6;
        public REPORT_BLOCKERS_FREQ = 7;

        public hasReportData:boolean = true;

        public REPORT_TYPE_NAMES = {
            0: "cfd",
            1: "lead",
            2: "burn",
            3: "aging",
            5: "block",
            6: "blocklist",
            7: "blockfreq"
        };

        public MILESTONE = 4;

        public milestoneStats;
        public milestone:Story;
        public milestones:Array<Story>;
        public releaseProject:Project;
        public currentReport:number = this.REPORT_CFD;
        public startOpened:boolean = false;
        public endOpened:boolean = false;
        public burnType:string = "2";
        public refreshNeeded:boolean = false;
        public loading:boolean = false;
        public workflow:Workflow;
        public reportOptions = {
            agingType: "1",
            agingData: "step",
            agingStep: null,
            agingSteps: [],
            agingTags: [],
            agingTag: null,
            cfd_show_backlog: false,
            assignee: [],
            tag: null,
            label: null,
            epic: null,
            detail: false,
            yaxis: 1,
            iteration: null,
            startdate: null,
            enddate: null,
            lead_start_step: null,
            lead_end_step: null,
            interval: -1
        };

        private initialLoad:ng.IPromise<any>;

        public agingOpen:boolean = false;
        public cfdOpen:boolean = false;
        public lthOpen:boolean = false;
        public burnOpen:boolean = false;
        public milestonesOpen:boolean = false;
        public savedReportsOpen:boolean = false;
        public blockersClusterOpen:boolean = false;
        public blockersReportOpen:boolean = false;
        public blockersFreqOpen:boolean = false;

        public savedReports:Array<SavedReport>;

        public selectedIteration = null;

        public static $inject = ["$scope",
                                "$timeout",
                                "storyManager",
                                "projectManager",
                                "reportManager",
                                "storyEditor",
                                "epicManager",
                                "workflowManager",
                                "iterationManager",
                                "$sce",
                                "organizationSlug",
                                "projectSlug",
                                "$q",
                                "mixpanel",
                                "$state",
                                "releaseStatManager",
                                "hotkeys",
                                "savedReportManager",
                                "$uibModal",
                                "urlRewriter",
                                "confirmService",
                                "projectData"];


        constructor(public scope,
                    public timeout,
                    public storyManager,
                    public projectManager,
                    public reportManager: ReportManager,
                    public storyEditor: StoryEditor,
                    public epicManager,
                    public workflowManager,
                    public iterationManager,
                    $sce,
                    public organizationSlug,
                    public projectSlug,
                    $q,
                    public mixpanel,
                    public state:IStateService,
                    public releaseStatManager,
                    public hotkeys,
                    public savedReportManager:SavedReportManager,
                    public modal,
                    public urlRewriter,
                    protected confirmService:ConfirmationService,
                    protected projectData:ProjectDatastore) {


            this.scope.$watch("ctrl.reportOptions.agingSteps.length", this.markRefreshNeeded);
            this.scope.$watch("ctrl.reportOptions.agingStep", this.markRefreshNeeded);
            this.scope.$watch("ctrl.workflow", this.onWorkflowChange);
            this.scope.$watch("ctrl.reportOptions", this.markRefreshNeeded, true);
            this.scope.$watchGroup(["ctrl.currentReport", "ctrl.filter_epic_id", "ctrl.filter_label_id", "ctrl.filter_tag", "ctrl.filter_username"], this.markRefreshNeeded);
            this.scope.$on("$stateChangeStart", this.onStateChange);
            this.refreshNeeded = true;

            this.loading = true;

            this.initData(projectData)

            this.initialLoad = $q.all([
                this.workflowManager.loadWorkflows(this.organizationSlug, this.projectSlug).then(this.onWorkflowsLoaded),
                this.savedReports = this.savedReportManager.loadSavedReports(this.organizationSlug, this.projectSlug)
            ]).then(() => {
                this.loading = false;
                this.changeToChart(this.state.current.name);
                setTimeout(this.refresh);

            });

            this.scope.to_trusted = (html_code) => $sce.trustAsHtml(html_code);


            this.hotkeys.bindTo(this.scope).add({
                combo: "r",
                description: "Refresh Reports",
                callback: (event) => {
                    event.preventDefault();
                    return this.refresh();
                }
            });
        }


        private initData(projectData:ProjectDatastore) {

            // TODO: We're littering the scope here with objects that could be looked up on the datastore instead

            this.scope.epics = projectData.epics;
            let project = this.scope.project = projectData.currentProject;

            if(this.state.current.name == "cfd"){
                this.cfdOpen = project.project_type !== 2;
                this.milestonesOpen = project.project_type === 2;
            }

            if (project.project_type === 2) {
                this.loadMilestones();
                this.currentReport = this.MILESTONE;
            }

            let iterations = this.scope.iterations = projectData.iterations;
            this.scope.iterationOptions = _.where(iterations, {
                iteration_type: 1
            });
            this.scope.iterationOnlyOptions = _.where(iterations, {
                iteration_type: 1
            });
            this.scope.iterationOptions.unshift({
                name: "All Iterations",
                id: -1
            });
            this.reportOptions.iteration = this.scope.iterationOptions[0];
        }

        /**
         * Variations of our burn and aging charts are all smooshed together.  This method
         * sets up a burnType or agingType field on our report options depending on the ui state
         * name passed in.
         *
         * TODO: Factor these reports into their own states
         */
        protected setSubChartType(uiState) {
            let parts = uiState.split(":")
            let state = parts[0];
            switch(state) {
                case 'app.reports.burn':
                    this.burnType = parts[1];
                    if(this.burnType == '3' && this.reportOptions.iteration.id == -1) {
                        // The stacked report can't have the 'All Iterations' option selected.
                        this.reportOptions.iteration = this.scope.iterationOnlyOptions[0];
                    }
                    break;
                case 'app.reports.aging':
                    this.reportOptions.agingType = parts[1];
                    break;
            }
        }

        public selectReport = (uiState, forceLoad:boolean=false) => {


            forceLoad = forceLoad && this.state.current.name === uiState; // only need to force a load if we're not changing states

            this.state.go(uiState);


            this.setSubChartType(uiState);
            this.markRefreshNeeded();
            if(forceLoad) {
                this.refresh();
            }
        }

        public saveReportSettings = () => {
            var dialog;
            this.scope.reportName = '';
            this.scope.dateType = 0;
            dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("reports/savereportwindow.html"),
                scope: this.scope
            });
            return dialog.result.then(this.onSaveReport);
        }

        public onSaveReport = (report) => {
            report.workflow = this.workflow.id;
            report.report_type = this.REPORT_TYPE_NAMES[this.currentReport];
            report.burn_type = this.burnType
            report.startdate = this.reportOptions.iteration.start_date;
            report.enddate = this.reportOptions.iteration.end_date;
            report.y_axis = this.reportOptions.yaxis;
            _.extend(report, this.getFilters());

            if(report.report_type == 'aging' && report.agingType == '1') {
                if(this.reportOptions.agingTag) { report.agingTags = this.reportOptions.agingTag['name']; }
                if(this.reportOptions.agingStep) { report.agingSteps = this.reportOptions.agingStep.id; }
            }

            return this.savedReportManager.createReport(this.organizationSlug, this.projectSlug, report).$promise.then( (result) => {
                this.savedReports.push(result);
            } );
        }

        public onSavedReports = (results) => {
            return this.savedReports = results;
        }

        public onWorkflowsLoaded = (result) => {
            var defaultWorkflow, reportProfile;
            this.scope.workflows = result;

            if (this.scope.$storage[this.projectSlug] != null) {
                reportProfile = this.scope.$storage[this.projectSlug].reportProfile;
            } else {
                this.scope.$storage[this.projectSlug] = {};
                reportProfile = null;
            }

            defaultWorkflow = _.findWhere(result, {
                id: reportProfile
            });

            if (defaultWorkflow != null) {
                return this.workflow = defaultWorkflow;
            } else if (result.length > 0) {
                return this.workflow = result[0];
            }
        }

        public showFilters() {
            return this.cfdOpen || this.lthOpen || this.agingOpen || this.blockersClusterOpen || this.blockersReportOpen || this.blockersFreqOpen;
        }

        public loadMilestones = () => {
            return this.projectManager.loadProject(this.organizationSlug, "__releases__").then((project:Project) => {
                this.releaseProject = project;
                return this.loadMilestoneCards();
            });
        }

        public loadMilestoneCards = () => {
            return this.iterationManager.loadIterations(this.organizationSlug, this.releaseProject.slug).then((iterations) => {
                var iterationIds;
                iterationIds = iterations.map((iteration) => iteration.id);
                return this.storyManager.loadIterations(this.projectSlug, iterationIds).then((stories) => {
                    this.milestones = stories;
                    if (stories.length > 0) {
                        this.milestone = stories[0];
                        return this.loadChart();
                    }
                });
            });
        }

        public iterationChanged = () => {
            if (this.reportOptions.iteration == null) {
                return;
            }
            if (this.reportOptions.iteration.start_date != null) {
                this.reportOptions.startdate = moment(this.reportOptions.iteration.start_date).toDate();
            }
            if (this.reportOptions.iteration.end_date != null) {
                return this.reportOptions.enddate = moment(this.reportOptions.iteration.end_date).toDate();
            }
        }

        public onWorkflowChange = () => {
            if (this.workflow == null) {
                return;
            }
            this.scope.$storage[this.projectSlug].reportProfile = this.workflow.id;
            this.reportOptions.lead_start_step = this.workflow.steps[0];
            this.reportOptions.agingStep = this.workflow.steps[0];
            this.reportOptions.agingSteps = this.workflow.steps.concat();
            return this.reportOptions.lead_end_step = this.workflow.steps.slice(-1)[0];
        }

        public optionTransformers = {
            cfd_show_backlog: (v) => v,
            lead_start_step: (v) => v.id,
            lead_end_step: (v) => v.id,
            interval: (v) => v,
            assignee: (v) => (v.filter((s)=>!!s).map((u) => u.id)).join(","),
            tag: (v) => v.name,
            label: (v) => v.id,
            epic: (v) => v.id,
            detail: (v) => v,
            yaxis: (v) => v,
            iteration: (v) => v.id,
            startdate: (v) => moment(v).format("YYYY-MM-DD"),
            enddate: (v) => moment(v).format("YYYY-MM-DD"),
            agingType: (v) => v,
            agingData: (v) => v,
            agingSteps: (v) => (v.filter((s)=>!!s).map((step) => step.id)).join(","),
            agingStep: (v) => null,
            agingTags: (v) => (v.filter((s)=>!!s).map((tag) => tag.name)).join(","),
            agingTag: (v) => null
        };

        //public openStart = ($event) => {
        //    $event.preventDefault();
        //    $event.stopPropagation();
        //    return this.startOpened.opened = true;
        //}

        public onStateChange = (event, toState, toParams, fromState, fromParams) => {
            trace("onStateChange " + toState.name)
            this.changeToChart(toState.name);
            return this.loadChart();
        }

        protected changeToChart(chartType:string) {
            this.setSubChartType(chartType);
            this.scope.selectedReport = chartType;
            this.cfdOpen = false;
            this.lthOpen = false;
            this.burnOpen = false;
            this.agingOpen = false;
            this.milestonesOpen = false;
            this.savedReportsOpen = false;
            this.blockersClusterOpen = false;
            this.blockersFreqOpen = false;
            this.blockersReportOpen = false;
            if (chartType === "app.reports.cfd") {
                this.currentReport = this.REPORT_CFD;
                this.cfdOpen = true;
            } else if (chartType.substr(12,5) === "aging") {
                this.currentReport = this.REPORT_AGING;
                this.agingOpen = true;
            } else if (chartType === "app.reports.lead") {
                this.currentReport = this.REPORT_LEAD;
                this.lthOpen = true;
            } else if (chartType.substr(12,4) === "burn") {
                this.currentReport = this.REPORT_BURN;
                this.burnOpen = true;
            } else if (chartType === "app.reports.milestones") {
                this.currentReport = this.MILESTONE;
                this.milestonesOpen = true;
            } else if (chartType === "app.reports.saved") {
                this.savedReportsOpen = true;
            } else if (chartType === "app.reports.block") {
                this.blockersClusterOpen = true;
                this.currentReport = this.REPORT_BLOCKERS_CLUSTER;
            } else if(chartType === "app.reports.blocklist"){
                this.blockersReportOpen = true;
                this.currentReport = this.REPORT_BLOCKERS_REPORT;
            } else if(chartType === "app.reports.blockfreq"){
                this.blockersFreqOpen = true;
                this.currentReport = this.REPORT_BLOCKERS_FREQ;
            }
        }

        public loadSavedReport(reportId) {
            this.initialLoad.then(()=>{
                var report = _.findWhere(this.savedReports, {id:reportId});
                this.renderSavedReport(report);
            });
        }

        public deleteSavedReport(reportId) {
            this.confirmService.confirm('Are you sure?', 'Do you want to delete this saved report?', 'Cancel', 'Delete').then(()=>{
                var report = _.findWhere(this.savedReports, {id:reportId});
                this.savedReportManager.deleteSavedReport(this.organizationSlug, this.scope.project.slug, report)
                removeById(this.savedReports, reportId);
            });
        }

        public renderSavedReport(report) {
            this.workflow = <Workflow> _.findWhere(this.scope.workflows, {id:report.workflow_id})

            this.burnType = report.burn_type;

            this.reportOptions.cfd_show_backlog = report.cfd_show_backlog  ;
            this.reportOptions.interval = report.interval  ;
            this.reportOptions.detail = report.detail  ;
            this.reportOptions.yaxis = report.y_axis  ;

            this.reportOptions.agingSteps = report.aging_steps
                                                       .split(",")
                                                       .map((stepId) => _.findWhere(this.workflow.steps,{id:parseInt(stepId)}))

            if(this.reportOptions.agingSteps.length > 0) {
                this.reportOptions.agingStep = this.reportOptions.agingSteps[0];
            }

            this.reportOptions.agingData = report.aging_by == '1' ? "tag" : "step";

            this.reportOptions.agingTags = report.aging_tags.split(",").map((tagName) => _.findWhere(this.scope.project.tags, {name:tagName}) )
            if(this.reportOptions.agingTags.length > 0) {
                this.reportOptions.agingTag = this.reportOptions.agingTags[0];
            }
            this.reportOptions.lead_start_step = _.findWhere(this.workflow.steps, {id:report.lead_start_step_id}) ;
            this.reportOptions.assignee = report.assignees.map((user) => _.findWhere(this.scope.project.members, {id:user.id}));
            this.reportOptions.lead_end_step = _.findWhere(this.workflow.steps, {id:report.lead_end_step_id}) ;
            this.reportOptions.tag = _.findWhere(this.scope.project.tags, {name:report.tag}) ;
            this.reportOptions.label = _.findWhere(this.scope.project.labels, {id:report.label_id}) ;
            this.reportOptions.epic = _.findWhere(this.scope.epics, {id:report.epic_id});
            this.reportOptions.iteration = _.findWhere(this.scope.iterations, {id:report.iteration_id });

            if(!this.reportOptions.iteration) {
                this.reportOptions.iteration = this.scope.iterationOptions[0];
            }

            this.reportOptions.startdate = report.startdate ? moment(report.startdate, "YYYY-MM-DD").toDate() : null;
            this.reportOptions.enddate = report.enddate ? moment(report.enddate, "YYYY-MM-DD").toDate() : null;


            let desiredState = report.report_type

            // this.currentReport = ["cfd","lead","burn","aging", "block"].indexOf(report.report_type);

            switch(desiredState) {
                case 'app.reports.burn':
                    desiredState = `app.reports.burn:${report.burn_type}`;
                    break;
                case 'app.reports.aging':
                    desiredState = `app.reports.aging:${report.aging_type}`;
                    break;
            }
            this.selectReport(desiredState, true);

            // if(this.state.current.name == report.report_type) {
            //     this.changeToChart(report.report_type, {});
            //     return this.loadChart();
            // } else {
            //     trace("Going to " + report.report_type);
            //     this.state.go(report.report_type);
            // }
        }

        public getFilters = () => {
            var k, rv, transformedValue, v, _ref;
            rv = {};
            _ref = this.reportOptions;
            for (k in _ref) {
                v = _ref[k];
                if (v != null) {

                    transformedValue = this.optionTransformers[k](v);
                    if (transformedValue !== -1 && (transformedValue != null)) {
                        rv[k] = this.optionTransformers[k](v);
                    }
                }
            }
            return rv;
        }

        public loadChart = () => {
            var options, steps, tags;
            this.scope.reportsLocked = false;

            var tooltip = angular.element('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }

            if (this.currentReport === this.MILESTONE && (this.milestone != null)) {
                this.loading = false;
                this.mixpanel.track("View Milestone");

                return this.releaseStatManager.loadStats(this.organizationSlug, this.milestone.id).then((stats) => this.milestoneStats = stats);
            } else if (this.workflow == null) {

                // Can't render the rest of the reports without a workflow

            } else if (this.currentReport === this.REPORT_CFD) {
                this.loading = true;
                this.mixpanel.track("View CFD");
                return this.reportManager.loadCFD(this.organizationSlug, this.projectSlug, this.workflow.id, this.getFilters()).then((result: any) => {
                    this.loading = false;
                    this.scope.reportsLocked = result.data.locked !=null ? true: false;                   
                    this.scope.cfdLegends = result.data.legends;
                    return this.scope.cfdReportData = result.data.data;
                })["catch"](() => this.loading = false);
            } else if (this.currentReport === this.REPORT_LEAD) {
                if (!(this.reportOptions.lead_start_step && this.reportOptions.lead_end_step)) {
                    return;
                }
                this.loading = true;
                this.mixpanel.track("View LTH");
                return this.reportManager.loadLead(this.organizationSlug, this.projectSlug, this.workflow.id, this.getFilters()).then((result: any) => {
                    this.loading = false;
                    this.scope.reportsLocked = result.data.locked !=null ? true: false;
                    return this.scope.leadReportData = result.data;
                })["catch"](() => this.loading = false);
            } else if (this.currentReport === this.REPORT_BURN) {
                if (this.reportOptions.iteration == null) {
                    return;
                }
                this.loading = true;
                this.mixpanel.track("View Burndown");
                if (this.reportOptions.iteration.id === -1) {
                    return this.reportManager.loadProjectBurn(this.projectSlug).then((result) => {
                        this.loading = false;
                        return this.scope.burnReportData = result;
                    });
                } else {
                    return this.reportManager.loadIterationBurn(this.projectSlug, this.reportOptions.iteration.id).then((result) => {
                        this.loading = false;
                        return this.scope.burnReportData = result;
                    });
                }
            } else if (this.currentReport === this.REPORT_AGING) {
                if (this.reportOptions.iteration == null) {
                    return;
                }
                this.loading = true;
                this.mixpanel.track("View Aging");
                steps = this.reportOptions.agingSteps;
                tags = this.reportOptions.agingTags;

                if (this.reportOptions.agingType === "1") {
                   steps = [this.reportOptions.agingStep];
                   tags = [this.reportOptions.agingTag];
                }

                options = this.getFilters();
                options.agingSteps = (steps.map((step) => step && step.id || null)).join(",");
                options.agingTags = (tags.map((tag) => tag && tag.name || null)).join(",");

                return this.reportManager.loadAging(this.organizationSlug, this.projectSlug, this.workflow.id, options)
                    .then((result:any) => {
                        this.loading = false;
                        this.scope.reportsLocked = result.data.locked !=null ? true: false;
                        return this.scope.agingReportData = result;
                    })
                    .catch((err) => {
                        this.loading = false
                    });

            } else if (this.currentReport === this.REPORT_BLOCKERS_CLUSTER) {
                this.loading = true;
                this.mixpanel.track("View Blockers");
                options = this.getFilters();
                return this.reportManager.loadBlockers(this.organizationSlug, this.projectSlug, options).then((result) => {
                    this.loading = false;
                    return this.scope.blockersClustertData = result;
                });
            } else if(this.currentReport === this.REPORT_BLOCKERS_REPORT){
                this.loading = true;
                this.mixpanel.track("View Blockers");
                options = this.getFilters();
                return this.reportManager.loadBlockersList(this.organizationSlug, this.projectSlug, options).then((result) => {
                    this.loading = false;
                    return this.scope.blockersReportData = result;
                });
            } else if(this.currentReport === this.REPORT_BLOCKERS_FREQ){
                this.loading = true;
                this.mixpanel.track("View Blockers Frequency");
                options = this.getFilters();
                return this.reportManager.loadBlockersFreq(this.organizationSlug, this.projectSlug, options).then((result) => {
                    this.loading = false;
                    return this.scope.blockersFreqData = result;
                });
            }
        }

        public refresh = () => {
            this.refreshNeeded = false;
            return this.loadChart();
        }

        public markRefreshNeeded = () => {
            return this.refreshNeeded = true;
        }

        public getReportManager(){
            return this.reportManager;
        }

        public compareUsers = (user1, user2) => {
            return (typeof user1 !== "undefined" && user1 !== null ? user1.username : void 0) === (typeof user2 !== "undefined" && user2 !== null ? user2.username : void 0);
        }

        public userLabel = (user) => {
            return shortuser(user);
        }

    }
}