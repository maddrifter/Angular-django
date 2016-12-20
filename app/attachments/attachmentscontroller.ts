/// <reference path='../_all.ts' />

module scrumdo {
    export class SDAttachmentsController {
        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter",
            "attachmentsManager",
            "organizationSlug",
            "FileUploader",
            "confirmService",
            "userService",
            "$uibModal",
            "hotkeys"
        ];

        public loaded: boolean;
        public element: HTMLElement;
        public dialog: ng.ui.bootstrap.IModalServiceInstance;
        private busy: boolean = false;

        constructor(private scope,
            private urlRewriter: URLRewriter,
            private attachmentsManager: AttachmentsManager,
            public organizationSlug: string,
            public FileUploader: any,
            private confirmService: ConfirmationService,
            private userService: UserService,
            public modal: ng.ui.bootstrap.IModalService,
            public hotkeys) {

            this.scope.ctrl = this;
            this.loaded = false;
            this.scope.$on('reset_attachment', this.resetAttachments);
        }

        init(element: HTMLElement) {
            this.element = element;
            if (this.scope.preloadedAttachments != null) {
                this.loaded = true;
                this.scope.attachments = this.scope.preloadedAttachments;
            } else {
                this.scope.$watch("story", this.loadAttachments);
                this.scope.$watch("project", this.loadAttachments);
                if(this.scope.note != null){
                    this.loadAttachments();
                }
            }
        }

        deleteAttachment(attachment) {
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this attachment?", "No", "Yes").then(() => {
                this.onDeleteConfirm(attachment);
            });
        }

        onDeleteConfirm = (attachment) => {
            var index: number = this.scope.attachments.indexOf(attachment);
            if(attachment.cover_image){
                this.scope.story.cover_image = null;
            }
            this.scope.attachments.splice(index, 1);
            if(this.scope.story != null){
                this.attachmentsManager.deleteAttachment(this.organizationSlug, 
                    this.scope.project.slug, this.scope.story.id, attachment.id);
            }else{
                this.attachmentsManager.deleteNoteAttachment(this.organizationSlug, 
                    this.scope.project.slug, this.scope.note.id, attachment.id);
            }
        }

        reloadAttachments() {
            this.loaded = false;
            this.loadAttachments();
        }

        resetAttachments = () => {
            this.scope.attachments.splice(0, this.scope.attachments.length);
        }

        loadAttachments = () => {
            if (this.scope.project == null) {
                return;
            }
            if (!this.loaded) {
                this.loaded = true;
                if(this.scope.story != null){
                    this.attachmentsManager.loadAttachments(this.organizationSlug, this.scope.project.slug, 
                        this.scope.story.id).then((attachments) => {
                            this.scope.attachments = attachments;
                    });
                }else{
                    this.attachmentsManager.loadNoteAttachments(this.organizationSlug, this.scope.project.slug, 
                        this.scope.note.id).then((attachments) => {
                            this.scope.attachments = attachments;
                    });
                }
            }
        }

        showAttachmentServices(story, project, attachments, note=null) {
            //unbind sortkeys for card
            this.hotkeys.del('esc');
            this.hotkeys.del('ctrl+s');
            var template: string = "attachments/attachmentservices.html";
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl(template),
                controller: 'SDAttachmentServices',
                size: "lg",
                backdrop: "static",
                keyboard: false,
                resolve: {
                    story: () => { return story },
                    note: () => { return note },
                    project: () => { return project },
                    user: () => { return this.userService.me }
                }
            });
            this.dialog.result.then(this.onDialogClosed);
        }
        onDialogClosed = () => {
            //bind again sortcut keys for card
            this.scope.$root.$broadcast('bindcardesckey', {});
            this.scope.$root.$broadcast('bindSaveShortcut', {});
            this.reloadAttachments();
        }

        toggleCover(attachment){
            // do actions here
            if(this.busy) return;
            this.busy = true;
            var action = attachment.cover_image ? "remove": "toggle";
            this.attachmentsManager.toggleAttachmentsCover(this.organizationSlug, 
                                                           this.scope.project.slug, 
                                                           this.scope.story.id, 
                                                           attachment.id,
                                                           action).then((res) => {
                //this.reloadAttachments();
                this.busy = false;
                _.forEach(this.scope.attachments, (a:any) => {
                    a.cover_image = false;
                });
                if(action == 'remove'){
                    this.scope.story.cover_image = null;
                }else{
                    var index: number = this.scope.attachments.indexOf(attachment);
                    this.scope.attachments[index].cover_image = true;
                    this.scope.story.cover_image = {id: attachment.id, url: attachment.url};
                }
            });
        }

        isImage(attachment){
            var regexp = /\.(jpg|jpeg|png|gif)$/i;
            return attachment.filename.match(regexp) != null;
        }
    }
}