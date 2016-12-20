/// <reference path='../_all.ts' />

module scrumdo {
    export class NotesController {
        public static $inject: Array<string> = [
            "$scope",
            "noteService",
            "projectSlug",
            "organizationSlug",
            "editorManager",
            "confirmService",
            "$location",
            "$state",
            "attachmentsManager",
            "userService"
        ];

        private notes:Array<note> = [];
        private note:note;
        private noteCopy:note = null;
        private iterations:Array<any>;
        private filterIteration;
        private newComment:string;

        constructor(
            public scope,
            private service: NoteService,
            public projectSlug:string,
            public organizationSlug: string,
            public editorManager,
            public confirmService:ConfirmationService,
            public location:ng.ILocationService,
            public state:ng.ui.IStateService,
            public attachmentsManager:AttachmentsManager,
            public userService:UserService) {

            this.scope.$on("appLoaded", this.onAppLoaded);
        }

        onAppLoaded = () => {
            this.service.loadNotes(this.organizationSlug, this.projectSlug).then((notes) => {
                this.notes = notes;
                this.scope.$root.$emit('fullyLoaded');
            })
        }

        delete(){
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this note?", 
                "No", "Yes").then(this.onDeleteConfirm);
        }

        onDeleteConfirm = () => {
            this.service.deleteNote(this.organizationSlug, this.projectSlug, this.service.currentNote).then( () => {
                this.state.go("notes");
            })
        }

        edit(){
            this.noteCopy = angular.copy(this.service.currentNote);
            this.service.currentNote.editing = true;
            this.service.setIteration(this.service.currentNote.iteration_id); 
        }

        cancel(){
            if(this.service.currentNote.id == -1){
                this.state.go("notes");
                this.attachmentsManager.cleanTempAttachments(this.organizationSlug, 
                    this.projectSlug, this.service.currentNote.id, -1);
            }else{
                this.service.currentNote = this.noteCopy;
                this.scope.$emit('revertNote', this.noteCopy);
            }
        }

        save(){
            if(this.service.currentNote.id == -1){
                this.service.createNote(this.organizationSlug, this.projectSlug, this.newComment).then((note) => {
                    this.state.go("note", {noteId:note.id});
                    this.newComment = null;
                });
            }else{
                this.service.saveNote(this.organizationSlug, this.projectSlug).then((note) => {
                    this.service.currentNote.editing = false;
                });
            }
        }

        isValidNote(){
            if(this.service.currentNote.title == null) return false;
            return this.service.currentNote.title.trim() != '' && 
                this.service.noteIteration != null;
        }

        filterNotes = (note) => {
            if(typeof note === "undefined" && note == null){
                return false;
            }
            if((this.service.filterIteration.id != -1 && this.service.filterIteration.id != 0) && 
                    note.iteration_id != this.service.filterIteration.id){
                return false;
            }
            if(this.service.filterIteration.id == -1 && note.iteration_id == null){
                return false;
            }
            if(this.service.filterIteration.id == 0 && note.iteration_id != null){
                return false;
            }
            return true;
        }
    }
}