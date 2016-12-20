/// <reference path='../_all.ts' />

module scrumdo {
    export class NoteController {
        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "API_PREFIX",
            "$resource",
            "userService"
        ];

        private noteId: number = null;
        private project;
        private note:note = null;
        public Note: ng.resource.IResourceClass<any>;
        public canWrite:boolean;

        constructor(
            public scope,
            private organizationSlug:string,
            private API_PREFIX:string,
            public resource: ng.resource.IResourceService,
            private userService:UserService) {
            
            this.noteId = scope.noteId;
            this.project = scope.project;

            this.canWrite = this.userService.canWrite(this.project.slug);
            this.Note = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/notes/:id", {id: '@id'}, {
                query: {method: 'get', isArray: false}
            });
            this.loadNote(this.noteId)
        }

        loadNote(id){
            var p = this.Note.query({organizationSlug:this.organizationSlug, projectSlug: this.project.slug, id:id}).$promise;
            p.then((note:any) => {
                this.note = note;
            },() => {
                this.note = <any> {title:"Note Deleted!", body: "", id:-1};
            });
            return p;
        }
    }

}