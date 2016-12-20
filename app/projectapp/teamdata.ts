/// <reference path='../_all.ts' />

module scrumdo {
    export class TeamDatastore {
        public project:Project;
        public backlog:Array<Story>;
        public epics:Array<Epic>;
        public assignments:Array<number>;
        public iterations:Array<Iteration>;
        public boardCells:Array<BoardCell>;
        public canWrite:boolean;
        // public iterationStoryMap:{[id:string]:Array<Story>};
    }
}