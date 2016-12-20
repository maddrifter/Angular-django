/// <reference path='../_all.ts' />

module scrumdo {
    declare var Dropbox;
    export class DropboxAttachmentsController {
        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter",
            "attachmentsManager",
            "organizationSlug",
            "confirmService"
        ];

        constructor(private scope,
            private urlRewriter: URLRewriter,
            private attachmentsManager: AttachmentsManager,
            public organizationSlug: string,
            public confirmService: ConfirmationService) {

            this.scope.ctrl = this;
        }

        init() {
            this.appendDropboxButton();
        }

        appendDropboxButton() {
            var options = {
                success: (files) => {
                    this.handleDropboxResponse(files[0]);
                },
                linkType: "preview",
                multiselect: false
            }
            
            if (typeof(Dropbox) == 'object') {
                var button: HTMLElement = Dropbox.createChooseButton(options);
                document.getElementById("dropboxChooserButton").appendChild(button);
            }
        }

        handleDropboxResponse(response) {
            var projectSlug = this.scope.project != null ? this.scope.project.slug : this.scope.story.project_slug;
            var file = {
                fileName: response.name,
                fileLink: response.link,
                thumbLink: response.thumbnailLink ? response.thumbnailLink : ''
            }
            if(this.scope.story != null){
                this.attachmentsManager.saveAttachmentUrl(this.organizationSlug, projectSlug, this.scope.story.id, file).then(() => {
                    this.notifyUpload(response.name);
                });
            }else{
                // save note attachment file
                this.attachmentsManager.saveNoteAttachmentUrl(this.organizationSlug, projectSlug, this.scope.note.id, file).then(() => {
                    this.notifyUpload(response.name);
                });
            }
        }

        notifyUpload(item) {
            this.scope.$emit('fileUploaded', { fileName: item });
        }
    }
}