/// <reference path='../_all.ts' />

module scrumdo {
    export class SDLocalAttachmentsController {
        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter",
            "attachmentsManager",
            "organizationSlug",
            "FileUploader",
            "confirmService",
            "$cookies"
        ];

        private uploader = new this.FileUploader({
            headers: {
                'X-CSRFToken': this.cookies.get('csrftoken')
            }
        });
        private uploading: boolean;
        public element: HTMLElement;

        constructor(private scope,
            private urlRewriter: URLRewriter,
            private attachmentsManager: AttachmentsManager,
            public organizationSlug: string,
            public FileUploader,
            public confirmService: ConfirmationService,
            public cookies: ng.cookies.ICookiesService) {

            this.scope.uploader = this.uploader;
            this.scope.uploader.autoUpload = true;
            this.scope.uploader.alias = 'attachment_file';
            this.scope.uploader.onSuccessItem = this.notifyUpload;
            this.scope.uploader.onErrorItem = this.notifyNotUpload;
            this.scope.uploader.onBeforeUploadItem = this.startUpload;

            this.uploading = false;
            this.scope.ctrl = this; 
        }

        init(element) {
            if(this.scope.story != null){
                var projectSlug: string = !!this.scope.story.project_slug ? this.scope.story.project_slug : this.scope.project.slug ;
            }else{
                var projectSlug: string = this.scope.project.slug ;
            }
            this.element = element;
            if(this.scope.story != null){
                this.scope.uploader.url = "/uploader/add-dropzone/" + projectSlug + "/" + this.scope.story.id + "/";
            }else{
                this.scope.uploader.url = "/uploader/add-dropzone/" + projectSlug + "/note/" + this.scope.note.id + "/";
            }
        }

        startUpload = () => {
            this.scope.$emit('uploadStarted');
            this.uploading = true;
        }


        notifyUpload = (item, response, status, headers) => {
            this.scope.$emit('fileUploaded', { fileName: item.file.name });
            this.uploading = false;
        }

        notifyNotUpload = (item, response, status, headers) => {
            this.scope.$emit('fileNotUploaded', { fileName: item.file.name });
            this.uploading = false;
        }

    }
}