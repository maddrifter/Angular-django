/// <reference path='../_all.ts' />

module scrumdo {
    export class RiskEditWindowController {
        public static $inject:Array<string> = [
            "risk",
            "portfolio",
            "$scope",
            "confirmService"
        ];

        public artifacts = [];

        constructor(public risk:Risk,
                    public portfolio:Portfolio,
                    public $scope,
                    private confirmService:ConfirmationService) {
            this.risk = angular.copy(risk);

            this.artifacts = risk.iterations.map((i)=>({type:'iteration', iteration:i}))
            this.artifacts = this.artifacts.concat(risk.projects.map((i)=>({type:'project', project:i})))
            this.artifacts = this.artifacts.concat(risk.cards.map((i)=>({type:'card', card:i})))

        }

        public deleteRisk() {
            this.confirmService
                .confirm('Confirm','Are you sure you want to delete this risk?','No','Yes')
                .then(this.confirmDelete)
        }

        public confirmDelete = () => {
            this.$scope.$close("DELETE");
        }

        public ok() {
            this.risk.cards = this.artifacts.filter((a)=>a.type=='card').map((a)=>a.card)
            this.risk.iterations = this.artifacts.filter((a)=>a.type=='iteration').map((a)=>a.iteration)
            this.risk.projects = this.artifacts.filter((a)=>a.type=='project').map((a)=>a.project)
            this.$scope.$close(this.risk);
        }
    }
}