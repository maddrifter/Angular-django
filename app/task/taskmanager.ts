/// <reference path='../_all.ts' /> 

var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module scrumdo {
    export class TaskManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "organizationSlug",
            "$http",
            "realtimeService",
            "$rootScope",
            "$q"
        ];

        private tasks;
        private taskLists: Array<any>;
        private storyMap;
        private projectSlug: string;
        private syncronizedModel;
        private Task: ng.resource.IResourceClass<any>;

        constructor(
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public organizationSlug: string,
            private http: ng.IHttpService,
            private realtimeService,
            private rootScope,
            private q: ng.IQService) {

            this.tasks = {};
            this.taskLists = [];
            this.storyMap = {};
            this.projectSlug = "";
            this.syncronizedModel = new SyncronizedModel(rootScope, "TASK", this.realtimeService, this);
            
            this.rootScope.$on("deleteTask", this.onTaskDelete);

            this.Task = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:storyId/tasks/:id",
                {
                    id: '@id',
                    organizationSlug: this.organizationSlug
                },
                {
                    get: {
                        method: 'GET',
                        params: {
                            organizationSlug: this.organizationSlug,
                            storyId: "@story_id",
                            id: "@id"
                        }
                    },
                    remove: {
                        method: 'DELETE',
                        params: {
                            organizationSlug: this.organizationSlug,
                            storyId: "@story_id",
                            id: "@id"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: this.organizationSlug,
                            storyId: "@story_id",
                            id: "@id"
                        }
                    },
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    }
                }
            );
        }

        create(projectSlug: string, storyId, properties) {
            var newTask = new this.Task();
            _.extend(newTask, properties);
            var p = newTask.$create({ projectSlug: projectSlug, storyId: storyId });
            p.then((task) => {
                if (storyId in this.storyMap) {
                    this.storyMap[storyId].push(task);
                }
                this.tasks[task.id] = task;
                this.syncronizedModel.signalModelCreated(task, [storyId]);
                this.handleNewTags(task.new_project_tags);
            });
            return p;
        }

        reload(taskId) {
            var task;
            if (taskId in this.tasks) {
                task = this.tasks[taskId];
                task.$get({
                    projectSlug: task.project_slug
                });
            }
        }

        loadTasks(projectSlug: string, storyId, taskCount=false) {
            this.projectSlug = projectSlug;
            if (storyId in this.storyMap) {
                // load tasks from cache if nothing added
                if(this.storyMap[storyId].length === taskCount && taskCount != false){ 
                    var deferred = this.q.defer();
                    deferred.resolve(this.storyMap[storyId]);
                    return deferred.promise;
                }
            }
            var p = this.Task.query({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, storyId: storyId }).$promise;
            p.then((tasks) => {
                for (var i = 0, len = tasks.length; i < len; i++) {
                    var task:{project_slug:string, id:number} = tasks[i];
                    task.project_slug = projectSlug;
                    this.tasks[task.id] = task;
                }
                this.storyMap[storyId] = tasks;
            });
            return p;
        }

        getTask(taskId) {
            return this.tasks[parseInt(taskId)];
        }

        trackTasks(models) {
            for (var i = 0, len = models.length; i < len; i++) {
                var task = models[i];
                delete task.task_id_after;
                delete task.task_id_before;
                this.tasks[task.id] = task;
            }
        }

        _handleOthersChanged(data) {
            if (data.reorderResults == null) {
                return;
            }
            var ref = data.reorderResults.storiesModified;
            for (var i = 0, len = ref.length; i < len; i++) {
                var other = ref[i];
                trace("Modified other", other);
                this.getTask(other[0]).order = other[1];
                this.syncronizedModel.signalModelUpdate(other, {
                    rank: other[1]
                });
            }
            delete data.reorderResults;
            return;
        }

        saveTask(task, projectSlug) {
            trace("TaskManager::saveTask", task.summary);
            task.$save({ projectSlug: projectSlug }).then((newTask) => {
                this._handleOthersChanged(task);
                this.syncronizedModel.signalModelEdited(task);
                this.handleNewTags(task.new_project_tags);
            });
        }
        
        handleNewTags(tags){
            // add new tags to project scope sent by server
            if(this.rootScope.project != null){
                for(var i in tags){
                    var tag = {name: tags[i]};
                    if(!_.find(this.rootScope.project.tags, (t:any) => t.name == tags[i])){
                        this.rootScope.project.tags.push(tag);
                    }
                }
            }
        }
        
        onTaskDelete = (event, data) => {
            this.deleteTask(data.task, data.projectSlug);
        }

        deleteTask(task, projectSlug) {
            var p = task.$remove({ projectSlug: projectSlug });
            var taskId = task.id;
            p.then((task) => {
                this.removeReferences(task, taskId);
                this.syncronizedModel.signalModelDeleted(taskId);
            });
            return p;
        }

        onRemoved = (taskId) => {
            // A remote client deleted that story.
            if (!(taskId in this.tasks)) {
                return;
            }
            var task = this.tasks[taskId];
            this.removeReferences(task, taskId);
        }

        onUpdate = (taskId, properties) => {
            if (!(taskId in this.tasks)) {
                return;
            }
            var task = this.tasks[taskId];
            _.extend(task, properties);
        }

        onAdded = (taskId, storyId) => {
            trace("adding remote task");
            if (this.projectSlug === "") {
                return;
            }
            var newTask = new this.Task();
            var p = newTask.$get({ projectSlug: this.projectSlug, storyId: storyId, id: taskId });
            p.then((task) => {
                var ref = task.id;
                if (indexOf.call(this.tasks, ref) < 0) {
                    this.tasks[task.id] = task;
                }
                if (indexOf.call(this.storyMap, storyId) >= 0) {
                    this.storyMap[storyId].push(task);
                }
                this.rootScope.$broadcast("taskAdded", task);
            });
        }

        removeReferences(task, taskId) {
            var i, list, ref, storyId;
            ref = this.storyMap;
            for (storyId in ref) {
                list = ref[storyId];
                i = list.indexOf(task);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            }
            if (task.id in this.tasks) {
                delete this.tasks[taskId];
            } 
        }
    }
}