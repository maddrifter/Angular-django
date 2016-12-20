/// <reference path='../_all.ts' />

module scrumdo{

    interface thisScope extends ng.IScope{
        isroot: boolean;
        project: Project;
        iterationid: number;
        incrementid: number;
    }

    interface CellCards {
        0: Array<Story>, 
        1: Array<Story>, 
        2: Array<Story>, 
        3: Array<Story>
    };

    interface bigPictureSystemRisks{
        'wip': Array<any>,
        'duedate': Array<any>,
        'aging': Array<any>
    };

    interface CardDpendency{
        parent: number,
        siblings: number
    }

    export class BigPictureStatsController{

        public static $inject: Array<string> = [
            "$scope",
            "projectSlug",
            "bigPictureManager",
            "urlRewriter",
            "storyEditor"
        ];

        public stats: any;
        private loaded: boolean;
        private templateName: string;
        private searchingCell: string;
        private cellCards: CellCards;
        private cardsLoaded: boolean;
        private filterQuery: string;
        private systemRisks: bigPictureSystemRisks;
        private cardsDependency: CardDpendency;
        private releaseFilter: Story;

        constructor(private $scope: thisScope,
                    private projectSlug: string,
                    private bigPictureManager: BigPictureManager,
                    private urlRewriter: URLRewriter,
                    private storyEditor: StoryEditor){
            
            this.loaded = false;
            this.cellCards = {0: null, 1: null, 2: null, 3: null};
            this.systemRisks = {"wip": [], "duedate": [], "aging": []};
            this.cardsDependency = {"parent": 0, "siblings": 0};
            this.$scope.$root["dependency-data"] = {};
            this.filterQuery = "";
            this.releaseFilter = null;
            this.templateName = this.urlRewriter.rewriteAppUrl("bigpicture/cardlists.html");

            this.loadStats();

            this.$scope.$on("$destroy", this.onDestroy);
            this.$scope.$on("releaseCardChanged", this.onReleaseChanged);
        }

        onReleaseChanged = (event, card) => {
            if(card != null){
                this.releaseFilter = card;
            }else{
                this.releaseFilter = null;
            }
            this.cellCards = {0: null, 1: null, 2: null, 3: null};
            this.loadStats(true);
        }

        onDestroy = () => {
            delete this.$scope.$root["dependency-data"];
        }

        redrawLines(){
            this.$scope.$emit("redrawLines", null);
        }

        loadStats(refresh = false){
            if(this.$scope.isroot){
                this.bigPictureManager.loadIterationStats(this.$scope.project.slug, 
                                                          this.$scope.iterationid).then((stats) => {
                    this.stats = stats;
                    this.loaded = true;
                });
            }else{
                this.loaded = false;
                this.bigPictureManager.loadIncrementStats(this.$scope.project.slug, 
                                                          this.$scope.incrementid, 
                                                          this.releaseFilter).then((stats) => {
                    this.stats = stats;
                    this.loaded = true;
                    if(refresh === true){
                        this.loadDependency();
                    }else{
                        this.loadSystemRisks();
                    }
                });
            }
        }

        loadSystemRisks(){
            if(!this.$scope.isroot){
                this.bigPictureManager.loadIncrementSystemRisks(this.$scope.project.slug, 
                                                                this.$scope.incrementid).then((risks) => {
                    _.forEach(risks, (risk:any) => {
                        this.systemRisks[risk.type].push(risk);
                    });
                    this.loadDependency();
                });
            }
        }

        loadDependency(){
            if(!this.$scope.isroot){
                this.bigPictureManager.loadIncrementDependency(this.$scope.project.slug, 
                                                               this.$scope.incrementid, 
                                                               this.releaseFilter).then((data) => {
                    this.cardsDependency = data;
                    if(this.$scope.$root["dependency-data"]!=null){
                        this.$scope.$root["dependency-data"][this.$scope.project.id] = data;
                    }
                    this.redrawLines();
                });
            }
        }

        loadCards(cellType){
            this.searchingCell = cellType;
            this.cardsLoaded = false;
            if(this.cellCards[cellType] != null){
                this.cardsLoaded = true;
                return true;
            }
            if(this.$scope.isroot){
                this.bigPictureManager.loadIterationCards(this.$scope.project.slug, 
                                                          this.$scope.iterationid, 
                                                          cellType).then((cards) => {
                    this.cellCards[cellType] = cards;
                    this.cardsLoaded = true;
                });
            }else{
                this.bigPictureManager.loadIncrementCards(this.$scope.project.slug, 
                                                          this.$scope.incrementid, 
                                                          cellType, 
                                                          this.releaseFilter).then((cards) => {
                    this.cellCards[cellType] = cards;
                    this.cardsLoaded = true;
                });
            }
        }

        selectStory(story){
            this.storyEditor.editStory(story, null);
        }

        filterCard = (card) => {
            if(this.filterQuery == "") return true;
            var v = `${card.prefix}-${card.number} ${card.summary}`;
            return v.toLowerCase().indexOf(this.filterQuery.toLowerCase()) !== -1;
        }

        closeSearch(cell){
            this.searchingCell = null;
            this.cardsLoaded = false;
        }

        projectSummary(project: Project){
            this.bigPictureManager.showProjectSummary(project, 
                                                      this.$scope.incrementid,
                                                      this.$scope.iterationid,
                                                      this.$scope.isroot);
        }

        cellClass(cell){
            return this.bigPictureManager.cellClass(cell);
        }

        cellIcon(cell){
            return this.bigPictureManager.cellIcon(cell);
        }
    }
}