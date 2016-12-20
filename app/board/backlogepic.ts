/// <reference path='../_all.ts' />

module scrumdo {
    export class BacklogEpic {
        public static $inject: Array<string> = [
            "$scope"
        ];
        
        public showStories:boolean;
        public collapsed:boolean;

        constructor(public scope) {
            this.scope.epicCtrl = this;
            this.showStories = true;
            this.collapsed = true;
        }
        
        toggleCollapsed(){
            this.collapsed = ! this.collapsed;
            this.scope.$emit('storiesChanged');
        }
        
        toggleShowStories(){
            this.scope.$emit('storiesChanged');
        }
    }
}