/// <reference path='../../_all.ts' />

module scrumdo {
    export class CardPickerController {
        public static $inject: Array<string> = [
            "organizationSlug",
            "$scope",
            "projectManager",
            "iterationManager",
            "currentProject",
            "storyManager",
            "alertService",
            "currentIteration",
            "confirmService",
            "currentStoryId"];



        public winTitle: string;
        public stories;
        private cardLayout: string;
        private currentPage: number;
        private maxPage: number;
        private storyCount: number;
        private perPage: number;
        private selectedStories: any;
        private deselectedStories: any;
        private totalSelected: Array<any>;
        private slug: string;
        private allSelectMode: boolean = false;
        private allSelectPage: Array<boolean>;

        private iterations;
        private iterationsOrNone;
        private pageToggle: boolean = false;

        constructor(public organizationSlug: string,
                    public scope,
                    public projectManager: ProjectManager,
                    public iterationManager: IterationManager,
                    public currentProject,
                    public storyManager: StoryManager,
                    public alertService: AlertService,
                    public currentIteration,
                    public confirmService: ConfirmationService,
                    private currentStoryId:number) {
            this.scope.ctrl = this;
            this.winTitle = "Card Picker";
            this.maxPage = 100;
            this.perPage = 25;
            this.onInit();
            this.slug = this.currentProject.slug;
            this.onProjectSelected();
            this.scope.$on("projectSelectionChanged", this.onProjectSelected);
            this.scope.$on("IterationSelected", this.onIterationSelected);
            this.totalSelected = [];
            this.allSelectPage = [];
        }

        onInit = () => {
            this.cardLayout = 'cardpicker';
            this.currentPage = 1;
            this.scope.searchText = "";
            this.projectManager.loadProjectsForOrganization(this.organizationSlug).then((result) => {
                this.scope.projects = result;
                if(this.currentProject === null)
                this.currentProject = this.scope.projects[0];
            });
        }

        onProjectSelected = () => {
            this.iterationManager.loadIterations(this.organizationSlug, this.currentProject.slug).then((result) => {
                this.scope.iterations = result;
                this.iterations = result;

                this.iterationsOrNone = result.concat();
                var allIterations = { name: 'All Iterations', id: -1, hidden: false };
                this.iterationsOrNone.unshift(allIterations);
                this.scope.iterations = this.iterationsOrNone;

                if (this.slug != this.currentProject.slug || this.currentIteration == null) {
                    this.currentIteration = _.find(this.scope.iterations, {
                        name: "All Iterations"
                    });
                }
                this.scope.$emit("IterationSelected");
                this.slug = this.currentProject.slug;
                this.resetPage();
            });
        }

        onIterationSelected = () => {
            this.resetPage();
            this.loadStories(this.scope.searchText);
        }

        resetPage = () => {
            this.scope.searchText = "";
            this.currentPage = 1;
            this.stories = [];
            this.totalSelected = [];
            this.allSelectPage = [];
        }

        onStoriesLoaded = (stories) => {
            this.maxPage = stories.max_page;
            this.allSelectMode = false;
            this.storyCount = stories.count;
            this.currentPage = stories.current_page;
            this.stories = _.map(stories.items, this.storyManager.wrapStory);

            if (this.totalSelected.length) {
                for (var i = 0; i < this.stories.length; i++) {
                    var matchingItem = _.where(this.totalSelected, {
                        number: this.stories[i].number
                    });

                    if (matchingItem.length != 0) {
                        this.stories[i].selected = true;
                    }
                }
            }

            if (this.allSelectPage.length === this.currentPage + 1) {
                this.allSelectMode = this.allSelectPage[this.currentPage];
            }

        }

        pageChanged = () => {
            this.pageToggle = true;
            this.getSelectedStories();
            this.loadStories(this.scope.searchText);

        }

        search(query) {
            this.resetPage();
            this.loadStories(query);
        }

