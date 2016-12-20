/// <reference path='../_all.ts' />

module scrumdo {
    export class UIState {
        public backlogOpen: boolean;
        public archiveOpen: boolean;
        public backlogSize: number;
        public loadBacklog: boolean;
        constructor() {
            this.backlogOpen = false;
            this.archiveOpen = false;
            this.loadBacklog = false;
            this.backlogSize = 0;
        }
    }
}