/// <reference path='../../_all.ts' />

module scrumdo {

    export class SafeProjectSelectCtrl {
        public static $inject:Array<string> = ["$scope", "userService", "$timeout", "projectSlug", "$element"];

        public ngModel:ng.INgModelController;
        public filterQuery: string;
        public menuOpen: boolean;
        public filteredItems:any;

        constructor(private scope, 
                    private userService:UserService, 
                    public timeout:ng.ITimeoutService, 
                    public projectSlug:string,
                    public element:ng.IAugmentedJQuery) {
            this.menuOpen = false;
            this.filterQuery = "";
            this.scope.$on("hideDropDown", this.hideDropDown);
        }
        
        hideDropDown = () => {
            if(this.menuOpen == true){
                this.menuOpen = !this.menuOpen;
            }
        }
        
        toggleMenu($event: MouseEvent) {
            $event.preventDefault();
            $event.stopPropagation();
            this.menuOpen = !this.menuOpen;
            // trace("Menu open: " + this.menuOpen);
            if(this.menuOpen){
                if($('#safe-project-select','.modal-body').length > 0){
                    $('.modal-body').css({overflow:'hidden'});
                    this.timeout( ()=> {
                        var dropdown = $('.safe-project-dropdown', '#safe-project-select');
                        var toggleBtn = $('.safe-project-dropdown-toggle', '#safe-project-select');
                        dropdown.css({ position:'fixed', top:toggleBtn.offset().top, width:'100%' });
                        $('.modal-body').css({overflow:''});
                        this.scrollToProject(this.projectSlug);
                    },100);
                }
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

        getLabel = (obj) => {
            var prop;
            if (obj == null) {
                return this.scope.placeholder || "";
            }else{
                return obj.name;
            }
        };

        isCurrentProject(project){
            if(this.projectSlug != null){
                return this.projectSlug == project.slug;
            }else{
                return false;
            }
        }

        scrollToProject(slug:string){
            if(this.projectSlug != null){
                var slug:string = this.scope.currentValue != null ? this.scope.currentValue.slug : this.projectSlug;
                var ul:ng.IAugmentedJQuery = this.element.find('ul.scrumdo-dropdown');
                var li:ng.IAugmentedJQuery = ul.find('.check_'+slug);
                var top:number = li.position().top - 40;
                ul.scrollTop(top);
            }
        }
    }
}