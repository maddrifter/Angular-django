/// <reference path='../_all.ts' />

module scrumdo {
    export interface Note{
        title:string;
        body:string;
        project_id:number;
        iteration_id:number;
        creator:User;
        id:number;
        created_date:string;
        modified_date:string;
        editing:boolean;
    }

    export class IncrementNoteService {
        public static $inject: Array<string> = [
            "$rootScope",
            "$resource",
            "API_PREFIX",
            "projectSlug",
            "organizationSlug",
            "$q",
            "$uibModal",
            "urlRewriter"
        ];

        public notes:Array<note>;
        public Note: ng.resource.IResourceClass<any>;
        public IterationNote: ng.resource.IResourceClass<any>;
        public currentNote:note = null;
        public stateNoteId:number = null;
        public iterations:Array<any>;
        public filterIteration;
        public iterationsOrNone;
        public noteIterations;
        public noteIteration;
        public project;
        private projectItr;
        private allIterations;
        public window: ng.ui.bootstrap.IModalServiceInstance;

        constructor(
            public rootScope,
            public resource: ng.resource.IResourceService,
            private API_PREFIX: string,
            public projectSlug:string,
            public organizationSlug: string,
            private $q: ng.IQService,
            private modal: ng.ui.bootstrap.IModalService,
            private urlRewriter: URLRewriter) {

            this.IterationNote = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/notes/iteration/:iterationId/:id", { id: '@id' },
            {
                create: {
                    method: 'POST',
                    params: {
                        organizationSlug: "organizationSlug",
                        projectSlug: "projectSlug"
                    }
                },
                pullNote: {
                    method: 'GET',
                    isArray: false,
                },
                save: {
                    method: 'PUT',
                    params: {
                        organizationSlug: "organizationSlug",
                        projectSlug: "projectSlug",
                        id: "@id"
                    }
                }
            });
            this.notes = [];
            this.rootScope.$on('revertNote', this.revertNote);
        }

        dummyNote(){
            var note = {id:-1, title:"", body:"", editing:true};
            return note;
        }

        revertNote = (event, note) => {
            var n = _.find(this.notes, (n:any) => { return n.id==note.id });
            var index = this.notes.indexOf(n);
            if (index !== -1) {
                this.notes[index] = note;
            }
        }

        setCurrentNote(noteId:number){
            var note = _.find(this.notes, (n:any) => { return n.id==noteId });
            if(note != null){
                this.currentNote = note;
                this.currentNote.editing = false;
            }
        }

        loadIterationNotes(organizationSlug:string, projectSlug:string, iterationId:number){
            var p = this.IterationNote.query({organizationSlug:organizationSlug, projectSlug:projectSlug, iterationId: iterationId}).$promise;
            p.then((notes) => {
                this.notes = notes;
            });
            return p;
        }

        reloadNote(organizationSlug:string, projectSlug:string, incrementId:number, note){
           var p = note.$pullNote({ organizationSlug: organizationSlug, projectSlug: projectSlug, iterationId: incrementId });
           p.then((data) => {
                var index = this.notes.indexOf(note);
                if (index !== -1) {
                    this.notes[index] = data;
                }
            });
            return p;
        }

        createNote(organizationSlug, projectSlug, incrementId:number, comment = null){
            var newNote = new this.IterationNote();
            _.extend(newNote, this.currentNote);
            if ("id" in newNote) {
                delete newNote.id;
                delete newNote.editing;
            }
            if(this.currentNote.id == -1 && comment != null){
                newNote.newComment = comment;
            }

            var p = newNote.$create({ projectSlug: projectSlug, organizationSlug: organizationSlug, iterationId: incrementId });
            p.then((note) => {
                this.notes.unshift(note);
            });
            return p;
        }

        saveNote(organizationSlug, projectSlug, incrementId) {
            var index;
            var note = new this.IterationNote();
            _.extend(note, this.currentNote);

            var p = note.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug , iterationId: incrementId}).then((note) => {
                var n = _.find(this.notes, (n:any) => { return n.id==note.id });
                index = this.notes.indexOf(n);
                if (index !== -1) {
                    this.notes[index] = note;
                    this.currentNote = note;
                }
            });
            return p;
        }

        deleteNote(organizationSlug, projectSlug, incrementId, note){
            var p = note.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug, iterationId: incrementId });
            var index;
            p.then(() => {
                index = this.notes.indexOf(note);
                if (index !== -1) {
                    this.notes.splice(index, 1);
                    this.currentNote = null;
                }
            });
            return p;
        }

        showNoteWindow(organizationSlug:string, project:Project, increment:Iteration, noteId:number = null){
            if(noteId!=null){
                this.setCurrentNote(noteId);
            }else{
                this.currentNote = <any> this.dummyNote();
            }
            this.window = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("note/notewindow.html"),
                controller: "notewindowcontroller",
                controllerAs: "ctrl",
                windowClass: "scrumdo-modal primary scrumdo-note",
                backdrop: "static",
                keyboard: false,
                size: "lg",
                resolve: {
                    project: () => project,
                    increment: () => increment,
                    noteId: () => noteId
                }
            });
        }
    }
}