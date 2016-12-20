/// <reference path='../_all.ts' />

module scrumdo {

    import IPromise = angular.IPromise;
    export interface RiskProject {
        name: string;
        slug: string;
        color: number;
        icon: string;
    }

    export interface RiskIteration {
        id: number;
        name: string;
        project: string;
        project_slug: string;
    }

    export interface RiskCard {
        id: number;
        project_slug: string;
        prefix: string;
        summary: string;
        number: number;
    }

    export interface Risk {
        id: number;
        description: string;
        severity_1: number;
        severity_2: number;
        severity_3: number;
        severity_4: number;
        severity_5: number;
        severity_6: number;
        severity_7: number;
        probability: number;
        portfolio_id: number;
        cards: RiskCard[];
        iterations: RiskIteration[];
        projects: RiskProject[];
    }

    export interface RiskResource extends ng.resource.IResourceClass<any> {

    }

    export interface SystemRiskResource extends ng.resource.IResourceClass<any>{
        
    }

    export class RisksManager {

        private Risks: RiskResource;
        private SystemRisks: SystemRiskResource;

        public static $inject:Array<string> = [
            "$resource",
            "organizationSlug"
        ];

        constructor(private $resource,
                    private organizationSlug:string) {
            this.Risks = <RiskResource> this.$resource(API_PREFIX + "organizations/:organizationSlug/portfolio/:portfolioId/risks/:id",
                {
                    id: '@id',
                    organizationSlug: 'organizationSlug',
                    portfolioId: 'portfolioId'
                },
                {
                    save: {
                        method: 'PUT',
                        params: {
                            id: '@id',
                            organizationSlug: 'organizationSlug',
                            portfolioId: 'portfolioId'
                        }
                    },
                    create: {
                        method: 'POST',
                        params: {
                            id: '@id',
                            organizationSlug: 'organizationSlug',
                            portfolioId: 'portfolioId'
                        }
                    }
                });

            this.SystemRisks = <SystemRiskResource> this.$resource(API_PREFIX +                         "organizations/:organizationSlug/projects/:projectSlug/systemrisks/iteration/:iterationId",
                {
                    organizationSlug: 'organizationSlug',
                    projectSlug: 'projectSlug',
                    iterationId: 'iterationId'
                }
            );
        }

        public createStub = (portfolio:Portfolio):Risk => {
            let stub = {
                id: -1,
                description: '',
                severity_1: 0,
                severity_2: 0,
                severity_3: 0,
                severity_4: 0,
                severity_5: 0,
                severity_6: 0,
                severity_7: 0,
                probability: 50,
                portfolio_id: 0,
                cards: [],
                iterations: [],
                projects: []
            }

            portfolio.risk_types.forEach((val, index)=>{
                stub['severity_' + (index+1)] = val == '' ? 0 : 1;
            })

            return stub
        }

        public deleteRisk(portfolioId, risk) {
            return risk.$delete({portfolioId, organizationSlug:this.organizationSlug})
        }
        public saveRisk(portfolioId:number, risk) {
            return risk.$save({portfolioId, organizationSlug:this.organizationSlug})
        }

        public createRisk(portfolioId:number, risk:Risk) {
            let r:any = new this.Risks();
            _.extend(r, risk)
            delete r.id;
            return r.$create({portfolioId:portfolioId, organizationSlug:this.organizationSlug});
        }

        public loadRisksForIteration(portfolioId:number, iterationId:number) {
            return this.Risks.query({organizationSlug:this.organizationSlug, portfolioId:portfolioId, iterationId:iterationId}).$promise
        }

        public loadSystemRisks(projectSlug: string, iterationId:number) : ng.IPromise<any>{
            return this.SystemRisks.query({organizationSlug:this.organizationSlug, projectSlug:projectSlug, iterationId:iterationId}).$promise
        }
        
        public loadRisksForStory(portfolioId:number, storyId:number) {
            return this.Risks.query({organizationSlug:this.organizationSlug, portfolioId:portfolioId, storyId:storyId}).$promise
        }

    }
}