/// <reference path='../_all.ts' />

module scrumdo {
    import IModalService = angular.ui.bootstrap.IModalService;
    import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

    export class PortfolioWindowService {
        public static $inject:Array<string> = [
            "$uibModal","urlRewriter"
        ];

        protected dialog:IModalServiceInstance;

        constructor(private $modal:IModalService, private urlRewriter:URLRewriter) {
            
        }

        configure(portfolio) {
            this.dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("portfolio/portfoliowindow.html"),
                windowClass: 'portfolio-window',
                controller: 'PortfolioWindowController',
                controllerAs: 'ctrl',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    portfolio: () => angular.copy(portfolio)
                }
            });

            return this.dialog.result;
        }


        openCreateWindow() {

            this.dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("portfolio/portfoliowindow.html"),
                windowClass: 'portfolio-window',
                controller: 'PortfolioWindowController',
                controllerAs: 'ctrl',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    portfolio: () => null
                }
            });

            return this.dialog.result;
        }

    }
}