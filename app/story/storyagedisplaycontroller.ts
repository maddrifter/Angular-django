/// <reference path='../_all.ts' />

module scrumdo {

    interface StoryAgeScope extends ng.IScope {
        story: Story;
        warning: number;
        critical: number;
        display: boolean;
    }

    export class StoryAgeDisplayController {
        public static $inject: Array<string> = ["$scope"];

        public tooltip: string = undefined;
        public days: Array<number> = undefined;
        public iterations: Array<number> = undefined;
        public age: number = undefined;

        constructor(public $scope: StoryAgeScope) {
            $scope.$on("resetAgingInfo", this.doCalculation);
            $scope.$on("storyModified", this.doCalculation);
            this.doCalculation(null, {id :-1 });
        }
        
        doCalculation = (event = null, story = null) => {
            if(story == null) return;
            if(story.id == -1 || story.id == this.$scope.story.id){
                let days: number = this.age = Math.round(this.$scope.story.age_hours / 24);
                this.tooltip = days + " days in progress.";

                if (days > 14 * 26) {
                    // For really really long timeframes, we stop displaying this.  Tooltip still works.
                    this.iterations = [];
                    this.days = [];

                } else {
                    let iterations: number = Math.floor(days / 14);
                    days -= iterations * 14;
                    try{
                        if(!isNaN(iterations)){
                            this.iterations = _.range(0, iterations);
                        }else{
                            this.iterations = [];
                        }
                        if(!isNaN(days)){
                            this.days = _.range(0, days);
                        }else{
                            this.days = [];
                        }
                    }catch(e){
                        trace('caught _.range error');
                    }
                }
            }
        }
        
        isDisplay():boolean {
            if(this.age === 0) return false;
            if(this.isCritical() || this.isWarning()) return true;
            return this.$scope.display; 
        }

        isWarning(): boolean {
            if (this.$scope.warning == null) return false;
            return this.age >= this.$scope.warning;
        }

        isCritical(): boolean {
            if (this.$scope.critical == null) return false;
            return this.age >= this.$scope.critical;
        }

        getClass(): string {
            if (this.isCritical()) return " aging-critical";
            if (this.isWarning()) return " aging-warning";
            return "";
        }
    }
}