/// <reference path='../_all.ts' />

module scrumdo {
    export class EditableCommentsController {
        public static $inject: Array<any> = [
            "$scope",
            "commentsManager",
            "userService",
            "confirmService"
        ];

        private me;
        private canWrite: boolean;
        private editing: boolean;
        private edited: boolean;
        private element: HTMLElement;
        private thisComment: string;

        constructor(public scope,
            private commentsManager: CommentsManager,
            private userService: UserService,
            public confirmService: ConfirmationService) {

            this.me = this.userService.me;
            this.canWrite = this.userService.canWrite(this.scope.project.slug);
            this.editing = false;
            this.edited = false;
        }

        init(element: HTMLElement) {
            this.element = element;
            this.thisComment = this.decodeHtml(this.htmlToPlaintext(this.scope.comment.comment));
            this.scope.$watch('ctrl.thisComment', this.onEdited, false);
        }

        makeEditable() {
            this.editing = true;
            this.edited = false;
            this.thisComment = this.decodeHtml(this.htmlToPlaintext(this.scope.comment.comment));
            setTimeout(() => {
                this.element[0].querySelector('textarea').focus();
            }, 200);
        }

        updateComment() {
            if(this.scope.story != null){
                this.commentsManager.updateComment(this.scope.story.id, this.scope.comment.id, this.thisComment).then((updatedComment) => {
                    this.scope.comment.comment = updatedComment.comment;
                    this.editing = false;
                    this.edited = false;
                }, this.revertBack);
            }else{
                this.commentsManager.updateNoteComment(this.scope.note.id, this.scope.comment.id, this.thisComment).then((updatedComment) => {
                    this.scope.comment.comment = updatedComment.comment;
                    this.editing = false;
                    this.edited = false;
                }, this.revertBack);
            }
        }

        revertBack = () => {
            this.editing = false;
            this.edited = false;
        }

        deleteComment() {
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this comment?", "No", "Yes").then(this.onDeleteConfirm);
        }

        onDeleteConfirm = () => {
            if(this.scope.story != null){
                this.commentsManager.deleteComment(this.scope.story.id, this.scope.comment.id).then(() => {
                    var index: number = this.scope.comments.indexOf(this.scope.comment);
                    if (index > -1) {
                        this.scope.comments.splice(index, 1);
                        this.scope.story.comment_count -= 1;
                    }
                }, this.revertBack);
            }else{
                this.commentsManager.deleteNoteComment(this.scope.note.id, this.scope.comment.id).then(() => {
                    var index: number = this.scope.comments.indexOf(this.scope.comment);
                    if (index > -1) {
                        this.scope.comments.splice(index, 1);
                    }
                }, this.revertBack);
            }
        }

        htmlToPlaintext = (text) => {
            if (text) {
                return String(text).replace(/<(?!br\s*\/?)[^>]+>/gm, '').replace(/<br\s*[\/]?>/gim, '\n');
            } else {
                return '';
            }
        }

        onEdited = (newValue, oldValue) => {
            if (newValue === oldValue) {
                return;
            }
            this.edited = true;
        }

        decodeHtml = (html) => {
            var txt:HTMLTextAreaElement = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        }
    }
}