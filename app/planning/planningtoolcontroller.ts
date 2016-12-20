/// <reference path='../_all.ts' />

module scrumdo{
    export class PlanningToolController{
        public static $inject: Array<string> = [
            "$rootScope",
            "$state"
        ];
        
        constructor(public rootScope, public state){
            rootScope.projectPlanningTool = true;
        }
    }
}