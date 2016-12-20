/// <reference path='../_all.ts' />

module scrumdo {

    interface AttachmentCoverResource extends ng.resource.IResourceClass<any> {
        update: any;
    }

    export class AttachmentsManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"];

        private Attachments: ng.resource.IResourceClass<any>;
        private NoteAttachments: ng.resource.IResourceClass<any>;
        private AttachmentUrl: ng.resource.IResourceClass<any>;
        private AttachmentCover: AttachmentCoverResource;

        constructor(public resource: ng.resource.IResourceService,
            public API_PREFIX: string) {

            
            this.Attachments = this.resource(this.API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/attachments/:attachmentId");
            this.AttachmentCover = <AttachmentCoverResource> this.resource(this.API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/cover/attachments/:attachmentId", {}, {
              save: {
                method: 'PUT',
                params: {
                  organizationSlug: '@organizationSlug',
                  projectSlug: '@projectSlug',
                  storyId: '@storyId',
                  attachmentId: '@attachmentId'
                }
              }
            });
            
            this.NoteAttachments = this.resource(this.API_PREFIX + 
                "organizations/:organizationSlug/projects/:projectSlug/notes/:noteId/attachments/:attachmentId");

        }

        deleteAttachment(organizationSlug: string, projectSlug: string, storyId: number, attachmentId: number) {
            return this.Attachments.delete({
                organizationSlug:organizationSlug, 
                projectSlug:projectSlug, 
                storyId:storyId, 
                attachmentId:attachmentId}
                ).$promise;
        }

        deleteNoteAttachment(organizationSlug: string, projectSlug: string, noteId: number, attachmentId: number) {
            return this.NoteAttachments.delete({
                organizationSlug:organizationSlug, 
                projectSlug:projectSlug, 
                noteId:noteId, 
                attachmentId:attachmentId}
                ).$promise;
        }

        loadAttachments(organizationSlug: string, projectSlug: string, storyId: number) {
            return this.Attachments.query({
                organizationSlug:organizationSlug, 
                projectSlug:projectSlug, 
                storyId:storyId}
                ).$promise;
        }

        loadNoteAttachments(organizationSlug: string, projectSlug: string, noteId: number) {
            return this.NoteAttachments.query({
                organizationSlug:organizationSlug, 
                projectSlug:projectSlug, 
                noteId:noteId}
                ).$promise;
        }

        saveAttachmentUrl(organizationSlug: string, projectSlug: string, storyId: number, file: any) {
            this.AttachmentUrl = this.resource(this.API_PREFIX + 
                "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/externalattachment", {
                organizationSlug: organizationSlug, projectSlug: projectSlug, storyId: storyId
            });
            return this.AttachmentUrl.save({
                attachmentUrl:file.fileLink,
                thumbUrl:file.thumbLink,
                fileName:file.fileName}
                ).$promise
        }
        
        saveNoteAttachmentUrl(organizationSlug: string, projectSlug: string, noteId: number, file: any) {
            this.AttachmentUrl = this.resource(this.API_PREFIX + 
                "organizations/:organizationSlug/projects/:projectSlug/notes/:noteId/attachments", {
                    organizationSlug: organizationSlug, projectSlug: projectSlug, noteId: noteId
            });
            return this.AttachmentUrl.save({
                attachmentUrl:file.fileLink,
                thumbUrl:file.thumbLink,
                fileName:file.fileName}
                ).$promise
        }
        
        cleanTempAttachments(organizationSlug:string, projectSlug:string, storyId:number, attachmentId:number){
            return this.Attachments.delete({
                organizationSlug:organizationSlug, 
                projectSlug:projectSlug, 
                storyId:storyId, 
                attachmentId:attachmentId}
                ).$promise
        }

        toggleAttachmentsCover(organizationSlug:string, projectSlug:string, storyId:number, attachmentId:number, action:string="toggle"){
            var a = new this.AttachmentCover({
                organizationSlug: organizationSlug, 
                projectSlug: projectSlug, 
                storyId: storyId,
                attachmentId:attachmentId,
                action: action
            });
            var p = a.$save();
            return p;
        }
    }
}
