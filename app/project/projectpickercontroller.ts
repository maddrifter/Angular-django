/// <reference path='../_all.ts' />

module scrumdo {
    export class ProjectPickerController {
        public static $inject:Array<string> = [
            "$scope",
            "userService"
        ];

        public showInactive:boolean = false;
        public showOnlyWatched:boolean = false;
        public showPortfolio:boolean = false;
        public projectByCategory;
        private safeProjectList;

        constructor(private $scope, private userService:UserService) {
            this.setupProjectCategories();
            $scope.$watch('projects', this.setupProjectCategories)
            this.safeProjectList = projectByPortfolioV2(this.$scope.projects);
        }

        setupProjectCategories = () => {
            let projects = this.$scope.projects.filter((project) => project.project_type == 1)
            this.projectByCategory = projectsByCategory(projects);
        }

        selectProject(project) {
            var p = _.find(this.$scope.projects, (p:any) => p.slug == project.slug)
            this.$scope.selected({ project: p });
        }

        toggleInactive() {
            this.showInactive = ! this.showInactive;
        }
        togglePortfolio() {
            this.showPortfolio = ! this.showPortfolio;
        }

    }
}