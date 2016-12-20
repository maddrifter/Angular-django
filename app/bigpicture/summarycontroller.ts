/// <reference path='../_all.ts' />

module scrumdo{

    interface thisScope extends ng.IScope{
        $dismiss: any;
    }

    export class BigPictureSummaryController{

        public static $inject: Array<string> = [
            "$scope",
            "bigPictureManager",
            "project",
            "incrementId",
            "iterationId",
            "isRoot"
        ];

        private loaded: boolean;

        constructor(public $scope: thisScope,
                    private bigPictureManager: BigPictureManager,
                    private project: Project,
                    private incrementId: number,
                    private iterationid: number,
                    private isRoot: boolean){
            
        }

        close(){
            this.$scope.$dismiss();
        }

        cellClass(cell){
            return this.bigPictureManager.cellClass(cell);
        }

        cellIcon(cell){
            return this.bigPictureManager.cellIcon(cell);
        }
    }
}
