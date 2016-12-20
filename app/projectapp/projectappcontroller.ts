/// <reference path='../_all.ts' />

module scrumdo {
    export class ProjectAppController {
        public static $inject:Array<string> = [
            "$scope",
            "$state",
            "projectData",
        ];

        constructor(private $scope:ng.IScope,
                    public $state: ng.ui.IStateService,
                    public projectData:ProjectDatastore) {
                        
            $scope.$root['project'] = projectData.currentProject;
            $scope.$root.$emit('fullyLoaded');
            var uiTabs = {  summary: projectData.currentProject.tab_summary,
                            board: projectData.currentProject.tab_board,
                            teamplanning: projectData.currentProject.tab_teamplanning,
                            dependencies: projectData.currentProject.tab_dependencies,
                            chat: projectData.currentProject.tab_chat,
                            planning: projectData.currentProject.tab_planning,

                        };
            
            var currentState = $state.current.name.split('.');
            var view = currentState[currentState.length-1];
            switch(view){
                case 'viewStory':
                    view = 'board';
                break;
            }

            if(uiTabs[view]!=null && uiTabs[view] === false){
                console.log('Attempted to load a project tab that we should not have in this project' + $state.current.name);
                $state.go('app.iteration.cards', this.$state.params);
            }

            this.$scope.$root.$on('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
                console.log(`$stateChangeStart: from ${fromState.name} to ${toState.name}`);
                console.log(toParams);
            });

            this.$scope.$root.$on('$stateChangeError', (event, toState, toParams, fromState, fromParams) => {
                console.log(`$stateChangeError: from ${fromState.name} to ${toState.name}`);
                console.log(toParams);
            });

            this.$scope.$root.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
                console.log(`$stateChangeSuccess: from ${fromState.name} to ${toState.name}`);
                console.log(toParams);
            });

            this.$scope.$root.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
               if( $state.current.name != 'app.iteration.cards' &&
                   $state.current.name.substr(0,13) == 'app.iteration' &&
                   projectData.currentIteration!=null &&
                   projectData.currentIteration.iteration_type != 1){
                   $state.go('app.iteration.cards', this.$state.params);
               }
            });
        }

    }
}