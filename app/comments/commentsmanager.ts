/// <reference path='../_all.ts' />

module scrumdo {
    export class CommentsManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ];

        private Comment: ng.resource.IResourceClass<any>;
        private commentUpdate: ng.resource.IResourceClass<any>;
        private NoteComment: ng.resource.IResourceClass<any>;
        private noteCommentUpdate: ng.resource.IResourceClass<any>;

        constructor(public resource: ng.resource.IResourceService,
            public API_PREFIX: string) {
            this.Comment = this.resource(API_PREFIX + "comments/story/:storyid");
            this.NoteComment = this.resource(API_PREFIX + "comments/notes/:noteId");
            this.commentUpdate = this.resource(API_PREFIX + "comments/story/:storyid/comment/:commentid", {}, {
                save: {
                    method: 'PUT'
                }
            });
            this.noteCommentUpdate = this.resource(API_PREFIX + "comments/notes/:noteId/comment/:commentid", {}, {
                save: {
                    method: 'PUT'
                }
            });
        }

        loadComments(storyId: number) {
            return this.Comment.query({
                storyid: storyId
            }).$promise;
        }

        loadNoteComments(noteId: number) {
            return this.NoteComment.query({
                noteId: noteId
            }).$promise;
        }

        postComment(storyId: number, comment) {
            return this.Comment.save(
                { storyid: storyId },
                { comment: comment }
            ).$promise;
        }

        postNoteComment(noteId: number, comment) {
            return this.NoteComment.save(
                { noteId: noteId },
                { comment: comment }
            ).$promise;
        }

        updateComment(storyId: number, commentId: number, comment) {
            return this.commentUpdate.save(
                { storyid: storyId, commentid: commentId },
                { comment: comment }
            ).$promise;
        }

        updateNoteComment(noteId: number, commentId: number, comment) {
            return this.noteCommentUpdate.save(
                { noteId: noteId, commentid: commentId },
                { comment: comment }
            ).$promise;
        }

        deleteComment(storyId: number, commentId: number) {
            return this.commentUpdate.delete({
                storyid: storyId,
                commentid: commentId
            }).$promise;
        }

        deleteNoteComment(noteId: number, commentId: number) {
            return this.noteCommentUpdate.delete({
                noteId: noteId,
                commentid: commentId
            }).$promise;
        }
    }

}