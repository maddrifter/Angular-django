/// <reference path='../../_all.ts' />
module scrumdo {
    export class SDDependenciesBoxController {
        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter",
            "mixpanel",
            "organizationSlug",
            "$rootScope",
            "dependencyManager",
            "confirmService",
            "$filter",
            "storyEditor",
            "storyManager"
        ];

        public ngModel: ng.INgModelController;

        public dependentTo:Array<DependencyStory> = [];
        public dependentOn:Array<DependencyStory> = [];
        public project:Project;
        public isAdding:boolean = false;
        public isLoading:boolean = false;
        public userSearchInput:string = '';
        public lastSearch:string;
        public options:{
            max_page: number;
            count: number;
            current_page: number;
            items: Array<Story>;
        };

        constructor(
            public scope,
            public urlRewriter: URLRewriter,
            public mixpanel,
            public organizationSlug: string,
            public rootscope,
            public dependencyManager: DependencyManager,
            public confirmService: ConfirmationService,
            private $filter,
            private storyEditor:StoryEditor,
            private storyManager:StoryManager) {

            scope.$watch("story", this.loadDependencies);
            this.project = scope.project;

        }

        public startAdding(){
            this.isAdding = true;
            // loading stories only if user wants to
            this.loadPossibleDependencies();
        }

        public projectSelected(project:Project) {
            this.project = project;
            this.loadPossibleDependencies();
        }

        public getLabel(story:Story):string {
            if(!story) {
                return 'None';
            }
            return `${this.project.prefix}-${story.number} - ${story.summary}`;
        }

        public loadPossibleDependencies(pageToLoad:number=1) {

            let hash = this.project.slug + this.userSearchInput + pageToLoad;;
            if(this.lastSearch==hash) return;
            this.lastSearch = hash;
            this.isLoading = true;
            this.storyManager.searchProject(this.project.slug, this.userSearchInput).then( (options) => {
                if(this.lastSearch != hash) return;
                this.options = options;
                this.isLoading = false;
            });
        }


        public removeDependency = (storyId, dependentId) => {
            this.confirmService.confirm("Are you sure?",
                                        "Do you want to remove this dependency?",
                                        "No",
                                        "Yes")
                .then(() => this.dependencyManager.removeDependency(storyId, dependentId))
                .then(this.loadDependencies)
                .then(this.signalChanged);
        }

        public openStory(story) {
            story.project_slug = story.project.slug;
            this.storyEditor
                .editStory(story, null)
                .then((result) => result.savePromise) // This then is the dialog closing, the savePromise tells us when it's saved.
                .then(this.loadDependencies);
        }

        public formatDependency(story) {
            return this.$filter('decodeHtmlEntities')(story.summary.replace(/<[^>]+>/gm, ""));
        }

        private onLoaded = (dependencies) => {
            this.dependentOn = dependencies.data['dependent_on'];
            this.dependentTo = dependencies.data['dependent_to'];
            this.isLoading = false;
            this.drawConnectingLines();
        };

        loadDependencies = () => {
            trace("Loading dependencies");
            if ((this.scope.story == null) || this.scope.story.id === -1) {
                return;
            }

            this.dependencyManager
                .loadDependencies(this.scope.story.id)
                .then(this.onLoaded);
        }

        select = ($event, option) => {
            $event.preventDefault();
            this.isAdding = false;
            this.isLoading = true;
            return this.dependencyManager
                .addDependencies(this.scope.story.id, [option])
                .then(this.onLoaded)
                .then(this.signalChanged);
        }



        signalChanged = () => {
            this.scope.$root.$broadcast('dependencyChanged');
            this.drawConnectingLines();
        }

        drawConnectingLines(){
            let data = [];
            delete this.scope.$root['svgConnectorsData']
            _.forEach(this.dependentOn, (s:any) => {
                data.push({ start: `#dependentOn-${s.id}`, end: `#story-${this.scope.story.id}` });
            });

            _.forEach(this.dependentTo, (s:any) => {
                data.push({ start: `#story-${this.scope.story.id}`, end: `#dependentTo-${s.id}` });
            });
            
            this.scope.$root['svgConnectorsData'] = data;

            this.scope.$broadcast("drawSvgConnectors", null);
        }
    }
}