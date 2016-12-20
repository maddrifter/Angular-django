/// <reference path='../_all.ts' />

module scrumdo{

    interface thisScope extends ng.IScope{
        rootproject: Project,
        level: PortfolioLevel;
        incrementid: number;
    }

    interface CellCards {
        0: Array<Story>, 
        1: Array<Story>, 
        2: Array<Story>, 
        3: Array<Story>
    };

    export class BigPictureLevelStatsController{

        public static $inject: Array<string> = [
            "$scope",
            "projectSlug",
            "bigPictureManager",
            "urlRewriter"
        ];

        public stats: any;
        private loaded: boolean;
        private releaseFilter: Story;

        constructor(private $scope: thisScope,
                    private projectSlug: string,
                    private bigPictureManager: BigPictureManager,
                    private urlRewriter: URLRewriter){
            
            this.loaded = false;
            this.releaseFilter = null;
            this.loadStats();

            this.$scope.$on("releaseCardChanged", this.onReleaseChanged);
        }

        loadStats(){
            this.bigPictureManager.loadPortfolioLevelStats(this.$scope.rootproject.slug, 
                                                           this.$scope.incrementid, 
                                                           this.$scope.level.level_number,
                                                           this.releaseFilter).then((stats) => {
                this.stats = stats;
                this.loaded = true;
            });
        }

        onReleaseChanged = (event, card) => {
            if(card != null){
                this.releaseFilter = card;
            }else{
                this.releaseFilter = null;
            }
            this.loadStats();
        }

        cellClass(cell){
            var classStr: string = cell;
            return classStr;
        }
    }
}