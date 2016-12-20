/// <reference path='../_all.ts' />

module scrumdo {
    export class ProjectDatastore {
        public currentTeam:TeamDatastore; // Set after setCurrentTeam

        public currentIteration:Iteration; // Set after setCurrentIteration
        public currentIncrement:ProgramIncrement;  // set after setCurrentIteration if the iteration is part of an increment.
        public currentStories:Array<Story>; // Set after setCurrentIteration

        public currentProject:Project; // set after setCurrentProject
        public epics:Array<Epic>; // set after setCurrentProject
        public iterations:Array<Iteration>; // set after setCurrentProject
        public headers: any; // set after setCurrentProject
        public cells: any;// set after setCurrentProject
        public portfolio:Portfolio; // set after setCurrentProject IF this project is part of a portfolio.

        public policies: any;
        public workflows: any;
        public uiState;

        public risksByIteration = {};  // mapping of iteration id to array of risks
        public systemRisksByIteration = {};



        public static $inject:Array<string> = [
            "organizationSlug",
            "projectManager",
            "iterationManager",
            "portfolioManager",
            "programIncrementManager",
            "epicManager",
            "boardHeadersManager",
            "boardCellManager",
            "workflowManager",
            "policyManager",
            "storyAssignmentManager",
            "storyManager",
            "$q", 
            "$state",
            "userService",
            "risksManager",
            "$rootScope"
        ];

        constructor(private organizationSlug:string,
                    private projectManager:ProjectManager,
                    private iterationManager:IterationManager,
                    private portfolioManager:PortfolioManager,
                    private programIncrementManager:ProgramIncrementManager,
                    private epicManager:EpicManager,
                    private headersManager: BoardHeadersManager,
                    private cellManager: BoardCellManager,                    
                    private workflowManager: WorkflowManager,
                    private policyManager: PolicyManager,                 
                    private storyAssignmentManager:StoryAssignmentManager,
                    private storyManager:StoryManager,
                    private $q:ng.IQService,
                    private $state:ng.ui.IStateService,
                    private userService: UserService,
                    private risksManager: RisksManager,
                    private $rootScope:ng.IRootScopeService) {
                       
        }

        public clearCurrentIteration() {
            this.currentIteration = null;
            this.currentIncrement = null;
            return this;
        }

        public risks():Array<Risk> {
            return this.risksByIteration[this.currentIteration.id];
        }

        public loadSystemRisks = () => {
            if(this.portfolio.id) {
                var p = this.risksManager.loadSystemRisks(this.currentProject.slug, this.currentIteration.id).then((risks) => {
                    this.systemRisksByIteration[this.currentIteration.id] = risks;
                });
                return p;
            }else{
                this.systemRisksByIteration[this.currentIteration.id] = [];
                return this.$q.resolve(null);
            }
        }

        public systemRisks():Array<any> {
            return this.systemRisksByIteration[this.currentIteration.id];
        }

        public reloadRisks = () => {
            if(this.portfolio.id) {
                return this.risksManager
                    .loadRisksForIteration(this.portfolio.id, this.currentIteration.id)
                    .then((risks)=>this.risksByIteration[this.currentIteration.id] = risks)
            }
            else {
                this.risksByIteration[this.currentIteration.id] = [];
                return this.$q.resolve([]);
            }
        }

        public loadRisks(projectSlug, iterationId):ng.IPromise<ProjectDatastore> {

            return this.setCurrentIteration(projectSlug, iterationId)
                .then(this.reloadRisks)
                .then(this.loadSystemRisks)
                .then(()=>this)
        }

