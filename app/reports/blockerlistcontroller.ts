/// <reference path='../_all.ts' />

module scrumdo{

    export class BlockersListController{
        public static $inject:Array<string> = ["$scope"];

        private currentPage:number = 0;
        private entryLimit:number = 0;
        private totalItems:number = 0;
        private blockersStatus:string = 'all';
        private blockersData:Array<any> = null;

        constructor(public scope){
            this.currentPage = 1;
            this.entryLimit = 15;
            scope.$watch("reportData", this.loadData);
        }

        showCurrentPage = () => {
            
        }
        loadData = () => {
            if(this.scope.reportData == null ) return;
            this.blockersData = this.scope.reportData.data;
            this.totalItems =  this.blockersData.length;
        }

        filterBlockers = (blocker) => {
            if( this.blockersStatus == 'all' ){
                return true;
            }else{
                return this.blockersStatus == 'open' ? !blocker.resolved : blocker.resolved;
            }
        }

        updateData = () => {
            this.currentPage = 1;
            this.blockersData = _.filter(this.scope.reportData.data , (d:any) => {
                if(this.blockersStatus == 'all' ) return true;
                return this.blockersStatus == 'open' ? !d.resolved : d.resolved; 
            });
            this.totalItems = this.blockersData.length;
        }
    }
}