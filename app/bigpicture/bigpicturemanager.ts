/// <reference path='../_all.ts' />

module scrumdo {

    interface BigPictureResource extends ng.resource.IResourceClass<any>{
        projectIterationStats: any;
        projectIncrementStats: any;
        iterationCards:any;
        incrementCards: any;
        levelStats: any;
        incrementSystemRisks: any;
        incrementDependency: any;
    }

    export class BigPictureManager{

        public static $inject: Array<string> = [
            "$resource", 
            "API_PREFIX",
            "$q",
            "organizationSlug",
            "$uibModal",
            "urlRewriter"
        ];

        public BigPictureApi: BigPictureResource;
        private summaryPopup: ng.ui.bootstrap.IModalServiceInstance;

        constructor(private $resource: ng.resource.IResourceService,
                    private API_PREFIX: string,
                    private $q: ng.IQService,
                    private organizationSlug: string,
                    private $uibModal: ng.ui.bootstrap.IModalService,
                    private urlRewriter: URLRewriter
                    ){
                    
            this.BigPictureApi = <BigPictureResource> this.$resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/iteration/:iterationId/stats",
                {
                    organizationSlug: this.organizationSlug
                },
                {
                    projectIterationStats: {
                        isArray: false,
                        method: 'GET',
                        params: {
                            iterationId: "iterationId",
                            projectSlug: "projectSlug"
                        }
                    },

                    projectIncrementStats: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/increment/:incrementId/stats",
                        isArray: false,
                        method: 'GET',
                        params: {
                            incrementId: "incrementId",
                            projectSlug: "projectSlug"
                        }
                    },

                    iterationCards: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/iteration/:iterationId/cards",
                        isArray: true,
                        method: 'GET',
                        params: {
                            iterationId: "iterationId",
                            projectSlug: "projectSlug"
                        }
                    },

                    incrementCards: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/increment/:incrementId/cards",
                        isArray: true,
                        method: 'GET',
                        params: {
                            incrementId: "incrementId",
                            projectSlug: "projectSlug"
                        }
                    },

                    levelStats: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/increment/:incrementId/levelstats",
                        isArray: false,
                        method: 'GET',
                        params: {
                            incrementId: "incrementId",
                            projectSlug: "projectSlug"
                        }
                    },

                    incrementSystemRisks: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/increment/:incrementId/systemrisks",
                        isArray: true,
                        method: 'GET',
                        params: {
                            incrementId: "incrementId",
                            projectSlug: "projectSlug"
                        }
                    },

                    incrementDependency: {
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/bigpicture/increment/:incrementId/dependency",
                        isArray: false,
                        method: 'GET',
                        params: {
                            incrementId: "incrementId",
                            projectSlug: "projectSlug"
                        }
                    }
                }
            );

        }


        public loadIterationStats(projectSlug: string, iterationId: number): ng.IPromise<any>{
            var p = this.BigPictureApi.projectIterationStats({projectSlug: projectSlug, iterationId:iterationId}).$promise;
            return p;
        }

        public loadIncrementStats(projectSlug: string, incrementId: number, release: Story = null): ng.IPromise<any>{
            var releaseId = release != null ? release.id : null;
            var p = this.BigPictureApi.projectIncrementStats({projectSlug: projectSlug, incrementId:incrementId, releaseId: releaseId}).$promise;
            return p;
        }

        public loadIterationCards(projectSlug: string, iterationId: number, cellType: number){
            var p = this.BigPictureApi.iterationCards({projectSlug: projectSlug, iterationId:iterationId, cellType:cellType}).$promise;
            return p;
        }

        public loadIncrementCards(projectSlug: string, incrementId: number, cellType: number, release: Story = null){
            var releaseId = release != null ? release.id : null;
            var p = this.BigPictureApi.incrementCards({projectSlug: projectSlug, incrementId:incrementId, cellType:cellType, releaseId: releaseId}).$promise;
            return p;
        }

        public loadPortfolioLevelStats(projectSlug: string, incrementId: number, level_number: number, release: Story = null){
            var releaseId = release != null ? release.id : null;
            var p = this.BigPictureApi.levelStats({projectSlug: projectSlug, incrementId:incrementId, level_number:level_number, releaseId: releaseId}).$promise;
            return p;
        }

        public loadIncrementSystemRisks(projectSlug: string, incrementId: number){
            var p = this.BigPictureApi.incrementSystemRisks({projectSlug: projectSlug, incrementId:incrementId}).$promise;
            return p;
        }

        public loadIncrementDependency(projectSlug: string, incrementId: number, release: Story = null){
            var releaseId = release != null ? release.id : null;
            var p = this.BigPictureApi.incrementDependency({projectSlug: projectSlug, incrementId:incrementId, releaseId: releaseId}).$promise;
            return p;
        }

        public showProjectSummary(project: Project, incrementId: number, iterationId:number, isRoot:boolean){
            this.summaryPopup = this.$uibModal.open({
                size: "lg",
                controller: "bigPictureSummaryController",
                controllerAs: "ctrl",
                templateUrl: this.urlRewriter.rewriteAppUrl("bigpicture/projectsummary.html"),
                windowClass: "bigpicture-summary",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    project: () => project,
                    incrementId: () => incrementId,
                    iterationId: () => iterationId,
                    isRoot: () => isRoot
                }
            });

            return this.summaryPopup.result;
        }

        public cellClass(cell){
            var classStr: string = "";
            switch(cell){
                case "Waiting":
                    classStr = "waiting";
                    break;
                case "Commited":
                    classStr = "commited";
                    break;
                case "In Progress":
                    classStr = "inprogress";
                    break;
                case "Done":
                    classStr = "done";
                    break;
            }
            return classStr;
        }

        public cellIcon(cell){
            var classStr: string = "";
            switch(cell){
                case "Waiting":
                    classStr = "fa-hourglass-half";
                    break;
                case "Commited":
                    classStr = "fa-gears";
                    break;
                case "In Progress":
                    classStr = "fa-wrench";
                    break;
                case "Done":
                    classStr = "fa-check-circle";
                    break;
            }
            return classStr;
        }
    }
}