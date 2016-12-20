/// <reference path='../../_all.ts' />

module scrumdo {
    export class StoryBulkOperations {
        public static $inject: Array<string> = [
            "storyManager",
            "$uibModal",
            "confirmService",
            "urlRewriter"
        ];

        private saveQueue: Array<any>;
        private archiveQueue: Array<any>;
        private archiveIteration;
        private moveToProjectSlug;
        private moveToIterationId;
        private deleteQueue;
        private agingQueue: Array<any>;

        constructor(
            private storyManager: StoryManager,
            private modal: ng.ui.bootstrap.IModalService,
            private confirmService: ConfirmationService,
            private urlRewriter: URLRewriter) {

            this.saveQueue = [];
            this.archiveQueue = [];
        }

        saveNextInQueue = () => {
            var story = this.saveQueue.shift();
            if (typeof story === "undefined" || story === null) {
                return;
            }
            trace("Saving " + story.id);
            this.storyManager.saveStory(story).then(this.saveNextInQueue);
        }

        //---------- Archiving all stories ----------
        archiveAll(stories, archiveIterationId) {
            this.confirmService.confirm("Archive", "Are you sure you want to archive " + stories.length + " stories?", "Cancel", "Archive", "btn-warning")
                .then(() => {
                    this.archiveQueue = stories;
                    this.archiveIteration = archiveIterationId;
                    this.archiveNextInQueue();
                });
        }

        archiveNextInQueue = () => {
            var story = this.archiveQueue.shift();
            if (typeof story === "undefined" || story === null) {
                return;
            }
            trace("archiving " + story.id);
            this.storyManager.moveToIteration(story, this.archiveIteration);
            this.storyManager.saveStory(story).then(this.archiveNextInQueue);
        }

        // ---------- Moving to a cell on a kanban board ----------------
        moveToCell(stories, cells, headers) {
            this.saveQueue = stories;
            var dialog: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("story/bulkoperations/movetocelltwindow.html"),
                controller: 'MoveToCellWindowController',
                controllerAs: 'ctrl',
                resolve: {
                    cells: () => cells,
                    headers: () => headers
                }
            });
            dialog.result.then(this.onCellMoveProjectConfirm);
        }

        onCellMoveProjectConfirm = (cellId) => {
            var ref = this.saveQueue;
            for (var i = 0, len = ref.length; i < len; i++) {
                var story = ref[i];
                story.cell_id = cellId;
            }
            this.saveNextInQueue();
        }

        /*
        bulkMoveToCell(stories, cell) {
            $('body').modalmanager('loading')
            this.saveQueue = stories;
            var ref = this.stories;
            for (var i = 0, len = ref.length; i < len; i++) {
                var story = ref[i];
                story.set("cell_id", cell.get("id"));
                this.saveQueue.push(story);
            }
            this.saveNextInQueue();
        }
        */

        // ---------- Moving to a project ----------------
        moveToProject(stories, defaultProject) {
            this.saveQueue = stories;
            var dialog: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("story/bulkoperations/movetoprojectwindow.html"),
                controller: 'MoveToProjectWindowController',
                resolve: {
                    count: () => stories.length,
                    defaultProject: () => defaultProject
                }
            });
            dialog.result.then(this.onMultiMoveProjectConfirm);
        }

        onMultiMoveProjectConfirm = (options) => {
            this.moveToProjectSlug = options[0];
            this.moveToIterationId = options[1];
            this.moveNextInQueueToProject();
        }

        moveNextInQueueToProject = () => {
            var story = this.saveQueue.shift();
            if (typeof story === "undefined" || story === null) {
                return;
            }
            this.storyManager.moveToProject(story, this.moveToProjectSlug, this.moveToIterationId).then(this.moveNextInQueueToProject);
        }

        // ---------- Bulk Delete ----------
        delete(stories, isTrash = false, workItemName:string=null) {
            this.deleteQueue = stories;
            var card = workItemName !=null ? workItemName : "card";
            if (stories.length > 1) {
                var pluralName = pluralize(card);
                card = workItemName !=null ? `${pluralName}` : "cards";
            }

            if (isTrash) {
                card = card + " permanently";
            }
            this.confirmService.confirm("Delete "+ card+ "?", "Are you sure you want to delete " + stories.length + " "+ card+ "?", "Cancel", "Delete")
                .then(this.onMultiDeleteConfirm);
        }

        onMultiDeleteConfirm = () => {
            this.deleteNextInQueue();
        }

        deleteNextInQueue = () => {
            var story = this.deleteQueue.shift();
            if (typeof story === "undefined" || story === null) {
                return;
            }
            this.storyManager.deleteStory(story).then(this.deleteNextInQueue);
        }

        // ---------- Assign stories ----------

        assign(stories, projectMembers) {
            this.saveQueue = stories;
            var dialog: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("story/bulkoperations/assignwindow.html"),
                controller: 'AssignWindowController',
                resolve: {
                    projectMembers: () => projectMembers
                }
            });
            dialog.result.then(this.onAssigneesChosen);
        }

        onAssigneesChosen = (options) => {
            var assigneeList = options[0];
            var append = 'add' === options[1];
            if (assigneeList.length === 0) {
                return;
            }
            var i, j, len, len1, newAssignee, originalAssignees, ref, story;

            ref = this.saveQueue;
            for (i = 0, len = ref.length; i < len; i++) {
                story = ref[i];
                if (append) {
                    originalAssignees = story.assignee;
                } else {
                    originalAssignees = [];
                }
                for (j = 0, len1 = assigneeList.length; j < len1; j++) {
                    newAssignee = assigneeList[j];
                    originalAssignees.push({
                        username: newAssignee
                    });
                }
                story.assignee = originalAssignees;
            }

            this.saveNextInQueue();
        }

        resetCardsAging(stories){
            this.agingQueue = stories;
            this.confirmService.confirm("Reset card aging?", "Are you sure you want to reset " + stories.length + " cards aging?", "No", "Yes")
                .then(this.resetAgingNextInQueue);
        }

        resetAgingNextInQueue = () => {
            var story = this.agingQueue.shift();
            if (typeof story === "undefined" || story === null) {
                return;
            }
            this.storyManager.resetStoryAging(story).then(this.resetAgingNextInQueue).then((result) => {
                story.age_hours = 0;
            });
        }

        /*
        // ---------- Status changing ----------
        changeStatus(stories, project) {
            this.saveQueue = stories;
            var dialog: ng.ui.bootstrap.IModalServiceInstance = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("story/bulkoperations/statuswindow.html"),
                controller: 'StatusWindowController',
                resolve: {
                    project: () => project
                }
            });

            dialog.result.then(this.onMultiStatusChosen);
        }

        onMultiStatusChosen = (status) => {
            var ref = this.saveQueue;
            for (var i = 0, len = ref.length; i < len; i++) {
                var story = ref[i];
                story.status = status;
            }

            this.saveNextInQueue();
        }
        */
    }
}