/// <reference path='../_all.ts' />

module scrumdo {

    import IPromise = ng.IPromise;
    import IHttpService = ng.IHttpService;



    export interface PortfolioProjectStub {
        id?:number,    // does not exist on projects we're creating
        slug?:string,  // does not exist on projects we're creating

        uid?: string,  // uid only used during the initial building of the portfolio to uniquely reference a parent.

        name:string,
        work_item_name:string,
        color:number|string,
        icon:string,
        active: boolean,
        parents:Array<{id?:number, slug?:string, name:string}>
    }

    export interface PortfolioLevel extends ng.resource.IResource<PortfolioLevel> {
        name: string;
        item_name: string;
        level_number: number;
        icon: string;
        projects: Array<PortfolioProjectStub>;

        projectsCache?:Array<Project>; // Some of the UI wants actualized projects, those parts set this up

    }
    
    export interface Portfolio extends ng.resource.IResource<Portfolio> {
        id: number;
        root: {id:number, slug:string, name:string};
        levels: Array<PortfolioLevel>;
        $create(options):ng.IPromise<Portfolio>;
        risk_types: Array<string>;

        rootCache?:Project;  // Some of the UI wants actualized projects, those parts set this up
    }


    interface PortfolioResource extends ng.resource.IResourceClass<Portfolio> {
        byProject(options):any;
    }



    export class PortfolioManager {
        public static $inject:Array<string> = [
            "organizationSlug",
            "$resource",
            "$http",
            "API_PREFIX"
        ];
        public portfolioApi:PortfolioResource;

        constructor(private organizationSlug,
                    private resource:ng.resource.IResourceService,
                    private $http:IHttpService,
                    private API_PREFIX:string) {
            this.portfolioApi = <PortfolioResource> this.resource(this.API_PREFIX + "organizations/:organizationSlug/portfolio/:id",
                {
                    id: "@id",
                    organizationSlug: this.organizationSlug
                },
                {
                    byProject: {
                        method: "GET",
                        url: this.API_PREFIX + "organizations/:organizationSlug/portfolio/project/:project_slug",
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    "delete": {
                        method: "DELETE",
                        params: {
                            id: "@id",
                            organizationSlug: this.organizationSlug
                        }
                    },
                    create: {
                        method: "POST",
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    },
                    save: {
                        method: "PUT",
                        params: {
                            id: "@id",
                            organizationSlug: this.organizationSlug
                        }
                    }
                });
        }

        loadPortfolioForProject = (projectSlug:string):IPromise<Portfolio> => {
            return this.portfolioApi.byProject({organizationSlug: this.organizationSlug, project_slug:projectSlug}).$promise;
        }

        loadPortfolio = (portfolioId:number):IPromise<Portfolio> => {
            return this.portfolioApi.get({organizationSlug: this.organizationSlug, id:portfolioId}).$promise;
        }

        loadPortfolios = ():IPromise<Array<Portfolio>> => {
            return this.portfolioApi.query({organizationSlug: this.organizationSlug}).$promise
                .then((result)=>{
                    for(let portfolio of result) {
                        for(let level of portfolio.levels){
                            for(let project of level.projects) {
                                project.color = '#' + colorToHex(<number>project.color);
                            }
                        }
                    }
                    return result;
                });
        }

        createPortfolio = (portfolioProperties):IPromise<Portfolio> => {
            let portfolio = new this.portfolioApi();
            _.extend(portfolio, portfolioProperties);
            return portfolio.$create({organizationSlug: this.organizationSlug});
        }

        updatePortfolio = (portfolio:Portfolio):IPromise<Portfolio> => {
            return portfolio.$save({organizationSlug: this.organizationSlug});
        }

        // There is a special API call to completely build out a portfolio based on a PortfolioStub from the
        // creation wizard API.
        buildPortfolio = (portfolio:PortfolioStub) => {
            let url = `${this.API_PREFIX}organizations/${this.organizationSlug}/portfolio/build`;
            return this.$http.post(url,portfolio);
        }

    }




}