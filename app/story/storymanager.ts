/// <reference path='../_all.ts' /> 

var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

interface StoryResource extends ng.resource.IResourceClass<any> {
    byRelease: any,
    load: any,
    loadFromProject: any,
    activeStories: any,
    convertepic: any,
    duplicate: any,
    byEpic: any,
    byNoEpic: any,
    byIterationEpic: any,
    byIterations: any,
    byReleaseAndIteration: any;
    byIterationsWithFilter: any,
    byProjectWithFilter: any,
    byOrganizationWithFilter: any,
    getAging: any
    getBlockers: any,
    getBlockerReasons: any,
    resetAging: any,
    byReleaseId:any,
    releaseStats:any,
    byIterationsForCardPicker: any

}

module scrumdo {
    export class StoryManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "organizationSlug",
            "$http",
            "realtimeService",
            "$rootScope",
            "$q",
            "epicManager",
            "$timeout"
        ];

        public stories;
        public filteredStories;
        public iterationFilters;
        public storiesByEpic;
        public storiesByRelease;
        public storyLists: Array<Story>;
        public filteredStoryLists: Array<Story>;
        public iterationMap;
        public iterationReleaseMap;

        public Story: StoryResource;

        constructor(
            public resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public organizationSlug: string,
            public http: ng.IHttpService,
            public realtimeService,
            public rootScope,
            public q: ng.IQService,
            public epicManager: EpicManager,
            public timeout: ng.ITimeoutService) {

            this.stories = {}
            this.filteredStories = {};
            this.iterationFilters = {};  // key = iteration id, value = string of the filter
                
            // Let's cache the stories loaded for a particular epic so we don't double and tripple load them
            // during things like the planning tool
            // storiesByEpic[epic.id] = [story, story ...]
            this.storiesByEpic = {};
            this.storiesByEpic[-1] = [];

            this.storiesByRelease = {};
            this.storyLists = [];
            this.filteredStoryLists = [];

            // this.iterationMap[iterationId] = [list in stories];
            this.iterationMap = {};
            this.iterationReleaseMap = {}
            
            //this.syncronizedModel = new SyncronizedModel(rootScope, "STORY", this.realtimeService, this);
            
            this.Story = <StoryResource>this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:iterationId/stories/:id",
                {
                    id: '@id',
                    organizationSlug: this.organizationSlug
                },
                {
                    loadFromProject: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id",
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "project_slug",
                            id: "id"
                        }
                    },
                    load: {
                        method: 'GET',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "project_slug",
                            iterationId: "iteration_id",
                            id: "id"
                        }
                    },
                    get: {
                        method: 'GET',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@project_slug",
                            iterationId: "@iteration_id",
                            id: "@id"
                        }
                    },
                    remove: {
                        method: 'DELETE',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@project_slug",
                            iterationId: "@iteration_id",
                            id: "@id"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@project_slug",
                            iterationId: "@iteration_id",
                            id: "@id"
                        }
                    },
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug",
                            iterationId: "@iteration_id"
                        }
                    },
                    activeStories: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/active_stories",
                        isArray: true
                    },
                    convertepic: {
                        method: 'POST',
                        isArray: false,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id/convertepic",
                        params: {
                            organizationSlug: this.organizationSlug,
                            id: "@id",
                            projectSlug: "@project_slug"
                        }
                    },
                    duplicate: {
                        method: 'POST',
                        isArray: false,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id/duplicate",
                        params: {
                            organizationSlug: this.organizationSlug,
                            id: "@id",
                            projectSlug: "@project_slug"
                        }
                    },
                    byRelease: {
                        method: 'GET',
                        isArray: true,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/release/:releaseID"
                    },
                    byReleaseId: {
                        method: 'GET',
                        isArray: true,
                        url: API_PREFIX + "organizations/:organizationSlug/releases/:releaseID/stories/:projectSlug"
                    },
                    releaseStats: {
                        method: 'GET',
                        isArray: true,
                        url: API_PREFIX + "organizations/:organizationSlug/releases/:releaseID/stories/:projectSlug/stats/:loadChild"
                    },
                    byEpic: {
                        method: 'GET',
                        isArray: true,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/epic/:epicId/"
                    },
                    byNoEpic: {
                        method: 'GET',
                        isArray: true,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/epic/:epicId/:showArchive"
                    },
                    byIterationEpic: {
                        method: 'GET',
                        isArray: true,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:iterationId/epic/:epicId/stories/"
                    },
                    byReleaseAndIteration: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/release/:releaseId/iteration/:iterationId/",
                        isArray: true
                    },
                    byIterations: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:iterationId/stories",
                        isArray: true
                    },
                    byIterationsWithFilter: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:iterationId/search?q=:query",
                        isArray: true
                    },
                    byIterationsForCardPicker: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:iterationId/search?q=:query",
                        isArray: false 
                    },
                    byProjectWithFilter: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/search/?q=:query",
                        isArray: false
                    },
                    byOrganizationWithFilter: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/search/?q=:query",
                        isArray: false
                    },
                    getAging: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id/agingdetails",
                        isArray: true
                    },
                    getBlockers: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id/blockers/blocker",
                        isArray: true
                    },
                    getBlockerReasons: {
                        method: 'GET',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id/blockers/reason",
                        isArray: true
                    },
                    resetAging: {
                        method: 'POST',
                        isArray: false,
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/stories/:id/resetaging",
                        params: {
                            organizationSlug: this.organizationSlug,
                            id: "@id",
                            projectSlug: "@project_slug"
                        }
                    },
                }
            );

            rootScope.$on("DATA:SYNC:STORY", this.onSync);
            rootScope.$on("DATA:ADD:STORY", this.onAdd);
            rootScope.$on("DATA:DEL:STORY", this.onDel);
            rootScope.$on("DATA:MOVED:STORY", this.onMoved);
            rootScope.$on("DATA:PATCH:STORY", this.onPatch);
        }

        createStoryStub() {
            return {
                labels: [],
                    assignee: [],
                id: -1,
                number: -1,
                iteration_id: -1,
                task_counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                points: "?",
                detail: "",
                cell: {},
                comment_count: 0,
                    epic: null,
                cell_id: -1,
                tags: "",
                commits: [],
                epic_label: "",
                task_count: 0,
                created: "",
                due_date: null,
                project_slug: "",
                modified: "",
                summary: "",
                estimated_minutes: 0,
                tags_list: [],
                extra_1: "",
                extra_2: "",
                extra_3: ""
            }
        }

        cleanHtmlCrap(story) {
            // We're going to manually remove any trailing sequences of <p><br/><p> at the end
            // this is due to a quirk on Firefox and our text editor adding that in when focus is
            // programatically assigned.It matters on summary because it shows up on the cards, but it does happen other places.
            trace("Before " + story.summary);
            story.summary = story.summary.replace(/\<p\>\<br\/\>\<\/p\>$/, '');
            trace("After " + story.summary);
        }

        modified(storyDate, messageDate) {
            try {
                var a = storyDate.substring(0, 19);
                var b = messageDate.substring(0, 19);
                return a < b;
            } catch (error) {
                return false;
            }
        }

        _checkIfMatchesFilters(story) {
            this._loadStoryIfMatchedFilter(story.id, story.project_slug, story.iteration_id, this.iterationFilters[story.iteration_id]).then((loadedStory) => {
                if (typeof loadedStory !== "undefined" && loadedStory !== null) {
                    // Make sure we are in the list
                    if (indexOf.call(this.iterationMap[story.iteration_id], story) < 0) {
                        this.iterationMap[story.iteration_id].push(story);
                    }
                } else {
                    // Make sure we are NOT in the list
                    removeById(this.iterationMap[story.iteration_id], story.id);
                }
            });
        }

        onPatch = (event, message) => {
            // Handle the realtime Patch event for stories.
            var storyId = message.payload.id;
            var modified = message.payload.modified;
            var story = this.getStory(storyId);
            var props = message.payload.properties;

            var ref, ref1;
            
            if ((typeof story === "undefined" || story === null) && ((props.iteration_id in this.iterationMap)
                || (((ref = props.epic) != null ? ref.id : void 0) in this.storiesByEpic)
                || (((ref1 = props.release) != null ? ref1.id : void 0) in this.storiesByRelease))) {
                
                // We had a card that is not loaded get moved into an iteration we care about.
                this.onStoryAdded(storyId, message.payload.project, props.iteration_id);
                return;
            }

            if (typeof story === "undefined" || story === null) {
                return;
            }
            if (!this.modified(story.modified, modified)) {
                return;
            }
            trace("Patching story " + storyId);
            // At this point, props.* are the new values, and story.* are the previous values
            // We copy over new values at the bottom of this function
            
            var iterationChanged = (props.iteration_id != null) && (props.iteration_id !== story.iteration_id);
            
            // First, remove it from the previous iteration list if we know for sure it shouldn't be in it
            if (iterationChanged && (story.iteration_id in this.iterationMap)) {
                removeById(this.iterationMap[story.iteration_id], story.id);
            }

            if (this._isFiltered(props.iteration_id)) {
                // If we're filtered, the modification might or might not cause the card to be added to
                // the filtered results.Any attribute, including iteration_id could
                // cause it at this point, so we have to do an expensive load.
                // But.. only do it after 15 seconds so make sure the search
                // index is updated.
                this.timeout((() => this._checkIfMatchesFilters(story)), 15000);
            } else if (iterationChanged) {
                // If we are NOT filtered,
                // and the iteration has changed, we can just add it to the new one
                if ((props.iteration_id in this.iterationMap) && !(indexOf.call(this.iterationMap[props.iteration_id], story) >= 0)) {
                    this.iterationMap[props.iteration_id].push(story);
                }
                if (!((story.epic != null) && -1 in this.storiesByEpic)) {
                    if (props.iteration_id === this.rootScope.project.kanban_iterations.archive && !this.rootScope.noEpicShowArchiveFlag) {
                        removeById(this.storiesByEpic[-1], story.id);
                    }
                    if (story.iteration_id === this.rootScope.project.kanban_iterations.archive && !this.rootScope.noEpicShowArchiveFlag) {
                        this.storiesByEpic[-1].push(story);
                    }
                }
            }

            var k, ref, ref1, v;
            if ("epic" in props) {
                // If the epic changed, make sure to adjust the @storiesByEpics lists
                if ((props.epic != null) && (props.epic.id != null)) {
                    ref = this.storiesByEpic;
                    for (k in ref) {
                        v = ref[k];
                        removeById(v, story.id);
                    }
                    if (props.epic.id in this.storiesByEpic) {
                        this.storiesByEpic[props.epic.id].push(story);
                    }
                }
                if ((props.epic == null) && -1 in this.storiesByEpic) {
                    this.storiesByEpic[-1].push(story);
                }
            }

            if ("release" in props) {
                if ((props.release != null) && (props.release.id != null)) {
                    // If the release changed, make sure to adjust the @storiesByRelease lists
                    ref1 = this.storiesByRelease;
                    for (k in ref1) {
                        v = ref1[k];
                        removeById(v, story.id);
                    }
                    if (props.release.id in this.storiesByRelease) {
                        this.storiesByRelease[props.release.id].push(story);
                    }
                }
            }

            // for team planning board
            if(props.iteration_id != null){
                this.patchStoryInIterationRelease(storyId, props, message.payload.project);
            }

            _.extend(story, props);
            this.rootScope.$broadcast('storyModified', story);
        }

        onSync = (event, message) => {
            // Handle the realtime Sync event for stories.
            var storyId = message.payload.id;
            var modified = message.payload.modified;
            var story = this.getStory(storyId);
            if (story == null) {
                return;
            }
            if (!this.modified(story.modified, modified)) {
                return;
            }
            trace("modified: " + story.modified + " " + modified);
            trace("Syncing story " + storyId);
            this.reload(storyId);
            this.rootScope.$broadcast('storyModified', story);
        }

        onAdd = (event, message) => {
            // Handle the realtime Add event for stories.
            this.onStoryAdded(message.payload.id, message.payload.project, message.payload.iteration);
        }

        _loadStoryIfMatchedFilter(storyId, project, iteration, filter) {
            // Loads a single story by way of a filtered search
            // (It really loads a filtered iteration and finds the story in it, someday we can write
            //  a better search call and improve it)
            var deferred = this.q.defer();
            this.loadIterations(project, [iteration], filter, false).then((stories) => {
                var story = _.findWhere(stories, { id: storyId });
                if (typeof story !== "undefined" && story !== null) {
                    deferred.resolve(story);
                } else {
                    deferred.resolve(null);
                }
            });
            return deferred.promise;
        }

        onStoryAdded = (storyId, project, iteration) => {
            if (storyId in this.stories) {
                this.rootScope.$broadcast('onStoryAdded', null);
                return; // already got it
            }
            trace("Adding story " + storyId);
            if (this._isFiltered(iteration)) {
                // If we have a filtered view, we don't want to load up added cards that don't match that
                // filter, so we have to re- run the full query and see if the story was in there.
                // But, we have a big problem.The search index isn't syncronously updated.  We might get
                // the message about the card being added before the card is added to the index, which means
                // we won't see it if we run the filter right now.  This is a bit of a hack, but we'll wait 15 seconds.
                var delayedLoad = () => {
                    trace('Loading filtered cards');
                    this._loadStoryIfMatchedFilter(storyId, project, iteration, this.iterationFilters[iteration]).then((story) => {
                        if (typeof story !== "undefined" && story !== null) {
                            trace('Found added story in our filtered cards');
                            this.onAddedStoryLoaded(story);
                        }
                    });
                }
                this.timeout(delayedLoad, 15000);
                trace('Story added, but active filter in place, try again in a bit.');
            } else {
                this.loadStory(storyId, project, iteration).then(this.onAddedStoryLoaded);
            }
        }

        _addNoDuplicates(story, list) {
            if (!_.find(list, (s: any) => s.id === story.id)) {
                list.push(story);
            }
        }

        private patchStoryInIterationRelease(storyId, props, project){
            if ( (props.iteration_id in this.iterationReleaseMap) ) {
                var story:Story = this.fetchStoryFromIterationRelease(storyId);
                this.removeStoryFromIterationRelease(storyId);
                if(story != null){
                    if ("release" in props) {
                        story.release = props.release;
                    }
                    story.iteration_id = props.iteration_id;
                    this.addStoryToIterationRelease(story);
                }else{
                    this.loadStory(storyId, project, props.iteration_id).then(this.onAddedStoryLoaded);
                }
            }
        }

        private fetchStoryFromIterationRelease(storyId){
            var story: Story = null;
            for(var iterationId in this.iterationReleaseMap) {
                for(var releaseId in this.iterationReleaseMap[iterationId]) {
                    if(story == null){
                        story = <Story> _.findWhere(this.iterationReleaseMap[iterationId][releaseId], {id: storyId});
                    }
                }
            }
            return story;
        }

        private removeStoryFromIterationRelease(storyId) {
            for(var iterationId in this.iterationReleaseMap) {
                for(var releaseId in this.iterationReleaseMap[iterationId]) {
                    removeById(this.iterationReleaseMap[iterationId][releaseId], storyId)
                }
            }
        }

        private addStoryToIterationRelease(story) {
            if ( (story.iteration_id in this.iterationReleaseMap) &&
                story.release &&
                (story.release.id in this.iterationReleaseMap[story.iteration_id] )  ) {
                this._addNoDuplicates(story, this.iterationReleaseMap[story.iteration_id][story.release.id]);
            }
        }


        onAddedStoryLoaded = (story) => {
            // When a realtime event comes in causing a story to be loaded up, this is the handler that sets
            // up all the tracking on it.
            this.trackStories([story]);
            this.trackFilteredStories([story]);
            if ((story.release != null) && (story.release.id in this.storiesByRelease)) {
                this._addNoDuplicates(story, this.storiesByRelease[story.release.id]);
            }
            if ((story.epic != null) && (story.epic.id in this.storiesByEpic)) {
                this._addNoDuplicates(story, this.storiesByEpic[story.epic.id]);
            }
            if ((story.epic == null) && (-1 in this.storiesByEpic)) {
                this._addNoDuplicates(story, this.storiesByEpic[-1]);
            }
            if (story.iteration_id in this.iterationMap) {
                this._addNoDuplicates(story, this.iterationMap[story.iteration_id]);
            }

            this.addStoryToIterationRelease(story);

            this.rootScope.$broadcast('storyModified', story);
        }

        onDel = (event, message) => {
            // Handle the realtime Del event for stories.
            var storyId = message.payload.id;
            trace("Remote delete story " + storyId);
            this.onRemoved(storyId);
            // this.rootScope.$broadcast('storyModified');
            this.rootScope.$broadcast('storyDeleted');
        }

        onMoved = (event, message) => {
            // Handle the realtime Moved event for stories.
            // This one happens when a story moves project/iteration
            this.rootScope.$broadcast('storyModified');
        }

        wrapStory = (properties) => {
            // Takes a json map of story data and creates a story resource
            // We use this when stories are loaded outside of the story mangager (like in the newsfeed)
            var newStory = new this.Story();
            _.extend(newStory, properties);
            this.stories[newStory.id] = newStory;
            return newStory;
        }
        
        // This is a pretty inefficient way of doing this.  You should only use it
        // when there are multiple unrelated story lists floating around, like in the planning tool.
        getSelectedStories() {
            var id, stories, story;
            stories = (function() {
                var ref, results;
                ref = this.stories;
                results = [];
                for (id in ref) {
                    story = ref[id];
                    if (story.selected) {
                        results.push(story);
                    }
                }
                return results;
            }).call(this);

            return _.uniq(stories, (story: Story) => story.id);
        }

        convertEpic(story) {
            var s = story;
            var storyId: number = story.id;
            var projectSlug: string = story.project_slug;
            var p = story.$convertepic();
            p.then((result) => {
                this.removeReferences(s, storyId);
                var stories = [];
                // Set up our internal tracking of these new stories.
                var i, len, ref, story, storyProperties;
                ref = result.child_stories;
                for (i = 0, len = ref.length; i < len; i++) {
                    storyProperties = ref[i];
                    story = this.wrapStory(storyProperties);
                    stories.push(story);
                    if (story.iteration_id in this.iterationMap) {
                        this.iterationMap[story.iteration_id].push(story);
                    }
                }
                this.trackStories(stories);
                this.trackFilteredStories(stories);
                // And internal tracking of the new epic.
                this.epicManager.track(projectSlug, result.epic);
            });
            return p;
        }

        duplicate(story) {
            var dupe = new this.Story();
            dupe.id = story.id;
            dupe.project_slug = story.project_slug;
            var p = dupe.$duplicate();
            p.then((newStory) => {
                this.trackStories([newStory]);
                this.trackFilteredStories([newStory]);
                if (newStory.iteration_id in this.iterationMap) {
                    this.iterationMap[newStory.iteration_id].push(newStory);
                }
                if ((newStory.epic != null) && newStory.epic.id in this.storiesByEpic) {
                    this.storiesByEpic[newStory.epic.id].push(newStory);
                }
                if ((newStory.epic == null) && -1 in this.storiesByEpic) {
                    this.storiesByEpic[-1].push(newStory);
                }
                if ((newStory.release != null) && newStory.release.id in this.storiesByRelease) {
                    this.storiesByRelease[newStory.release.id].push(newStory);
                }

                this.addStoryToIterationRelease(newStory);
                // 10/24/16 - Added this onStoryAdded event so I can detect new cards event to calculate various stats.
                this.rootScope.$broadcast('onStoryAdded', story);
            });

            return p;
        }


        private trackNewlyCreatedStory = (story:Story) => {
            this._handleOthersChanged(story);

            if (story.iteration_id in this.iterationMap) {
                this.iterationMap[story.iteration_id].push(story);
            }

            if ((story.epic != null) && story.epic.id in this.storiesByEpic) {
                this.storiesByEpic[story.epic.id].push(story);
            }

            if ((story.epic == null) && this.storiesByEpic[-1]) {
                //project got undefined on org releases planning page while creating new release
                if (this.rootScope.project != null) {
                    if (story.iteration_id === this.rootScope.project.kanban_iterations.archive && !this.rootScope.noEpicShowArchiveFlag) {
                        return;
                    }
                    this.storiesByEpic[-1].push(story);
                }
            }

            if ((story.release != null) && story.release.id in this.storiesByRelease) {
                this.storiesByRelease[story.release.id].push(story);
            }

            if ( (story.iteration_id in this.iterationReleaseMap) &&
                 story.release &&
                 (story.release.id in this.iterationReleaseMap[story.iteration_id] )  ) {

                this._addNoDuplicates(story, this.iterationReleaseMap[story.iteration_id][story.release.id])

            }

            this.stories[story.id] = story;

            // 9/26/16 - Added this onStoryAdded event so I can detect new cards in the team plan page.
            this.rootScope.$broadcast('onStoryAdded', null);

            return story;
        }

        create(projectSlug: string, properties) {

            // TODO - Do we still need cleanHtmlCrap with TinyMCE?
            this.cleanHtmlCrap(properties);

            var newStory = new this.Story();
            _.extend(newStory, properties);
            if ("id" in newStory) {
                delete newStory.id;
            }
            var p = newStory.$create({ projectSlug: projectSlug });
            p.then(this.trackNewlyCreatedStory);
            return p;
        }

        reload(storyId: number) {
            if (storyId in this.stories) {
                var story = this.stories[storyId];
                return story.$get();
            }
        }

        loadStory(storyId: number, projectSlug: string, iterationId = null): ng.IPromise<any> {
            if (storyId in this.stories) {
                var deferred = this.q.defer();
                deferred.resolve(this.stories[storyId]);
                return deferred.promise;
            } else {
                if (typeof iterationId !== "undefined" && iterationId !== null) {
                    return this.Story.load({ id: storyId, projectSlug: projectSlug, iterationId: iterationId }).$promise;
                } else {
                    return this.Story.loadFromProject({ id: storyId, projectSlug: projectSlug }).$promise;
                }
            }
        }

        searchStoryById(storyId: number, projectSlug: string, iterationId = null) {
            return this.loadStory(storyId, projectSlug, iterationId).then((story) => {
                this.trackStories([story]);
                this.trackFilteredStories([story]);
            });
        }

        loadActiveStories() {
            var t = this;
            var p = this.Story.activeStories({ organizationSlug: this.organizationSlug }).$promise;
            p.then((models) => {
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    model.organizationSlug = t.organizationSlug;
                }
            });
            p.then(this.trackStories);
            p.then(this.trackFilteredStories);
            return p;
        }

        loadStoriesForIterationEpic(projectSlug: string, iterationId: number, epicId: number) {
            var p = this.Story.byIterationEpic({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, epicId: epicId, iterationId: iterationId }).$promise;
            p.then(this.trackStories);
            p.then(this.trackFilteredStories);
            p.then((stories) => {
                this.storiesByEpic[epicId] = stories;
            });
            return p;
        }

        loadStoriesForRelease(projectSlug: string, releaseID: number) {
            var p = this.Story.byRelease({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, releaseID: releaseID }).$promise;
            p.then(this.trackStories);
            p.then(this.trackFilteredStories);
            p.then((stories) => {
                this.storiesByRelease[releaseID] = stories;
            });
            return p;
        }

        loadStoriesByReleaseId(portfolioSlug: string, releaseID: number) {
            var p = this.Story.byReleaseId({ organizationSlug: this.organizationSlug, projectSlug: portfolioSlug, releaseID: releaseID }).$promise;
            p.then(this.trackStories);
            p.then(this.trackFilteredStories);
            p.then((stories) => {
                this.storiesByRelease[releaseID] = stories;
            });
            return p;
        }

        loadReleaseStats(portfolioSlug: string, releaseID: number, loadChild:number = 0){
            var p = this.Story.releaseStats({ organizationSlug: this.organizationSlug, projectSlug: portfolioSlug, releaseID: releaseID ,loadChild:loadChild}).$promise;
            return p;
        }

        loadStoriesForEpic(projectSlug: string, epicId: number) {
            var p = this.Story.byEpic({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, epicId: epicId }).$promise;
            p.then(this.trackStories);
            p.then(this.trackFilteredStories);
            p.then((stories) => {
                this.storiesByEpic[epicId] = stories;
            });
            return p;
        }

        loadStoriesForNoEpic(projectSlug: string, epicId: number, showArchive) {
            var p = this.Story.byNoEpic({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, epicId: epicId, showArchive: showArchive }).$promise;
            p.then(this.trackStories);
            p.then(this.trackFilteredStories);
            p.then((stories) => {
                this.storiesByEpic[epicId] = stories;
            });
            return p;
        }

        searchOrganization(query: string, page: number = 1) {
            var p = this.Story.byOrganizationWithFilter({ organizationSlug: this.organizationSlug, query: query, page: page }).$promise;
            p.then((result) => {
                var i, len, model, ref, results;
                ref = result.items;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    model = ref[i];
                    results.push(model.organizationSlug = this.organizationSlug);
                }
                return results;
            });
            return p;
        }

        searchProject(projectSlug: string, query: string, page: number = 1) {
            var p = this.Story.byProjectWithFilter({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, query: query, page: page }).$promise;
            p.then((result) => {
                var i, len, model, ref, results;
                ref = result.items;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    model = ref[i];
                    model.organizationSlug = this.organizationSlug;
                    results.push(model.projectSlug = projectSlug);
                }
                return results;
            });
            return p;
        }

        _isFiltered(iterationId: number) {
            if (!(iterationId in this.iterationFilters)) {
                return false;
            }
            return this.iterationFilters[iterationId] !== '';
        }

        /* this method is being used for new board and cards list searching */
        /* this will keep tarck of serach stories separated than baord/card-list stories */
        searchIterations(projectSlug: string,
                       iterationIds,
                       query: string = "",
                       track: boolean = true) {

            trace("Searching stories for " + iterationIds + " with q?=" + query);
            for (var i = 0, len = iterationIds.length; i < len; i++) {
                var id = iterationIds[i];
                this.iterationFilters[id] = query;
            }
            var iterationIdParam = iterationIds.join(",");
            var p = null;

            p = this.Story.byIterationsWithFilter({ organizationSlug: this.organizationSlug, 
                                                    projectSlug: projectSlug, 
                                                    iterationId: iterationIdParam, 
                                                    query: query }).$promise;

            if (track) {
                p.then(this.trackFilteredStories);
            }

            p.then((models) => {
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    model.organizationSlug = this.organizationSlug;
                    model.projectSlug = projectSlug;
                }
            });

            return p;
        }

        loadIterations(projectSlug: string,
                       iterationIds,
                       query: string = "",
                       track: boolean = true,
                       releaseId:number=null) {
            trace("Loading stories for " + iterationIds + " with q?=" + query);
            for (var i = 0, len = iterationIds.length; i < len; i++) {
                var id = iterationIds[i];
                this.iterationFilters[id] = query;
            }
            let iterationIdParam = iterationIds.join(",");
            let p = null;
            if(releaseId) {
                p = this.Story.byReleaseAndIteration({ organizationSlug: this.organizationSlug,
                                              projectSlug: projectSlug,
                                              iterationId: iterationIdParam,
                                              releaseId:releaseId}).$promise;
                let track = this.trackReleaseIterationStories.bind(this, iterationIdParam, releaseId)
                p.then(track)

            } else if (query === "") {
                p = this.Story.byIterations({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, iterationId: iterationIdParam }).$promise;
            } else {
                p = this.Story.byIterationsWithFilter({ organizationSlug: this.organizationSlug, projectSlug: projectSlug, iterationId: iterationIdParam, query: query }).$promise;
            }

            if (track) {
                p.then(this.trackStories);
                p.then(this.trackFilteredStories);
                p.then((models) => {
                    if(releaseId == null) {  // If we're loading an iteration/release combo, DO NOT TRACK the result as an iteration list.
                        this.storyLists.push(models);
                        for (var i = 0, len = iterationIds.length; i < len; i++) {
                            var iterationId = iterationIds[i];
                            this.iterationMap[iterationId] = models;
                        }
                    }
                });
            }

            p.then((models) => {
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    model.organizationSlug = this.organizationSlug;
                    model.projectSlug = projectSlug;
                }
            });

            return p;
        }

        loadIterationStories(orgainsationSlug: string, projectSlug: string, iterationIds, query: string = "", track: boolean = true, page: number = 0, perPage:number= 0) {
            trace("Loading stories for " + iterationIds + " with q?=" + query);
            for (var i = 0, len = iterationIds.length; i < len; i++) {
                var id = iterationIds[i];
                this.iterationFilters[id] = query;
            }
            var iterationIdParam = iterationIds.join(",");
            var p = null;
          
                p = this.Story.byIterationsForCardPicker({ organizationSlug: orgainsationSlug, projectSlug: projectSlug, iterationId: iterationIdParam, query: query, page: page, perPage: perPage, cardPicker: true }).$promise;
            
            if (track) {
                p.then(this.trackStories);
                p.then(this.trackFilteredStories);
                p.then((models) => {
                    this.storyLists.push(models);
                    for (var i = 0, len = iterationIds.length; i < len; i++) {
                        var iterationId = iterationIds[i];
                        this.iterationMap[iterationId] = models;
                    }
                });
            }

            p.then((models) => {
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    model.organizationSlug = this.organizationSlug;
                    model.projectSlug = projectSlug;
                }
            });

            return p;
        }

        moveToProject(story, projectSlug: string, iterationId: number) {
            var url = API_PREFIX +
                "organizations/" + this.organizationSlug +
                "/projects/" + story.project_slug +
                "/stories/" + story.id +
                "/movetoproject/";

            var data = {
                project_slug: projectSlug,
                iteration_id: iterationId
            };

            var p = this.http({
                data: data,
                url: url,
                method: "PUT"
            });
            this.moveToIteration(story, iterationId);

            p.then((newStory: any) => {
                newStory.iteration_id = iterationId;
                newStory.project_slug = projectSlug;
                story.project_slug = projectSlug;
                // The server is now sending these signals for us.
                // this.syncronizedModel.signalModelEdited(newStory);
            });
            return p;
        }

        getStory(storyId) {
            return this.stories[parseInt(storyId)];
        }

        getFilteredStory(storyId) {
            return this.filteredStories[parseInt(storyId)];
        }

        trackFilteredStories = (models) => {
            var i, index, len, story;
            for (index = i = 0, len = models.length; i < len; index = ++i) {
                story = models[index];
                if (!story.cell_id || story.cell_id === null) {
                    if (this.rootScope.boardProject != null) {
                        story.cell_id = this.rootScope.boardProject.boardCells[0].id;
                    }
                }
                delete story.story_id_after;
                delete story.story_id_before;
                if (story.id in this.filteredStories) {
                    // We've previously loaded this story.
                    if (story !== this.filteredStories[story.id]) {
                        // First update our cached copy with any updates (if the reference is new)
                        angular.copy(story, this.filteredStories[story.id]);
                    }
                    // Then replace the one in the loaded list with the originally loaded one
                    // so only one reference to this story is used.
                    models[index] = this.filteredStories[story.id];
                } else {
                    // Remember it for later
                    this.filteredStories[story.id] = story;
                }
            }
            return;
        }

        trackReleaseIterationStories(iterationId, releaseId, stories) {
            if(!this.iterationReleaseMap[iterationId]) {
                this.iterationReleaseMap[iterationId] = {}
            }
            this.iterationReleaseMap[iterationId][releaseId] = stories

            return stories
        }

        trackStories = (models) => {
            var i, index, len, story;
            for (index = i = 0, len = models.length; i < len; index = ++i) {
                story = models[index];
                if (!story.cell_id || story.cell_id === null) {
                    if (this.rootScope.boardProject != null) {
                        story.cell_id = this.rootScope.boardProject.boardCells[0].id;
                    }
                }
                delete story.story_id_after;
                delete story.story_id_before;
                if (story.id in this.stories) {
                    // We've previously loaded this story.
                    if (story !== this.stories[story.id]) {
                        // First update our cached copy with any updates (if the reference is new)
                        angular.copy(story, this.stories[story.id]);
                    }
                    // Then replace the one in the loaded list with the originally loaded one
                    // so only one reference to this story is used.
                    models[index] = this.stories[story.id];
                } else {
                    // Remember it for later
                    this.stories[story.id] = story;
                }
            }
            return;
        }

        loadIteration(projectSlug: string, iterationId: number, query: string = "") {
            return this.loadIterations(projectSlug, [iterationId], query);
        }

        loadStoriesForAssignment(projectSlug: string, iterationId: number, assignmentId:number) {
            return this.loadIterations(projectSlug, [iterationId], "", true, assignmentId);
        }

        storiesForIteration(iterationId: number) {
            return _.where(this.stories, { iteration_id: iterationId });
        }

        storiesForIterationCell(iterationId: number, cellId: number) {
            return _.where(this.stories, { iteration_id: iterationId, cell_id: cellId });
        }

        bulkSave(stories, iterationId = null) {
            if (stories.length < 1) {

            }
            _.map(stories, this.cleanHtmlCrap);
            var projectSlug: string = stories[0].project_slug;
            if (typeof iterationId !== "undefined" && iterationId !== null) {
                var url = API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/iterations/" + iterationId + "/stories";
            } else {
                var url = API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + projectSlug + "/stories";
            }
            var p = this.http({
                data: stories,
                url: url,
                method: "PUT"
            });
            /*
            #       This was trying to maintain selected state of the cards across saves, but it really just caused more
            #       problems than it solved because most of latency in the requests and people moving on from their selection.
            #
            #        var selected = {};
            #        for (i = 0, len = stories.length; i < len; i++) {
            #             story = stories[i];
            #             selected[story.id] = story.selected;
            #         }
            */

            p.success((results: any) => {
                for (var i = 0, len = results.length; i < len; i++) {
                    var story = results[i];
                    delete story.force_rank;
                    _.extend(this.getStory(story.id), story);
                    _.extend(this.getFilteredStory(story.id), story);
                    this._handleOthersChanged(story);
                    // The server is now sending these signals for us.
                    // this.syncronizedModel.signalModelEdited(story)
                }
            });
            return p;
        }

        _handleOthersChanged(data) {
            if (data.reorderResults == null) {
                return;
            }
            var ref = data.reorderResults.storiesModified;
            for (var i = 0, len = ref.length; i < len; i++) {
                var other = ref[i];
                trace("Modified other", other);
                var story = this.getStory(other[0]);
                if (story != null) {
                    story.rank = other[1];
                }
            }
            delete data.reorderResults;
            return;
        }

        saveStory(story) {
            var selected = story.selected;
            this.cleanHtmlCrap(story);
            trace("StoryManager::saveStory", story.summary);
            if (!("$save" in story)) {
                story = this.wrapStory(story);
            }
            var p = story.$save();
            p.then((newStory) => {
                newStory.selected = selected;
                this._handleOthersChanged(newStory);
                // The server is now sending these signals for us.
                // this.syncronizedModel.signalModelEdited(story)
            });
            return p;
        }

        deleteStory(story) {
            var storyId = story.id;
            this.removeReferences(story, storyId);
            return story.$remove();
        }

        onRemoved = (storyId) => {
            // A remote client deleted that story.
            if (!(storyId in this.stories)) {
                return;
            }
            var story = this.stories[storyId];
            this.removeReferences(story, story.id);

        }

        onUpdate = (storyId, properties) => {
            if (!(storyId in this.stories)) {
                return;
            }
            var story = this.stories[storyId];
            _.extend(story, properties);
        }

        onAdded = (storyId, iterationId) => {
            trace("WARNING, YOU HAVENT DONE THIS YET");
        }
        
        // Sets the iteration_id property and updates any internal tracking lists so it points to the correct
        // locations.  This does not actually do a server call to save.
        moveToIteration(story, iterationId) {

            this.removeStoryFromIterationRelease(story.id);

            if (story.iteration_id in this.iterationMap) {
                removeById(this.iterationMap[story.iteration_id], story.id);
            }
            if (!(iterationId in this.iterationMap)) {
                this.iterationMap[iterationId] = [];
            }
            this.iterationMap[iterationId].push(story);
            // add or remove cards from No-Epic if moved from/into Archive Iteration
            if (!((story.epic != null) && -1 in this.storiesByEpic)) {
                if(this.rootScope.project != null){
                    if (iterationId === this.rootScope.project.kanban_iterations.archive && !this.rootScope.noEpicShowArchiveFlag) {
                        removeById(this.storiesByEpic[-1], story.id);
                    }
                    if (story.iteration_id === this.rootScope.project.kanban_iterations.archive && !this.rootScope.noEpicShowArchiveFlag) {
                        this.storiesByEpic[-1].push(story);
                    }
                }
            }
            story.iteration_id = iterationId;


            this.addStoryToIterationRelease(story);

            return;
        }

        moveToRelease(story, releaseId) {
            var ref;

            this.removeStoryFromIterationRelease(story.id);

            if (((ref = story.release) != null ? ref.id : void 0) in this.storiesByRelease) {
                removeById(this.storiesByRelease[story.release.id], story.id);
            }
            if (typeof releaseId !== "undefined" && releaseId !== null) {
                story.release = { id: releaseId };
                if (!(releaseId in this.storiesByRelease)) {
                    this.storiesByRelease[releaseId] = [];
                }
                this.storiesByRelease[releaseId].push(story);
            } else {
                story.release = null;
            }

            this.addStoryToIterationRelease(story);

            return;
        }
        
        // Sets the epic.id property and updates any internal tracking lists.
        // Does not actually do a server call to save.
        moveToEpic(story, epicId) {
            if ((story.epic == null) && -1 in this.storiesByEpic) {
                removeById(this.storiesByEpic[-1], story.id);
            }
            if ((story.epic != null) && story.epic.id in this.storiesByEpic) {
                removeById(this.storiesByEpic[story.epic.id], story.id);
            }
            if (typeof epicId === "undefined" || epicId === null) {
                story.epic = null;
                epicId = -1;
                if (story.iteration_id === this.rootScope.project.kanban_iterations.archive && !this.rootScope.noEpicShowArchiveFlag) {
                    return; //return if story is in archive and No-Epic Archive mode is Off
                }
            } else {
                story.epic = { id: epicId };
            }
            if (!(epicId in this.storiesByEpic)) {
                this.storiesByEpic[epicId] = [];
            }
            this.storiesByEpic[epicId].push(story);

            return;
        }


        removeReferences(story, storyId) {
            var epicId, i, j, len, list, ref, ref1, ref2, releaseId;

            ref = this.storiesByEpic;
            for (epicId in ref) {
                list = ref[epicId];
                i = list.indexOf(story);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            }

            ref1 = this.storiesByRelease;
            for (releaseId in ref1) {
                list = ref1[releaseId];
                i = list.indexOf(story);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            }

            ref2 = this.storyLists;
            for (j = 0, len = ref2.length; j < len; j++) {
                list = ref2[j];
                i = list.indexOf(story);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            }

            this.removeStoryFromIterationRelease(storyId)


            if (story.id in this.stories) {
                delete this.stories[storyId];
            }
        }
        
        agingDetails(story){
            var p = this.Story.getAging({ organizationSlug: this.organizationSlug, projectSlug: story.project_slug, id: story.id }).$promise;
            return p;
        }

        blockersEntries(story) {
            var p = this.Story.getBlockers({ organizationSlug: this.organizationSlug, projectSlug: story.project_slug, id: story.id }).$promise;
            return p;
        }
        
        blockerReasons(story){
            var p = this.Story.getBlockerReasons({ organizationSlug: this.organizationSlug, projectSlug: story.project_slug, id: story.id }).$promise;
            return p;
        }
        
        resetStoryAging(story){
            var s = new this.Story(story);
            var p = s.$resetAging();
            return p;
        }
    }
}   
