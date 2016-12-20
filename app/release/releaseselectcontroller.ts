/// <reference path='../_all.ts' />

module scrumdo {
    interface ReleseSelectScope extends ng.IScope{
        parents:Array<any>;
        releases: Array<any>;
        allowEmpty: boolean;
        currentValue:any;
        placeholder:string;
    }
    export class ReleaseSelectController {
        public static $inject: Array<string> = [
            "$scope",
            "$uibModal",
            "urlRewriter"
        ];

        public projects:Array<any>;
        public filterQuery: string;
        public ngModel:ng.INgModelController;
        public dialog:ng.ui.bootstrap.IModalServiceInstance;

        constructor(public scope:ReleseSelectScope,
                    public $modal:ng.ui.bootstrap.IModalService,
                    public urlRewriter:URLRewriter) {
                    this.projects = this.scope.parents;
        }

        public init = (ngModel:ng.INgModelController) => {
            this.ngModel = ngModel;
            if (this.ngModel.$modelValue) {
                this.scope.currentValue = this.ngModel.$modelValue;
            }

            this.ngModel.$render = () => {
                return this.scope.currentValue = this.ngModel.$modelValue;
            };
        }

        public getLabel(release){
            if(release != null){
                return release["summary"];
            }else{
                return this.scope.placeholder == null ? "Release/Milestone" : this.scope.placeholder;
            }
        }

        public selectRelease(){
            this.showParents().then((release) => {
                this.select(release);
            });
        }

        public select(release) {
            this.ngModel.$setViewValue(release);
            this.scope.currentValue = release;
        }

        public showParents(){
            var projects:Array<any> = this.scope.parents;
            this.dialog = this.$modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("release/releaseparents.html"),
                controller: "ReleaseParentsController",
                controllerAs: 'ctrl',
                size: "md",
                backdrop: "static",
                keyboard: true,
                resolve: {
                    projects: () => projects,
                    releases: () => this.scope.releases,
                    allowEmpty : () => this.scope.allowEmpty
                }
            });

            return this.dialog.result;
        }
    }

    export class ReleaseParentsController{
        public static $inject: Array<string> = [
            "$scope",
            "projects",
            "releases",
            "allowEmpty"
        ];
        
        private selectedParent;
        private step:number;
        private query:string;
        private filtered;
        private showBackButton: boolean;

        constructor(public $scope, 
                    public projects:Array<Project>,
                    public releases:Array<any>,
                    public allowEmpty:boolean) {
            this.query = "";
            this.showBackButton = true;
            if(projects.length > 1){
                this.step = 1;
            }else{
                this.showBackButton = false;
                this.selectProject(projects[0]);
            }
        }

        projectFilter = (release) => {
            return release.project_slug == this.selectedParent.slug;
        }

        filter = (release) => {
            var s:string = this.query.toLowerCase();
            var id:string = '#'+release.id;
            return release.summary.toLowerCase().indexOf(s) !== -1;
        }

        goBack(){
            this.step = 1;
        }

        selectProject(project) {
            this.selectedParent = project;
            this.step = 2;
            setTimeout( () => {
                $('.parent-release-filter', '.release-project-selector').focus();
            },200);
        }

        selectRelease(release){
            return this.$scope.$close(release);
        }
        
        selectNone(){
            return this.$scope.$close(null);
        }

        cancel() {
            this.$scope.$dismiss();
        }
    }
}