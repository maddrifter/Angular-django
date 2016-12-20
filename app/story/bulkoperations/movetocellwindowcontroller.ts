/// <reference path='../../_all.ts' /> 

module scrumdo {
    export class MoveToCellWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "cells",
            "headers"
        ];

        private selectedCell: number;

        constructor(
            private scope,
            private cells,
            private headers) {

            this.selectedCell = -1;
        }

        ok() {
            this.scope.$close(this.selectedCell);
        }
    }
}