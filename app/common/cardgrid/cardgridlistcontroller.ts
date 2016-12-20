/// <reference path='../../_all.ts' />

module scrumdo {

    interface CardGridListScope extends ng.IScope {
        cellData: CardGridCellData;
        sortOrder: string|Function;
    }

    export class CardGridListController {
        public static $inject:Array<string> = [
            "$scope"
        ];

        constructor(protected $scope:CardGridListScope) {
            $scope.sortOrder = $scope.sortOrder || 'rank';
            $scope.cellData.loaded.then(()=>this.$scope.$emit('cardsLoaded'))

        }

    }
}