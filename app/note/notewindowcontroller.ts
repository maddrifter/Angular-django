/// <reference path='../_all.ts' />

module scrumdo {
    export class NoteWindowController {
        public static $inject: Array<string> = [
            "$scope",
            "incrementNoteService",
            "organizationSlug",
            "confirmService",
            "attachmentsManager",
            "userService",
            "project", 
            "increment",
            "noteId"
        ];

        private note:note;
        private noteCopy:note = null;
        private newComment:string;
        private busyMode:boolean;

        constructor(
            public scope,
            private service: IncrementNoteService,
            public organizationSlug: string,
            public confirmService:ConfirmationService,
            public attachmentsManager:AttachmentsManager,
            public userService:UserService,
            public project:Project,
            public increment:Iteration,
            public noteId:number) {
            this.scope.project = project;
            this.busyMode = false;
        }

        delete(){
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this note?", 
                "No", "Yes").then(this.onDeleteConfirm);
        }

        onDeleteConfirm = () => {
            this.service.window.close();
            this.service.deleteNote(this.organizationSlug, 
                                    this.project.slug, 
                                    this.increment.id, 
                                    this.service.currentNote);
        }

        edit(){
            this.noteCopy = angular.copy(this.service.currentNote);
            this.service.currentNote.editing = true;
        }

        close(){
            this.service.reloadNote(this.organizationSlug, 
                                    this.project.slug, 
                                    this.increment.id, 
                                    this.service.currentNote);
            this.service.window.dismiss();
        }

        cancel(){
            if(this.service.currentNote.id == -1){
                this.attachmentsManager.cleanTempAttachments(this.organizationSlug, 
                                                            this.project.slug, 
                                                            this.service.currentNote.id,
                                                            -1).then(() => {
                                                              this.service.window.dismiss();  
                                                            })
            }else{
                this.service.currentNote = this.noteCopy;
            }
        }

        save(){
            this.busyMode = true;
            if(this.service.currentNote.id == -1){
                this.service.createNote(this.organizationSlug, this.project.slug, this.increment.id, this.newComment).then((note) => {
                    this.newComment = null;
                    this.service.window.close();
                });
            }else{
                this.service.saveNote(this.organizationSlug, this.project.slug, this.increment.id).then((note) => {
                    this.service.currentNote.editing = false;
                    this.service.window.close();
                });
            }
        }

        isValidNote(){
            if(this.service.currentNote.title == null) return false;
            return this.service.currentNote.title.trim() != ''
        }

        isOwner(){
            return this.service.currentNote.creator.username == this.userService.me.username;
        }
    }
}