/// <reference path='../_all.ts' />

module scrumdo {

    interface AppScope extends ng.IScope {
        project: Project;
        iterations:Array<Iteration>;
    }

    export class ProgramIncrementProject {
        public static $inject:Array<string> = [
            "$rootScope",
            "organizationSlug",
            "projectSlug",
            "projectManager",
            "iterationManager",
            "portfolioManager",
            "programIncrementManager",
            "$q"
        ];

        public project:Project;
        public iterations:Array<Iteration>;
        
        public currentIncrement:ProgramIncrement;
        public currentIteration:Iteration;
        public currentInterationId:number;
        
        public portfolio:Portfolio = null;

        private currentIncrementId:number;

        public loaded:ng.IPromise<ProgramIncrementProject>;


        constructor(private $rootScope:AppScope,
                    private organizationSlug:string,
                    private projectSlug:string,
                    private projectManager:ProjectManager,
                    private iterationManager:IterationManager,
                    private portfolioManager:PortfolioManager,
                    private programIncrementManager:ProgramIncrementManager,
                    private $q:ng.IQService) {


            trace("***WARN*** We are removing ProgramIncrementProject but it's still being created.");
            trace('TODO: STOP USING THIS');

            this.loaded = $q.all([
                projectManager.loadProject(organizationSlug, projectSlug).then((project:Project)=>{
                    this.project = $rootScope.project = project;
                }),

                iterationManager.loadIterations(organizationSlug, projectSlug).then((iterations)=>{
                    this.iterations = $rootScope.iterations = iterations;
                }),

                portfolioManager.loadPortfolioForProject(projectSlug).then((portfolio:Portfolio) => {
                    if(portfolio.id) {
                        this.portfolio = portfolio;
                    }
                })

            ]).then(() => {
                return this;
            });

        }

        public onIterationCreated(iterationId:number) {
            this.iterationManager.loadIteration(this.organizationSlug, this.projectSlug, iterationId)
                .$promise
                .then((iteration) => {
                    this.iterations.push(iteration);
                });
        }

        public setCurrentIncrement(incrementId:number) {
            
            if(this.currentIncrement && incrementId == this.currentIncrement.id) {
                return this.$q.resolve(this.currentIncrement);
            }
            
            let p = this.programIncrementManager
                .loadIncrement(this.projectSlug, incrementId)
                .then((increment) => {
                    let iterationId = increment.iteration_id;
                    this.currentIteration = <Iteration>_.findWhere(this.iterations, {id:iterationId});
                    this.currentInterationId = iterationId;
                    this.currentIncrement = increment;
                    this.$rootScope.$broadcast('incrementChanged');
                    return increment;
                });

            // this.loaded = this.$q.all([this.loaded, p]).then(() => this);

            return p;
        }

        public setCurrentIncrementByIteration(iterationId:number) {
            this.currentIteration = <Iteration>_.findWhere(this.iterations, {id:iterationId});
            this.currentInterationId = iterationId;
            trace('Selecting current increment' + iterationId + this.currentIteration);
            return this.programIncrementManager
                .getIncrementByIteration(this.projectSlug, iterationId)
                .then((increment) => {
                    this.currentIncrement = increment;
                    return increment;
                });
        }
    }
}