        public setCurrentIteration(projectSlug, iterationId):ng.IPromise<ProjectDatastore> {
            this.currentStories = [];
            if(this.currentIteration && iterationId == this.currentIteration.id) {
                // If we're already set for the current iteration, we only need to refresh our
                // story data instead of loading everything.
                return this.storyManager.loadIteration(this.currentProject.slug, iterationId)
                    .then((stories) => this.currentStories = stories)
                    .then(()=>this)
            }

            this.clearCurrentIteration();
            return this.setCurrentProject(projectSlug)
                .then( () => {
                        // return if there is no iteration id
                        if(isNaN(parseInt(iterationId))) return;
                        // Some iterations have increments associated with them, so grab it
                        iterationId = parseInt(iterationId);
                        return this.$q.all([
                            this.programIncrementManager
                                .getIncrementByIteration(this.currentProject.slug, iterationId)
                                .then((increment) => this.currentIncrement = increment),
                            this.storyManager.loadIteration(this.currentProject.slug, iterationId)
                                .then((stories) => {
                                    return this.currentStories = stories;
                                }, () => {
                                    this.$state.go('app.planning.planningcolumn', {newIteration:true});
                                })
                        ])
                })
                .then(()=>this.currentIteration = _.findWhere(this.iterations, {id: iterationId}))
                .then(()=>this)                
        }

        public setCurrentProject(slug:string):ng.IPromise<ProjectDatastore> {

            if(this.currentProject && slug == this.currentProject.slug){ return this.$q.resolve(this); }

            this.currentProject = null;
            this.iterations = [];
            this.portfolio = null;
            this.currentStories = [];
            this.uiState = new UIState();

            return this.$q
                .all([
                    this.projectManager
                        .loadProject(this.organizationSlug, slug)
                        .then((project)=>this.currentProject=project),
                    this.iterationManager
                        .loadIterations(this.organizationSlug, slug)
                        .then((iterations)=>this.iterations=iterations),
                    this.portfolioManager
                        .loadPortfolioForProject(slug)
                        .then((portfolio)=>this.portfolio=portfolio),
                    this.epicManager
                        .loadEpics(this.organizationSlug, slug)
                        .then((epics)=>this.epics=epics),
                    this.headersManager.loadHeaders(this.organizationSlug, slug)
                        .then((headers)=>this.headers = headers),
                    this.cellManager.loadCells(this.organizationSlug, slug)
                        .then((cells)=>this.cells=cells),
                    this.policyManager.loadPolicies(this.organizationSlug, slug)
                        .then((policies)=>this.policies=policies),
                    this.workflowManager.loadWorkflows(this.organizationSlug, slug)
                        .then((workflows)=>this.workflows=workflows)
                    
                ])
                .then(()=>{
                    this.setSafeTerms();
                    return this;
                })
        }

        private setSafeTerms(){
            var project, parentLevel, portfolio, level, current_time_period_name, childrenLevel, currentLevelName;
            project = this.currentProject
            portfolio = this.portfolio;
            if(project.project_type == 2){
                current_time_period_name = portfolio.time_period;
                currentLevelName = 'Portfolio';
            }else{
                level = _.find(portfolio.levels, (l:any) => l.id == project.portfolio_level_id);
                current_time_period_name = level != null ? level.time_period: "Iteration";
                currentLevelName = level != null ? level.name: "Workspace";
            }
            if(project.parents[0] != null){
                parentLevel = _.find(portfolio.levels, (l:any) => l.id == project.parents[0].portfolio_level_id);
            }else{
                parentLevel = null;
            }
            if(project.children[0] != null){
                childrenLevel = _.find(portfolio.levels, (l:any) => l.id == project.children[0].portfolio_level_id);
            }else{
                childrenLevel = null;
            }

            var terms = {
                'portfolio': {
                    'work_item_name': portfolio.root != null ? portfolio.root.work_item_name: null,
                    'time_period_name': portfolio !=null ? portfolio.time_period: null
                },
                'parent': {
                    'work_item_name': project.parents[0] != null ? project.parents[0].work_item_name : null,
                    'time_period_name': parentLevel != null ? parentLevel.time_period: null
                },
                'children': {
                    'work_item_name': project.children[0] != null ? project.children[0].work_item_name : null,
                    'time_period_name': childrenLevel != null ? childrenLevel.time_period: null
                },
                'current': {
                    'work_item_name': project.work_item_name,
                    'time_period_name': current_time_period_name,
                    'level_name': currentLevelName
                }
            }

            this.$rootScope['safeTerms'] = terms;
        }

        public reloadIterations() {
            this.iterationManager
                .loadIterations(this.organizationSlug, this.currentProject.slug, true)
                .then((iterations)=>this.iterations=iterations);
        }

