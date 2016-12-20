/// <reference path='../_all.ts' />

module scrumdo {
    export class BreadCrumbsController {

        public currentIteration:Iteration;

        public static $inject:Array<string> = [
            "projectDatastore",
            "$scope",
            "$state",
            "$window",
            "STATIC_URL"
        ];

        constructor(public projectData:ProjectDatastore,
                    public $scope:ng.IScope,
                    private $state:ng.ui.IStateService,
                    private $window:ng.IWindowService,
                    STATIC_URL) {
            this.setIteration()
            $scope['STATIC_URL'] = STATIC_URL;
            $scope.$on('$stateChangeSuccess', this.setIteration);
            $scope['currentProject'] = projectData.currentProject;
        }

        public projectSelected = (project) => {
            let url = `/projects/${project.slug}/`;
            this.$window.location.replace(url);
            console.log('Navigating to ' + url);
        }

        public onIterationSelected = () => {
            trace(`'iteration selected: ${this.currentIteration.id}`)
            let newParams = _.extend({}, this.$state.params, {iterationId: String(this.currentIteration.id)})
            this.$state.go(this.$state.current.name, newParams);

            if(this.$state.current.name.substr(0,13) != 'app.iteration') {
                // Only need to setCurrentIteration if we are not on an app.iteration.* view because those
                // views will call this in their resolve() method.
                this.projectData.setCurrentIteration(this.projectData.currentProject.slug, this.currentIteration.id)
            }
        }

        private setIteration = () => {
            this.currentIteration = this.projectData.currentIteration;
        }

    }
}