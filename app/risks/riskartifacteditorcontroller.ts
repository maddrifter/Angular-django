/// <reference path='../_all.ts' />

module scrumdo {

    import IHttpPromise = angular.IHttpPromise;
    interface ArtifactSearchResult {
        query: string;
        cards:Array<{prefix:string, number:number, summary:string}>;
        projects:Array<{slug:string, name:string}>;
        iterations:Array<{name:string, slug:string, id:number, project:string}>;
    }

    import IHttpService = angular.IHttpService;

    export class RiskArtifactEditorController {
        public static $inject:Array<string> = [
            "$http",
            "$scope",
            "$element",
            "organizationSlug"

        ];

        public dropdownOpen:boolean = false;
        public userInput:string = '';
        public search:Function;
        public lastQuery:string;

        public results:ArtifactSearchResult = {
            query: '',
            cards: [],
            projects: [],
            iterations:[]
        }
        public allEntries:Array<any>;


        constructor(private $http:IHttpService,
                    private $scope,
                    private $element,
                    private organizationSlug:string) {

            this.search = _.debounce(this._search, 500);

        }

        public removeArtifact(artifact) {
            let i = this.$scope.artifacts.indexOf(artifact)
            if(i>=0) this.$scope.artifacts.splice(i,1)
        }

        public addArtifact(artifact) {
            this.dropdownOpen = false;
            if(this.$scope.artifacts.indexOf(artifact) >= 0) return;
            this.$scope.artifacts.push(artifact);
            this.userInput = '';
            this.$element.find('input').focus();
        }

        private keypress = () => {
            if (this.userInput == '') {
                this.dropdownOpen = false;
                return;
            }
            this.search();
        }

        private _search() {
            if(this.lastQuery && this.lastQuery.toLowerCase() == this.userInput.toLowerCase()) return;
            const url = `/api/v3/organizations/${this.organizationSlug}/portfolio/${this.$scope.portfolioId}/risks/targets/`
            this.lastQuery = this.userInput;
            this.$http.get(url,{params:{query:this.userInput}}).then((response) => {
                let results:ArtifactSearchResult = <ArtifactSearchResult>response.data;
                if(results.query.toLowerCase() == this.lastQuery.toLowerCase()) {
                    this.lastQuery = null;
                    console.log('risk options:' + results)
                    this.results = results

                    this.allEntries = results.projects.map((p:any)=>({type:'project', project:p}))
                    this.allEntries = this.allEntries.concat(results.cards.map((c:any)=>({type:'card', card:c})))
                    this.allEntries = this.allEntries.concat(results.iterations.map((i:any)=>({type:'iteration', iteration:i})))

                    this.dropdownOpen = true;
                };
            })
        }



    }
}