/// <reference path='../_all.ts' />

module scrumdo {
    export class PlanningSafeController {
        public static $inject: Array<string> = [
            "$scope",
            "storyManager",
            "projectSlug",
            "storyEditor",
            "projectManager",
            "iterationManager",
            "organizationSlug",
            "userService"
        ];

        private project: Project;
        private sortOrder:any;
        private isExpanded: boolean;
        private stories = {};
        private programIncreaments: Array<any>;
        private features = {};
        private showArchived:boolean;

        constructor(
            private scope,
            private storyManager: StoryManager,
            public projectSlug: string,
            private storyEditor: StoryEditor,
            private projectManager: ProjectManager,
            private iterationManager: IterationManager,
            public organizationSlug: string,
            private userService: UserService) {

            this.scope.$on('sortOrderChanged', this.onSortChange);
            this.scope.canWrite = this.userService.canWrite(this.scope.project.slug);
            this.isExpanded = false;
            this.showArchived = false;
        }

        onSortChange = (event, sort) => {
            if (sort === 'value_time') {
                this.sortOrder = [calculateValueOverTime_withRules, calculateValueOverTime];
            } else if (sort === 'value_point') {
                this.sortOrder = [calculateValueOverPoints_withRules, calculateValueOverPoints];
            } else if (sort === 'wsjf_value') {
                this.sortOrder = calculateWSJFValue;
            } else if (sort !== "rank") {
                this.sortOrder = [sort, "release_rank"];
            } else if (sort === "rank") {
                this.sortOrder = "release_rank";
            } else {
                this.sortOrder = sort;
            }
        }

        resetPrograms(){
            for(var i in this.programIncreaments){
                var f = this.programIncreaments[i];
                f.isExpanded = false;
            }
        }
        resetFeatures(program = null){
            if(program != null){
                var f = this.features[program.id];
                _.forEach(f, (i:any) => i.isExpanded = false);
            }else{
                for(var i in this.features){
                    var f = this.features[i];
                    _.forEach(f, (i:any) => i.isExpanded = false);
                }
            }
        }

        toggleExpanded() {
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded) {
                this.loadPrograms();
            }else{
                this.resetPrograms();
                this.resetFeatures();
            }
        }

        toggleExpandedItr(program) {
            program.isExpanded = !program.isExpanded;
            if(program.isExpanded){
                this.loadFeatures(program);
            }else{
                this.resetFeatures(program);
            }
        }

        toggleExpandedFeature(feature) {
            feature.isExpanded = !feature.isExpanded;
            if(feature.isExpanded){
                this.loadStories(feature);
            }
        }

        setFeatures = (features, program) => {
            this.features[program.id] = features;
        }

        setStories = (stories, feature) => {
            this.stories[feature.id] = stories;
        }

        addCard(feature){
            this.storyEditor.createStory(this.scope.project, { release: feature });
        }

        loadPrograms(){
            this.iterationManager.loadIterations(this.organizationSlug, this.scope.parent.slug).then( (iteraions) => {
                this.programIncreaments = iteraions;
                this.resetPrograms();
            });
        }

        loadFeatures(program){
            this.storyManager.loadIteration(this.scope.parent.slug, program.id).then((features) => {
                this.setFeatures(features, program);
            });
        }

        loadStories(feature){
            this.storyManager.loadStoriesForRelease(this.projectSlug, feature.id).then((stories) => {
                this.setStories(stories, feature);
                this.scope.$emit("storiesChanged");
            });
        }

        selectAll(feature) {
            if(feature != null){
                _.forEach(this.stories[feature.id], (d:any) => d.selected = true)
                this.scope.$emit("selectionChanged");
            }else{
                this.scope.$broadcast("selectAll");
            }
        }

        selectNone(feature) {
            if(feature != null){
                _.forEach(this.stories[feature.id], (d:any) => d.selected = false)
                this.scope.$emit("selectionChanged");
            }else{
                this.scope.$broadcast("selectNone");
            }
        }

        filterPrograms = (program) => {
            if(!this.showArchived && program.hidden) return false;
            return true;
        }

        featureStats(feature){
            var stats = {};
            stats['totalCards'] =  this.stories[feature.id].length;
            stats['totalPoints'] = this.getTotals(this.stories[feature.id]).points;
            stats['totalMinutes'] = this.getTotals(this.stories[feature.id]).minutes;
            stats['businessValue'] = this.getTotals(this.stories[feature.id]).businessValue;
            return stats;
        }

        programStats(program){
            var stats = {};
            stats['totalCards'] =  this.features[program.id].length;
            stats['totalPoints'] = this.getTotals(this.features[program.id]).points;
            stats['totalMinutes'] = this.getTotals(this.features[program.id]).minutes;
            stats['businessValue'] = this.getTotals(this.features[program.id]).businessValue;
            return stats;
        }

        getTotals = (stories) => {
            var ref = getStoryTotals(stories);
            return {points: ref[0], minutes: ref[1], businessValue: ref[2]};
        }

        closeAll(event){
            this.isExpanded = false;
            this.resetPrograms();
            this.resetFeatures();
        }
    }
}