/// <reference path='../../_all.ts' />

module scrumdo {
    export class EpicController {
        public static $inject: Array<string> = [
            "$scope",
            "$attrs",
            "$element",
            "epicWindowService"
        ];

        private parent: boolean = false;

        constructor(
            public scope,
            public attrs,
            public element: ng.IAugmentedJQuery,
            public epicWindowService: EpicWindowService) {

            this.scope.ctrl = this;
            if (this.scope.parent != null) {
                this.parent = this.scope.parent;
            }
        }

        onEdit(epic) {
            this.epicWindowService.editEpic(this.scope.project, epic, this.scope.epics);
        }

        toggleChild(epic) {
            epic.listChild = !epic.listChild;
            if(epic.listChild){
                this.scope.$root.$broadcast("loadEpicCards", epic);
            }else{
                this.refreshStats(epic);
            }
        }

        toggleCards(epic) {
            epic.listCards = !epic.listCards;
            if(!epic.listCards){
                this.refreshStats(epic);
            }else{
                this.scope.$root.$broadcast("loadEpicCards", epic);
            }
        }

        refreshStats(epic){
            this.scope.$root.$broadcast("loadEpicStats", epic);
            this.scope.$root.$broadcast("loadEpicCards", null);
        }
    }
}