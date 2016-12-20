/// <reference path='../_all.ts' />

module scrumdo {
    export class CommentsBoxController {
        public static $inject: Array<any> = [
            "$scope",
            "commentsManager"
        ];

        private currentValue: string;
        private loadedFor: number;
        public element: HTMLElement;
        private ngModel: ng.INgModelController;

        constructor(public scope,
            private commentsManager: CommentsManager) {
            this.currentValue = '';
            this.loadedFor = -1;
        }

        init(element, ngModel) {
            this.element = element;
            this.scope.$watch("story", this.loadComments);
            this.scope.$watch("project", this.loadComments);
            this.scope.$watch("ctrl.currentValue", this.onModified);

            this.ngModel = ngModel;
            this.currentValue = ngModel.$modelValue;
            this.ngModel.$render = () => {
                this.currentValue = ngModel.$modelValue;
            }
            if(this.scope.note != null && this.scope.note.id != -1){
                this.loadNoteComments();
            }
        }

        onModified = () => {
            this.ngModel.$setViewValue(this.currentValue);
        }

        loadComments = () => {
            if ((this.scope.story == null) || this.scope.story.id === -1) {
                return;
            }
            if (this.loadedFor === this.scope.story.id) {
                return;
            }
            this.loadedFor = this.scope.story.id;
            this.commentsManager.loadComments(this.scope.story.id).then((comments) => {
                this.scope.comments = comments;
            });
        }

        loadNoteComments(){
            this.commentsManager.loadNoteComments(this.scope.note.id).then( (comments) => {
                this.scope.comments = comments;
            });
        }
        
        addComment(){
            if(this.scope.story != null){
                this.commentsManager.postComment(this.scope.story.id, this.currentValue).then( (newComment) => {
                    this.scope.comments.unshift(newComment);
                    this.scope.story.comment_count += 1;
                    this.currentValue = '';
                });
            }else{
                this.commentsManager.postNoteComment(this.scope.note.id, this.currentValue).then( (newComment) => {
                    this.scope.comments.unshift(newComment);
                    this.currentValue = '';
                });
            }
        }

    }
}