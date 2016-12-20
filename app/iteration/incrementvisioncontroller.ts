/// <reference path='../_all.ts' />

module scrumdo {

    interface VisionScope extends ng.IScope{
        increment: Iteration;
        project: Project;
    }

    export class IncrementVisionController {

        public static $inject:Array<string> = [
            '$scope',
            "organizationSlug",
            "projectSlug",
            "iterationManager"

        ];

        private isEditing:boolean;
        private copy:string;

        constructor(public $scope:VisionScope,
                    public organizationSlug:string,
                    public projectSlug: string,
                    public iterationManager: IterationManager) {
            this.isEditing = false;
            this.copy = angular.copy(this.$scope.increment.vision);
        }

        public editVision(){
            this.isEditing = true;
        }

        public cancel(){
            this.$scope.increment.vision = this.copy;
            this.isEditing = false;
        }

        public save(){
            this.iterationManager.saveIteration(this.organizationSlug, 
                                                this.projectSlug, 
                                                this.$scope.increment).then(() => {
                                                    this.isEditing = false;
                                                    this.copy = angular.copy(this.$scope.increment.vision);
            });
        }
    }
}