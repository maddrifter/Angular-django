/// <reference path='../_all.ts' />

module scrumdo {
    export class IterationSummaryController {

        public static $inject:Array<string> = ["$scope",
            "iterationManager",
            "organizationSlug",
            "reportManager",
            "boardCellManager",
            "boardHeadersManager"];

        public stats:any;
        public iteration:Iteration;
        public cfdData:any;
        public cellCounts:Array<any>;

        public boardCells:Array<BoardCell>;
        public boardHeaders:Array<BoardHeader>;

        public gridHeight:number = null;
        public loading:boolean = true;

        public hover = {};

        constructor(private $scope,
                    private iterationManager,
                    organizationSlug:string,
                    reportManager,
                    boardCellManager,
                    boardHeadersManager) {
            var project:Project = $scope.project;
            var iterationId:number = $scope.iterationId;


            boardCellManager.loadCells(organizationSlug, $scope.project.slug).then((cells)=>{
                this.boardCells = cells;
                this.loading = (this.boardCells==null) || (this.boardHeaders==null);

                var maxGrid = _.max(cells, function(cell:any){ return cell.gridey();} ).gridey();
                this.gridHeight =  (maxGrid + 1) * 7 + 1;

                //trace(`Grid height ${this.gridHeight}`);

            });

            boardHeadersManager.loadHeaders(organizationSlug, $scope.project.slug).then((headers)=>{
                this.boardHeaders = headers;
                this.loading = (this.boardCells==null) || (this.boardHeaders==null);
            });


            if(!$scope.iteration && $scope.iterationId) {
                this.iteration = iterationManager.loadIteration(organizationSlug, $scope.project.slug, $scope.iterationId);
            } else {
                iterationId = $scope.iteration.id;
                this.iteration = $scope.iteration;
            }

            this.cellCounts = boardCellManager.cellCounts(organizationSlug, project.slug, iterationId);

            iterationManager.loadStatsForIteration(organizationSlug, project.slug, iterationId).then((r) => {
               this.stats = r;
            });

            var reportOptions = {
                cfd_show_backlog: false,
                detail: false,
                enddate: moment().format("YYYY-MM-DD"),
                startdate: moment().subtract(1, 'months').format("YYYY-MM-DD"),
                interval: -1,
                iteration: this.iteration.id
            }

            reportManager.loadCFD(organizationSlug, project.slug, -1, reportOptions).then( (result) => {
                this.cfdData = result.data.data;
            });

        }
    }
}