        loadStories(query) {
            if (this.currentIteration.id === -1) {
                var ref = this.iterations;
                var iteration = [];
                for (var i = 0, len = ref.length; i < len; i++) {
                    if(ref[i].id != -1)
                    iteration.push(ref[i].id)
                }

                    this.storyManager.loadIterationStories(this.organizationSlug, this.currentProject.slug, [iteration], query, false, this.currentPage, this.perPage).then(this.onStoriesLoaded);
                }

            else
            this.storyManager.loadIterationStories(this.organizationSlug, this.currentProject.slug, [this.currentIteration.id], query , false, this.currentPage, this.perPage).then(this.onStoriesLoaded);
        }

        cancel(){
            this.getSelectedStories();
            if(this.totalSelected.length > 0){
                this.confirmService.confirm("Proceed Ahead?", this.getWarningMessage("cancel") , "No", "Yes", "btn-danger")
                .then(this.scope.$dismiss);
            }else{
                this.scope.$dismiss();
            }
        }

        select() {
            this.getSelectedStories();
            if(this.totalSelected.length == 0){
                this.alertService.alert("Proceed Ahead?", this.getWarningMessage("select"));
            }else{
                this.confirmService.confirm("Proceed Ahead?", this.getWarningMessage("select") , "No", "Yes", "btn-danger")
                    .then(this.confirmSelect);
            }

        }

        getWarningMessage(type: string): string{
            var message: string;
            if(this.totalSelected.length < 1){
                message = "You have picked " + this.totalSelected.length + " card(s). Please select at least one card to proceed.";
            }else{
                if(type == "select"){
                    message = "You have picked " + this.totalSelected.length + " card(s). Are you sure you want to move ahead?";
                }else{
                    message = "You have picked " + this.totalSelected.length + " card(s). Are you sure you want to cancel?";
                }
            }
            return message;
        }

        confirmSelect = () => {
            this.scope.$close({ selected: this.scope.ctrl.totalSelected })
        }

        getSelectedStories = () => {
            this.selectedStories = _.where(this.stories, {
                selected: true
            });

            this.deselectedStories = _.where(this.stories, {
                selected: false
            });

            for (var i = 0; i < this.selectedStories.length; i++) {
                var matchingItem = _.where(this.totalSelected, {
                    number: this.selectedStories[i].number
                });

                if (matchingItem.length === 0) {
                    this.selectedStories[i]['project'] = this.currentProject;
                    this.totalSelected.push(this.selectedStories[i]);
                }
            }

            if (this.deselectedStories.length && !this.pageToggle) {
                this.allSelectPage[this.currentPage] = true;
            }

            if (this.totalSelected.length) {
                for (var i = 0; i < this.deselectedStories.length; i++) {
                    var item = _.find(this.totalSelected, {
                        number: this.deselectedStories[i].number
                    });

                    if (!!item) {
                        this.totalSelected = $.grep(this.totalSelected, function (el, idx) { return el.id == item.id }, true);
                    }
                }
            }
        }

        getSelectedCount() {
            this.getSelectedStories();
            return this.selectedStories.length;
        }

        onSelectionChanged = () => {
            if (this.getSelectedCount() != _.filter(this.stories, (s:any) => s.id != this.currentStoryId).length) {
                this.allSelectMode = false;
            } else {
                this.allSelectMode = true;
            }
        }

        selectAll() {
            if (this.allSelectMode ) {
                this.deselectAll();
                this.allSelectMode = false;
                return;
            }
            var i, len, ref, story;
            ref = this.stories;
            for (i = 0, len = ref.length; i < len; i++) {
                story = ref[i];
                if(story.id != this.currentStoryId){
                    story.selected = true;
                }
            }
            this.allSelectMode = true;
            this.onSelectionChanged();
            this.allSelectPage[this.currentPage] = true;
        }

        deselectAll() {
            var i, len, ref, story;
            this.getSelectedStories();
            ref = this.selectedStories;
            for (i = 0, len = this.selectedStories.length; i < len; i++) {
                story = ref[i];
                story.selected = false;
                this.totalSelected = $.grep(this.totalSelected, function (el, idx) { return el.number == story.number }, true)
            }

            this.allSelectPage[this.currentPage] = false;
        }
    }
}