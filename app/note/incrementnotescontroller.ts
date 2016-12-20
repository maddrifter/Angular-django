/// <reference path='../_all.ts' />

module scrumdo {
    export class IncrementNotesController {
        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "projectSlug",
            "API_PREFIX",
            "$resource",
            "incrementNoteService"
        ];

        private noteId: number = null;
        private notes: Array<note>;
        private showInitial:number;
        private showAll:boolean;
        private scrollbarConfig: {};


        constructor(
            public scope,
            private organizationSlug:string,
            private projectSlug: string,
            private API_PREFIX:string,
            public resource: ng.resource.IResourceService,
            private noteService: IncrementNoteService) {
            this.showInitial = 3;
            this.showAll = false;
            this.loadIncrementNotes();
            this.scrollbarConfig = {
                autoHideScrollbar: false, 
                theme: 'dark-3',
                advanced:{
                    updateOnContentResize: true
                },
                scrollButtons: {
                    enable: true
                },
                setHeight: 400,
                scrollInertia: 500
            };
        }

        public loadIncrementNotes(){
            this.noteService.loadIterationNotes(this.organizationSlug,
                                                this.projectSlug, 
                                                this.scope.increment.id).then((notes) => {
                                                    this.notes = notes;
                                                });
        }

        public showNoteWindow(noteId=null){
            this.noteService.showNoteWindow(this.organizationSlug, 
                                            this.scope.project, 
                                            this.scope.increment,
                                            noteId);
        }

        public editNote(note){
            this.noteService.showNoteWindow(this.organizationSlug, 
                                            this.scope.project, 
                                            this.scope.increment,
                                            note.id);
        }

        public showLessNotes(){
            this.showAll = false;
        }

        public showAllNotes(){
            this.showAll = true;
        }
    }

}