/// <reference path='../_all.ts' />

module scrumdo {

    export class SafeProjectDropdownCtrl {
        public static $inject:Array<string> = ["$scope", 
                                                "userService", 
                                                "projectSlug", 
                                                "$element", 
                                                "$timeout"];

        public ngModel:ng.INgModelController;
        public filterQuery: string;
        public menuOpen: boolean;
        public filteredItems:any;

        constructor(private scope, 
                    private userService:UserService,
                    public projectSlug:string,
                    public element:ng.IAugmentedJQuery,
                    public timeout:ng.ITimeoutService) {
            this.menuOpen = false;
            this.filterQuery = "";
            this.scope.$on("hideDropDown", this.hideDropDown);
            this.scope.$on("projectSettingsUpdated", this.rebuildDropDown);
            this.scope.alignment = this.scope.alignment || 'dropdown-menu-right';

        }

        rebuildDropDown = () => {
            this.userService.reloadUserProjects();
        }
        
        hideDropDown = () =>{
            if(this.menuOpen == true){
                this.menuOpen = !this.menuOpen;
            }
        }

        selectProject($event, project) {
            $event.preventDefault();
            this.scope.project = project;
            this.scope.projectSelected({project:project});
        }
        
        toggleMenu($event: MouseEvent) {
            $event.preventDefault();
            $event.stopPropagation();
            this.menuOpen = !this.menuOpen;
            if(this.menuOpen){
                this.scrollToProject(this.projectSlug);
            }
        }
        
        doFilterQuery = (project) => {
            var v: string;
            if (this.filterQuery == "") return true;
            v = project.name.toLowerCase();
            return v.indexOf(this.filterQuery.toLowerCase()) !== -1;
        }

        filterRoot = (key) => {
            return (project) => {

                if(this.filteredItems[key] != null){
                    return this.filteredItems[key].length > 0;
                }else{
                    return false;
                }
            }
        }

        doNothing = (event) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        matchFound = () => {
            for(var i in this.filteredItems){
                var c = this.filteredItems[i];
                if(c.length > 0 && !isNaN(parseInt(i))) {
                    return true;
                }
            }
            return false;
        }

        isCurrentProject(project){
            if(this.projectSlug != null){
                return this.projectSlug == project.slug;
            }else{
                return false;
            }
        }

        scrollToProject(slug:string){
            if(this.projectSlug != null){
                this.timeout( ()=> {
                    var ul:ng.IAugmentedJQuery = this.element.find('ul.project-list-holder');
                    var li:ng.IAugmentedJQuery = ul.find('.check_'+this.projectSlug);
                    var top:number = li.position().top - 30;
                    ul.scrollTop(top);
                } ,100);
            }
        }
    }
}