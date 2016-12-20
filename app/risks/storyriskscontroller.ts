/// <reference path='../_all.ts' />

module scrumdo {

    interface StoryRisksScope extends ng.IScope{
        project: Project;
        story: Story;
    }

    export class StoryRisksController {
        public static $inject:Array<string> = [
            "$scope",
            "risksManager",
            "projectDatastore",
            "urlRewriter",
            "$uibModal",
            "hotkeys"
        ];

        private risks: Array<Risk>;
        public hoverRisk = null;
        private score = (risk) => -1 * riskScore(risk);
        public riskNames = [
            '', 'Low', 'Medium', 'High', '', 'Urgent'
        ];
        private _artifactMap = {};
        public riskColor = (risk:Risk) => '#' + SCRUMDO_BRIGHT_COLORS[risk.id % SCRUMDO_BRIGHT_COLORS.length];

        constructor(public $scope: StoryRisksScope,
                    private risksManager: RisksManager,
                    public projectData:ProjectDatastore,
                    private urlRewriter:URLRewriter,
                    private $modal: ng.ui.bootstrap.IModalService,
                    private hotkeys){
            this.risks = [];
            if(this.$scope.project.portfolio_id != null){
                this.loadStoryRisks();
            }
        }

        public portfolio = ():Portfolio => {
            return this.projectData.portfolio;
        }

        public riskArtifacts(risk) {
            if(!this._artifactMap[risk.id]) {
                if(risk.cards != null){
                    let result = risk.cards.map((o) => ({type:'card', card:o}))
                    result = result.concat(risk.iterations.map((o) => ({type:'iteration', iteration:o})))
                    result = result.concat(risk.projects.map((o) => ({type:'project', project:o})))
                    this._artifactMap[risk.id] = result;
                }
            }

            return this._artifactMap[risk.id];
        }

        public hover = (risk) => {
            if(!risk) return this.hoverRisk = null;
            this.hoverRisk = risk;
        }

        loadStoryRisks = () => {
            this._artifactMap = {};
            this.risksManager.loadRisksForStory(this.$scope.project.portfolio_id, this.$scope.story.id).then((risks) => {
                this.risks = risks;
            });

        }

        bindCardEscKey = () => {
            this.$scope.$emit('bindcardesckey', {});
        }

        public addRisk() {
            this.hotkeys.del('esc');
            let risk = this.risksManager.createStub(this.projectData.portfolio);


            risk.cards = [
                {
                    id: this.$scope.story.id,
                    project_slug: this.$scope.story.project_slug,
                    prefix: this.$scope.story.prefix,
                    summary: this.$scope.story.summary,
                    number: this.$scope.story.number
                }
            ];

            const dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("risks/riskeditwindow.html"),
                backdrop: "static",
                keyboard: false,
                controller: 'RiskEditWindowController',
                controllerAs: 'ctrl',
                resolve: {
                    risk: () => risk,
                    portfolio: this.portfolio
                }
            });

            dialog.result.then((risk)=>{
                this.risksManager
                    .createRisk(this.portfolio().id, risk)
                    .then(this.loadStoryRisks);
            });

            dialog.closed.then(this.bindCardEscKey);
        }

        public editRisk(risk) {
            this.hotkeys.del('esc');
            const dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("risks/riskeditwindow.html"),
                backdrop: "static",
                keyboard: false,
                controller: 'RiskEditWindowController',
                controllerAs: 'ctrl',
                resolve: {
                    risk: () => risk,
                    portfolio: this.portfolio
                }
            });

            dialog.result.then((editedrisk)=>{
                if(editedrisk == "DELETE") {
                    this.risksManager
                        .deleteRisk(this.portfolio().id, risk)
                        .then(this.loadStoryRisks);
                } else {
                    angular.copy(editedrisk, risk)
                    this.risksManager
                        .saveRisk(this.portfolio().id, risk)
                        .then(this.loadStoryRisks);
                }
            });

            dialog.closed.then(this.bindCardEscKey);
        }
    }
}