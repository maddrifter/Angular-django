/// <reference path='../../_all.ts' />

module scrumdo {
    import IModalService = angular.ui.bootstrap.IModalService;
    import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
    import IModalScope = angular.ui.bootstrap.IModalScope;

    export class DeleteCellConfirmService {
        public static $inject:Array<string> = [ "$uibModal", "urlRewriter"];

        constructor(private $modal:IModalService, private urlRewriter:URLRewriter) {

        }

        public confirm(cellsToDelete:Array<BoardHeader|BoardCell>):ng.IPromise<any> {
            var dialog:IModalServiceInstance = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("board/boardeditor/deletecellconfirmation.html"),
                controller: 'DeleteCellConfirmationController',
                controllerAs: 'ctrl',
                size: "md",
                backdrop: "static",
                keyboard: true,
                resolve: {
                    cellsToDelete: () => cellsToDelete
                }
            });

            return dialog.result;
        }

    }



    export class DeleteCellConfirmationController {
        public static $inject:Array<string> = [
            "organizationSlug",
            "projectSlug",
            "boardProject",
            "cellsToDelete",
            "$scope"
        ];

        public selectedCells:Array<number>= [];
        public cellsMinusDeleted:Array<BoardCell>;

        constructor(private organizationSlug:string,
                    private projectSlug:string,
                    private boardProject:BoardProject,
                    private cellsToDelete:Array<BoardHeader|BoardCell>,
                    private scope:IModalScope
        ) {

            this.cellsMinusDeleted = <Array<BoardCell>>_.difference(boardProject.boardCells, cellsToDelete);

        }

        public confirmDelete() {
            this.scope.$close(this.selectedCells);
        }

    }
}