/// <reference path='../_all.ts' />

module scrumdo{

    export class BigPictureItrController{

        public static $inject: Array<string> = [
            "$scope",
            "projectDatastore",
            "portfolioManager",
            "bigPictureManager",
            "urlRewriter",
            "userService"
        ]

        private popoverTemplate: string = '';
        private portfolio: Portfolio;
        private iterationId: number;
        private incrementId: number;
        private cardFilter: Story;
        private filterOpen: boolean;
        private filterTemplate: string;
        private cardsLoaded: boolean;
        private filterQuery: string;

        constructor(public $scope: ng.IScope,
                    private projectData: ProjectDatastore,
                    private portfolioManager: PortfolioManager,
                    private bigPictureManager: BigPictureManager,
                    private urlRewriter: URLRewriter,
                    private userService: UserService){

            this.iterationId = this.projectData.currentIteration.id;
            this.incrementId = this.projectData.currentIncrement.id;
            this.filterOpen = false;
            this.cardsLoaded = false;
            this.filterQuery = "";
            this.filterTemplate = this.urlRewriter.rewriteAppUrl("bigpicture/cardlists.html");

            this.popoverTemplate = this.urlRewriter.rewriteAppUrl("bigpicture/legends.html");
            this.initData();

            this.$scope.$on("redrawLines", this.drawConnectingLines);
            this.$scope.$on("hideDropDown", this.hideFilter);
        }

        private userHasAccess(project){
            return this.userService.canRead(project.slug);
        }

        private hasAccessToLevel(level: PortfolioLevel){
            var access: boolean = false;
            _.forEach(level.projects, (project) => {
                if(this.userService.canRead(project.slug)){
                    access = true;
                }
            });
            return access;
        }

        private initData(){
            this.portfolio = this.projectData.portfolio;
            setTimeout(() => {
                this.drawConnectingLines();
            },100);
        }

        private hideFilter = () =>{
            if(this.filterOpen == true){
                this.filterQuery = "";
                this.filterOpen = !this.filterOpen;
            }
        }

        private toggleFilter($event: MouseEvent){
            $event.preventDefault();
            $event.stopPropagation();
            this.filterQuery = "";
            this.filterOpen = !this.filterOpen;
            if(this.filterOpen){
                this.loadCards();
            }
        }

        private getFilterLabel(){
            if(this.cardFilter == null){
                return "Card Name";
            }else{
                return `${this.cardFilter.prefix}-${this.cardFilter.number} ${this.cardFilter.summary}`;
            }
        }

        private doNothng($event: MouseEvent){
            $event.stopPropagation();
            $event.preventDefault();
        }

        private clearSearch(){
            this.filterQuery = "";
            this.filterOpen = false;
            var previousFilter = this.cardFilter; 
            this.cardFilter = null;
            if(previousFilter != null){
                this.$scope.$broadcast("releaseCardChanged", this.cardFilter);
            }
        }

        private loadCards(){
            this.cardsLoaded = true;
        }

        private selectStory(card){
            this.cardFilter = card;
            this.filterOpen = false;
            this.$scope.$broadcast("releaseCardChanged", this.cardFilter);
        }

        private filterCard = (card) => {
            if(this.filterQuery == "") return true;
            var v = `${card.prefix}-${card.number} ${card.summary}`;
            return v.toLowerCase().indexOf(this.filterQuery.toLowerCase()) !== -1;
        }

        private drawConnectingLines = () => {
            let data = [];
            if(this.$scope.$root == null) return;
            delete this.$scope.$root['svgConnectorsData']
            var dpendencyData = this.$scope.$root["dependency-data"];
            _.forEach(this.portfolio.levels, (level: PortfolioLevel) => {
                _.forEach(level.projects, (project: PortfolioProjectStub) => {
                    _.forEach(project.parents, (parent:any) => {
                        if(dpendencyData==null || dpendencyData[project.id] == null ){
                            var r = 0,
                                s = 1;
                        }else{
                            // draw parent to child dependencies lines 
                            var maxDependency = this.getMaxDependency(dpendencyData),
                                dependency = dpendencyData[project.id]['parent'][parent.id],
                                r = (((dependency) * (7)) / (maxDependency)),
                                s = r > 0 ? r : 1;
                        }
                        data.push({ start: `#project-box-${parent.id}`, 
                                    end: `#project-box-${project.id}`, 
                                    strokeWidth: s, 
                                    strokeDasharray: r>0?0:5});
                    });
                    // draw sibling dependencies lines
                    if(dpendencyData!=null && dpendencyData[project.id] != null ){
                        var maxDependency = this.getMaxDependency(dpendencyData, 'sibling');
                        for(var k in dpendencyData[project.id]['sibling']){
                            var dependency =  dpendencyData[project.id]['sibling'][k],
                                r = (((dependency) * (5)) / (maxDependency)),
                                s = r > 0 ? r : 1;
                            if(r>0){
                                data.push({ start: `#project-box-end-${k}`, 
                                            end: `#project-box-end-${project.id}`, 
                                            strokeWidth: s, 
                                            strokeDasharray: r>0?0:5,
                                            orientation: 'curve',
                                            stroke: '#f7b5a0'  });
                            }
                        }
                    }
                });
            });
            this.$scope.$root['svgConnectorsData'] = data;
            this.$scope.$broadcast("drawSvgConnectors", null);
        }

        private getMaxDependency(data, type='parent'){
            var n: number = 0;
            for(var k in data){
                var d = data[k];
                if(type=='parent'){
                    var v = _.max(d[type] , (o:number) => o );
                }else{
                    var v = _.max(d[type] , (o:number) => o );
                }
                n = n > v ? n : v;
            }
            return n;
        }

    }
}