/// <reference path='../_all.ts' />

module scrumdo {
    interface attachmentPreviewScope extends ng.IScope {
        isImage: boolean,
        ctrl: any,
        attachment: any,
        isImageUrl: boolean,
        downloadUrl: string
    }
    export class SDAttachmentPreviewController {

        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter",
            "$uibModal",
            "hotkeys"
        ];

        public name: string;
        public dialog: ng.ui.bootstrap.IModalServiceInstance;
        public element: HTMLElement;

        constructor(
            public scope: attachmentPreviewScope,
            public urlRewriter: URLRewriter,
            public modal: ng.ui.bootstrap.IModalService,
            public hotkeys) {

            this.scope.isImage = false;
            this.scope.ctrl = this;
            this.name = 'SDAttachmentPreviewController';
            this.scope.$watch("attachment", this.onAttachmentChanged);
        }

        bindEscKeyShortcut() {
            this.hotkeys.bindTo(this.scope).add({
                combo: 'esc',
                description: 'Close Attachment',
                allowIn: ['INPUT', 'SELECT', 'TEXTAREA', 'CONTENT-EDITABLE'],
                callback: (event) => {
                    event.preventDefault();
                    this.dialog.close();
                    this.bindCardSortKeys();
                }
            });
        }

        bindCardSortKeys = () => {
            this.scope.$root.$broadcast('bindcardesckey', {});
            this.scope.$root.$broadcast('bindcardsavekey', {});
        }

        openFullSize() {
            //unbind sortcut keys for card
            this.bindEscKeyShortcut();
            this.hotkeys.del('ctrl+s');
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("attachments/fullpreview.html"),
                scope: this.scope,
                windowClass: "preview-modal"
            });
            this.dialog.result.then(null, this.bindCardSortKeys);
        }

        onAttachmentChanged = () => {
            if (!this.scope.attachment) {
                return;
            }
            var regexp = /\.(jpg|jpeg|png|gif)$/i;
            this.scope.isImage = this.scope.attachment.filename.match(regexp) != null;
            this.scope.isImageUrl = this.scope.attachment.attachment_name.match(regexp) != null;
            this.scope.downloadUrl = this.scope.attachment.url ? this.scope.attachment.url : this.scope.attachment.attachment_url;
        }

        init(element) {
            this.element = element;
        }
    }
}