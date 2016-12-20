/// <reference path='../_all.ts' />

module scrumdo {
    export interface note{
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

    export class NoteService {
        public static $inject: Array<string> = [
            "$rootScope",
            "$resource",
            "API_PREFIX",
            "userService",
            "projectManager",
            "iterationManager",
            "projectSlug",
            "organizationSlug",
            "$q"
        ];

        public notes:Array<note> = [];
        public Note: ng.resource.IResourceClass<any>;
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

        constructor(
            public rootScope,
            public resource: ng.resource.IResourceService,
            private API_PREFIX: string,
            public userService: UserService,
            public projectManager:ProjectManager,
            public iterationManager:IterationManager,
            public projectSlug:string,
            public organizationSlug: string,
            private $q: ng.IQService) {
                
            this.Note = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/notes/:id", { id: '@id' },
            {
                create: {
                    method: 'POST',
                    params: {
                        organizationSlug: "organizationSlug",
                        projectSlug: "projectSlug"
                    }
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

            var loads: Array<any> = [];

            loads.push(this.fetchIterations);
            loads.push(projectManager.loadProject(organizationSlug, projectSlug).then(this.setProject));
            $q.all(loads).then(this.allLoaded);

            this.allIterations = { name: 'All Iterations', id: -1, hidden: false };
            this.projectItr = {name: "Project Notes", id: 0, hidden:false};
            
            this.rootScope.$on('$stateChangeStart', this.onStateChange);
            this.rootScope.$on('revertNote', this.revertNote);
            this.rootScope.$watch("iterations", this.fetchIterations , true);
        }

        allLoaded = () => {
            this.rootScope.$broadcast("appLoaded");
        }

        fetchIterations = () => {
            this.iterationManager.loadIterations(this.organizationSlug, this.projectSlug).then(this.setIterations);
        }

        setIterations = (i) => {
            this.iterations = i;
            this.rootScope.iterations = i;
            this.iterationsOrNone = i.concat();
            this.noteIterations = i.concat();

            this.iterationsOrNone.unshift(this.allIterations);
            this.iterationsOrNone.unshift(this.projectItr);
            this.noteIterations.unshift(this.projectItr);
            if(this.filterIteration == null){
                this.filterIteration = this.projectItr;
            }
        }

        setProject = (p) => {
            this.project = p;
            this.rootScope.project = p;
        }

        setIteration(id){
            id = id == null ? 0 : id;
            var i = _.find(this.noteIterations, (d:any) => { return d.id==id });
            this.noteIteration = i;
        }

        switchFilterIteration(noteId){
            var n = _.find(this.notes, (n:any) => { return n.id==noteId });
            if(n==null) return;
            var id = n.iteration_id == null ? 0 : n.iteration_id;
            var i = _.find(this.iterationsOrNone, (d:any) => { return d.id==id });
            if(this.filterIteration.id != -1 || n.iteration_id == null){
                this.filterIteration = i;
            }
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

        onStateChange = (event, toState, toParams, fromState, fromParams) => {
            if (toState.name === 'note') {
                if(toParams.noteId > 0){
                    this.stateNoteId = toParams.noteId;
                    this.setCurrentNote(toParams.noteId);
                    this.switchFilterIteration(this.stateNoteId);
                }else{
                    this.currentNote = <any> this.dummyNote();
                    this.noteIteration = this.projectItr;
                }
            }
        }

        setCurrentNote(noteId:number){
            var note = _.find(this.notes, (n:any) => { return n.id==noteId });
            if(note != null){
                this.currentNote = note;
                this.currentNote.editing = false;
            }
        }

        loadNotes(organizationSlug, projectSlug){
            var p = this.Note.query({organizationSlug:organizationSlug, projectSlug:projectSlug}).$promise;
            p.then((notes) => {
                this.notes = notes;
                if(this.stateNoteId != null){
                    this.setCurrentNote(this.stateNoteId);
                    this.switchFilterIteration(this.stateNoteId);
                }
            });
            return p;
        }

        createNote(organizationSlug, projectSlug, comment = null){
            var newNote = new this.Note();
            _.extend(newNote, this.currentNote);
            if ("id" in newNote) {
                delete newNote.id;
                delete newNote.editing;
            }
            if(this.currentNote.id == -1 && comment != null){
                newNote.newComment = comment;
            }
            newNote.iteration_id = this.noteIteration.id;
            var p = newNote.$create({ projectSlug: projectSlug, organizationSlug: organizationSlug });
            p.then((note) => {
                this.notes.push(note);
                this.setCurrentNote(note.id);
            });
            return p;
        }

        saveNote(organizationSlug, projectSlug) {
            var index;
            var note = new this.Note();
            _.extend(note, this.currentNote);
            note.iteration_id = this.noteIteration.id;
            var p = note.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug }).then((note) => {
                var n = _.find(this.notes, (n:any) => { return n.id==note.id });
                index = this.notes.indexOf(n);
                if (index !== -1) {
                    this.notes[index] = note;
                    this.currentNote = note;
                    this.switchFilterIteration(note.id);
                }
            });
            return p;
        }

        deleteNote(organizationSlug, projectSlug, note){
            var p = note.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug });
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
    }
}