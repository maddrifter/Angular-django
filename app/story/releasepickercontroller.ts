/// <reference path='../_all.ts' />

module scrumdo {

    interface ReleasePickerScope extends ng.IScope {
        story:Story;
        project:Project;
        release:MiniRelease;
    }


    export class ReleasePickerController {

        public tooltip:string;
        public userSearchInput:string = '';

        public options:PagedMiniReleaseResponse;

        public isLoading:boolean = false;

        public menuOpen:boolean = false;
        public selectedParent:MiniParentProject = null;

        private lastSearch:string;
        private currentPage:number = 1;
        private workItemName:string;


        public static $inject:Array<string> = [
            "$scope",
            "storyAssignmentManager"
        ];

        constructor(private $scope:ReleasePickerScope,
                    private storyAssignmentManager:StoryAssignmentManager) {

            if(this.$scope.story == null){
                this.$scope.story = <any> {id: -1};
            }
            if(this.$scope.project.parents.length > 0) {
                this.selectedParent = this.$scope.project.parents[0]
            }
            this.loadAssignments();

            // this.$scope.release
            if(this.$scope.$root['safeTerms'] == null){
                this.workItemName = "Release";
            }else{
                this.workItemName = this.$scope.$root['safeTerms'].parent != null ? this.$scope.$root['safeTerms'].parent.work_item_name : "Release";
            }
            this.tooltip = `Choose ${this.workItemName} for this card.`;
        }



        loadAssignments(pageToLoad:number=1, onSuccess=this.onAssignments) {

            let hash = this.$scope.project.slug + this.$scope.story.id + this.selectedParent.slug + this.userSearchInput + pageToLoad;
            if(this.lastSearch==hash) return;
            this.lastSearch = hash;
            this.isLoading = true;
            this.currentPage = pageToLoad;
            this.storyAssignmentManager
                .loadPossibleAssignments(
                    this.$scope.project.slug,
                    this.$scope.story.id,
                    this.selectedParent.slug,
                    this.userSearchInput,
                    20,
                    pageToLoad).then(onSuccess)
        }

        private onAssignments = (event) => {
            this.isLoading = false;
            this.options = event.data;
        }

        private onMoreAssignments = (event) => {
            this.isLoading = false;

            let newOptions:PagedMiniReleaseResponse = event.data;
            newOptions.items = this.options.items.concat(newOptions.items);

            this.options = newOptions;
        }

        hasMore():boolean {
            if(!this.options) {
                return false;
            }
            return this.options.current_page < this.options.max_page;
        }

        toggleMenu($event) {
            $event.preventDefault();
            $event.stopPropagation();
            this.menuOpen = !this.menuOpen;
        }

        getLabel(option:MiniRelease):string {
            if(!option) {
                return this.workItemName;
            }
            var prefix = option.project_prefix != null ? option.project_prefix : option["prefix"]; 
            return `${prefix}-${option.number} - ${option.summary}`;
        }

        showMore($event){
            $event.preventDefault();
            this.loadAssignments(this.currentPage+1, this.onMoreAssignments)
        }

        select($event, option:MiniRelease) {
            $event.preventDefault();
            this.$scope.release = option;
            this.menuOpen = false;
        }
    }
}