        public reloadIncrement(iterationId:number){
            this.programIncrementManager
                    .getIncrementByIteration(this.currentProject.slug, iterationId)
                    .then((increment) => this.currentIncrement = increment)
        }



        public setCurrentTeam(projectSlug, iterationId, teamSlug=null):ng.IPromise<ProjectDatastore> {
            /* For team planning, we need to load up:
                 1. The team backlog
                 2. The project for the team
                 3. The team epics
                 4. The team cards in all iterations for that increment.

                 We'll do 1-3 first, then 4
             */

            this.currentTeam = new TeamDatastore();
            if(teamSlug!= null){
                this.currentTeam.canWrite = this.userService.canWrite(teamSlug);
            }
            return this.setCurrentIteration(projectSlug, iterationId)
                .then(()=> {

                    let toLoad = [
                        this.cellManager
                            .loadCells(this.organizationSlug, teamSlug)
                            .then((cells)=> this.currentTeam.boardCells = cells),
                        this.iterationManager
                            .loadIterations(this.organizationSlug, teamSlug)
                            .then( (iterations) => this.currentTeam.iterations = iterations),
                        this.projectManager
                            .loadProject(this.organizationSlug, teamSlug)
                            .then((project)=>this.currentTeam.project = project),
                        this.epicManager
                            .loadEpics(this.organizationSlug, teamSlug)
                            .then((epics)=>this.currentTeam.epics=epics)
                    ];

                    if(this.currentIncrement && this.currentIncrement.id) {
                        this.storyAssignmentManager
                            .loadAssignments(this.currentIncrement.id, teamSlug)
                            .then((assignments)=>this.currentTeam.assignments = assignments.data)
                            .catch(()=>this)
                    } else {
                        this.currentTeam.assignments = [];
                    }


                    return this.$q.all(toLoad)
                })
                .then(()=> this.storyManager
                            .loadIteration(teamSlug, this.currentTeam.project.kanban_iterations.backlog)
                            .then((stories)=>this.currentTeam.backlog=stories))
                .then(()=>this.$rootScope.$broadcast("projectIterationChanges", this.currentIteration))
                .then(()=>this)
        }

        public canAdmin(){
            return this.userService.canAdmin(this.currentProject.slug);
        }

        public canWrite(){
            return this.userService.canWrite(this.currentProject.slug);
        }

        public canRead(){
            return this.userService.canRead(this.currentProject.slug);
        }

        public getCell(id) {
            return this.getById(this.cells, id);
        }

        public getHeader(id) {
            return this.getById(this.headers, id);
        }

        public getPolicy(id) {
            return this.getById(this.policies, id);
        }

        public getWorkflow(id) {
            return this.getById(this.workflows, id);
        }

        public getById(collection, id) {
            var results = _.where(collection, { 'id': id });
            if (results.length === 0) {
                return null;
            }
            return results[0];
        }

        public backlogIterationId() {
            var ref;
            return (ref = this.currentProject) != null ? ref.kanban_iterations.backlog : void 0;
        }

        public archiveIterationId() {
            var ref;
            return (ref = this.currentProject) != null ? ref.kanban_iterations.archive : void 0;
        }

        public getIncrementTeams(): Array<IncrementIteration>{
            if( (!this.currentIncrement) || (!this.currentIncrement.id) ){
                return null;
            }
            let teams = [];
            let keys = {};
            _.forEach(this.currentIncrement.schedule, (s:ProgramIncrementSchedule) => {
                _.forEach(s.iterations, (iter:IncrementIteration) => {
                    if(!(iter.project_slug in keys)){
                        keys[iter.project_slug] = true;
                        teams.push(iter);
                    }
                });
            }); 
            return teams;
        }

        public isTeamInSchedule(team_slug: string, schedule: ProgramIncrementSchedule): boolean{
            return _.findWhere(schedule.iterations, {project_slug: team_slug}) != null;
        }

        public me(){
            return this.userService.me;
        }

        public isPremiumUser = () => {
            return this.me().organization.subscription.premium_plan;
        }

    }
}
