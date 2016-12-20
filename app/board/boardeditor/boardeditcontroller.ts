/// <reference path='../../_all.ts' />

module scrumdo {

    var __indexOf = [].indexOf || function (item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item) return i;
            }
            return -1;
        };

    export class BoardEditController {
        public DEFAULT_HEADER_COLOR = 0xBBBBBB;

        public DEFAULT_BACKGROUND_COLOR = 0xFFFFFF;

        public static $inject:Array<string> = ["boardProject",
            "$scope",
            "boardCellManager",
            "boardHeadersManager",
            "policyManager",
            "workflowManager",
            "projectSlug",
            "organizationSlug",
            "confirmService",
            "initialBoardService",
            "mixpanel",
            "deleteCellConfirmService"];

        public selectedCells:Array<BoardCell|BoardHeader> = [];
        public cellSaveQueue:Array<BoardCell|BoardHeader>;
        public emptySteps:Array<any>;
        public currentWorkflow:any;
        public editorMode:boolean;
        public reportMode:boolean;
        public isDuplicating:boolean = false;
        public dragListeners:{orderChanged:Function};
        public validCellWipLimits:boolean = true;
        public validHeaderWipLimits:boolean = true;
        public  isProfileExist: boolean = false;
        private originalCell:BoardCell;
        private originalHeader:BoardHeader;
        private finishedSelecting:Function;

        constructor(public boardProject:BoardProject,
                    public scope,
                    public cellManager,
                    public headerManager,
                    public policyManager,
                    public workflowManager,
                    public projectSlug,
                    public organizationSlug,
                    public confirmService,
                    public initialBoardService,
                    public mixpanel,
                    public deleteCellConfirmService:DeleteCellConfirmService) {

            this.scope.ctrl = this;
            this.scope.helpClosed = false;
            this.selectedCells = [];
            this.cellSaveQueue = [];
            this.emptySteps = [];
            this.currentWorkflow = null;

            this.editorMode = true;
            this.reportMode = false;

            this.scope.$watch("editingHeader.input_header_color", this.onHeaderBGColorPicked);
            this.scope.$watch("editingCell.input_header_color", this.onHeaderColorPicked);
            this.scope.$watch("editingCell.input_background_color", this.onBackgroundColorPicked);
            this.scope.$on("createHeader", this.onCreateHeader);
            this.scope.$on("createCell", this.onCreateCell);
            this.scope.$on("duplicateTargeted", this.onDuplicateTargeted);

            this.scope.colorPalette = SCRUMDO_COLOR_PALETTE;
            this.stateChanged();
            //this.scope.$on("$stateChangeStart", this.onStateChange);
            this.dragListeners = {
                orderChanged: this.orderChanged
            };
        }



        public duplicate() {
            this.scope.$broadcast("beginDuplicate", this.selectedCells)
            this.isDuplicating = true;
        }



        public changeWorkflowName = () => {
            var prompt, title;
            if (this.currentWorkflow == null) {
                return;
            }
            return this.confirmService.prompt(title = "Change Report Profile Name", prompt = "Please enter a new name.").then((result) => {
                this.currentWorkflow.name = result;
                return this.workflowManager.saveWorkflow(this.currentWorkflow, this.organizationSlug, this.boardProject.projectSlug);
            });
        }

        public wizard = () => {
            return this.confirmService.confirm("Danger: Data Loss Possible", "Running the wizard will completely reset your board.  All reporting history will be lost.  Cards on your board will lose which cell they are in and be moved into your backlog.", "Cancel", "Reset Board and Run Wizard", "btn-danger").then(() => {
                this.initialBoardService.startInitializeWizard();
                return this.mixpanel.track("Reset Board");
            });
        }

        public orderChanged = (obj) => {
            var order;
            order = 1;
            return this.currentWorkflow.steps.map((step:{order:number, name:string}) => {
                if (step.order !== order) {
                    step.order = order;
                    trace(step.name + " order = " + order);
                }
                return order += 1;
            });
        }

        public stateChanged = () => {
            if (this.scope.settingsCtrl.state === "app.settings.reports") {
                this.editorMode = false;
                this.reportMode = true;
                this.setWorkflowMode();
            }
            if (this.scope.settingsCtrl.state.indexOf("settings") !== -1) {
                return this.mixpanel.track("View Board Settings", {
                    subpage: this.scope.settingsCtrl.state
                });
            }
        }

        public setWorkflowMode = () => {
            this.scope.drawingMode = false;
            return this.scope.$root.$broadcast("clearSelection");
        }

        public currentSteps = () => {
            if (this.scope.drawingMode) {
                return this.emptySteps;
            }
            if (!this.currentWorkflow) {
                return this.emptySteps;
            }
            return this.currentWorkflow.steps;
        }

        public setCellHeaderMode = () => {
            this.scope.drawingMode = true;
            return this.scope.$root.$broadcast("clearSelection");
        }

        public headerPolicy = (header) => {
            if (header == null) {
                return null;
            }
            if (header.policy_id == null) {
                return null;
            }
            return _.findWhere(this.scope.boardProject.policies, {
                id: header.policy_id
            });
        }

        public onBackgroundColorPicked = (newValue, oldValue) => {
            if (newValue == null) {
                return;
            }
            return this.scope.editingCell.backgroundColor = hexColorToInt(newValue);
        }

        public onHeaderBGColorPicked = (newValue, oldValue) => {
            if (newValue == null) {
                return;
            }
            return this.scope.editingHeader.background = hexColorToInt(newValue);
        }

        public onHeaderColorPicked = (newValue, oldValue) => {
            if (newValue == null) {
                return;
            }
            return this.scope.editingCell.headerColor = hexColorToInt(newValue);
        }

        public onSelectionChanged(added:Array<BoardHeader|BoardCell>,
                                  removed:Array<BoardHeader|BoardCell>,
                                  current:Array<BoardHeader|BoardCell>):void {
            trace("onSelectionChanged - removed: " + removed.length);
            removed.forEach(b => {
                if(b.dirty || b == this.originalCell || b == this.originalHeader) {
                    if(b.header) {
                        // It's a header, let's save it!
                        if(this.scope.editingHeader && this.scope.editingHeader.id == b.id) {
                            // Special case, the currently editing cell might have other properties changed
                            // that need to be copied in.
                            this.saveHeader();
                        } else {
                            // This wasn't the header in the left-hand edit box, so we can safely just save it.
                            this.headerManager.saveHeader(b, this.organizationSlug, this.projectSlug);
                        }
                    } else {
                        // It's a cell, let's save it!
                        if(this.scope.editingCell && this.scope.editingCell.id == b.id) {
                            // Special case, the currently editing cell might have other properties changed
                            // that need to be copied in.
                            this.saveCell()
                        } else {
                            // This wasn't the cell in the left-hand edit box, so we can safely just save it.
                            this.cellManager.saveCell(b, this.organizationSlug, this.projectSlug);
                        }
                    }
                }
            });

            this.scope.editingHeader = null;
            this.scope.editingCell = null;
            this.originalCell = null;
            this.originalHeader = null;
            if(current.length == 1) {
                // When we have a single header or cell selected, we show it in the left hand edit box.
                if(current[0].header) {
                    var header:BoardHeader = <BoardHeader>current[0];
                    this.originalHeader = header;
                    this.scope.editingHeader = angular.copy(header);

                    var policy = this.headerPolicy(header);
                    if (policy == null) {
                        this.scope.editingPolicy = {
                            name: "Header WIP",
                            cells: [],
                            user_defined: false,
                            policy_type: 0,
                            current_value: 0,
                            project_id: this.scope.project.id,
                            related_value: 0
                        };
                    } else {
                        this.scope.originalPolicy = policy;
                        this.scope.editingPolicy = angular.copy(policy);
                    }
                    this.scope.editingHeader.input_header_color = header.backgroundColorHex();
                } else {
                    var cell:BoardCell = <BoardCell>current[0];
                    this.scope.editingCell = angular.copy(cell);
                    this.originalCell = cell;
                    this.scope.editingCell.input_header_color = cell.headerColorHex();
                    this.scope.editingCell.input_background_color = cell.backgroundColorHex();
                }

            }
            // validate WIP limit on selection change
            this.validateWipLimit();
        }


        public doneSelecting = () => {
            this.finishedSelecting(this.selectedCells);
            this.scope.selectingCells = false;
            return this.selectedCells = [];
        }


        private getCellsByIds(ids:Array<number>):Array<BoardCell> {
            return this.scope.editingPolicy.cells.map( (cellId:number) => {
                return _.findWhere(this.boardProject.boardCells, {id:cellId});
            });
        }

        public selectHeaderCells = () => {
            this.scope.selectingCells = true;
            this.selectedCells = this.getCellsByIds(this.scope.editingPolicy.cells);

            return this.finishedSelecting = (selectedCells) => {
                this.scope.editingPolicy.cells = _.pluck(selectedCells, 'id')
            }
        }



        public onCreateHeader = (event, coords) => {
            var header;
            header = {
                label: "New Header",
                background: this.DEFAULT_HEADER_COLOR,
                sx: coords.sx * 25,
                ex: coords.ex * 25,
                sy: coords.sy * 25,
                ey: coords.ey * 25
            };

            return this.headerManager.createHeader(header, this.organizationSlug, this.projectSlug).then((header) => {
                this.scope.boardProject.boardHeaders.push(header);
                this.onSelectionChanged([header], this.selectedCells, [header]);
                this.selectedCells = [header];
            });
        }

        public onCreateCell = (event, coords) => {
            var properties;
            properties = {
                label: "New Cell",
                wipLimit: 0,
                pointLimit: 0,
                headerColor: this.DEFAULT_HEADER_COLOR,
                backgroundColor: this.DEFAULT_BACKGROUND_COLOR,
                width: coords.width * 25,  // 25 is a legacy measurement
                height: coords.height * 25,
                x: coords.sx * 25,
                y: coords.sy * 25
            };
            return this.cellManager.createCell(properties, this.organizationSlug, this.projectSlug).then((cell) => {
                this.scope.boardProject.boardCells.push(cell);

                this.onSelectionChanged([cell], this.selectedCells, [cell]);

                this.selectedCells.splice(0, this.selectedCells.length);
                this.selectedCells.push(cell);
                return this.mixpanel.track("Create Cell");
            });
        }

        protected duplicateHeader(header:BoardHeader, offset:Point):void {
            var clone:any = {sx:0, ex:0, sy:0, ey:0};
            angular.copy(header, clone);

            delete clone.id;
            clone.sx += offset.x * GRID_CONSTANTS.fullsize;
            clone.ex += offset.x * GRID_CONSTANTS.fullsize;
            clone.sy += offset.y * GRID_CONSTANTS.fullsize;
            clone.ey += offset.y * GRID_CONSTANTS.fullsize;


            this.headerManager.createHeader(clone, this.organizationSlug, this.projectSlug).then((added:BoardHeader)=>{
                trace("Cloned header");
                this.boardProject.boardHeaders.push(added);
            });

        }

        protected duplicateCell(cell:BoardCell, offset:Point):void {
            var clone:any = {sx:0, ex:0, sy:0, ey:0};
            angular.copy(cell, clone);

            delete clone.id;
            clone.x += offset.x * GRID_CONSTANTS.fullsize;
            clone.y += offset.y * GRID_CONSTANTS.fullsize;


            this.cellManager.createCell(clone, this.organizationSlug, this.projectSlug).then((added:BoardCell)=>{
                trace("Cloned CEll");
                this.boardProject.boardCells.push(added);
            });
        }

        protected onDuplicateTargeted = ($event, offset, cells) => {
            cells.forEach((bh:BoardHeader|BoardCell) => {
                if(bh.header) {
                    this.duplicateHeader(<BoardHeader>bh, offset);
                } else {
                    this.duplicateCell(<BoardCell>bh, offset);
                }


            });
            this.selectNone();
        }

        public selectNone() {
            this.scope.$broadcast("cancelDuplicate");
            this.onSelectionChanged([], this.selectedCells, []);
            this.selectedCells.splice(0, this.selectedCells.length);
        }

        public deleteHeader = () => {
            return this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this header?", "No", "Yes").then(this.onDeleteHeaderConfirm);
        }

        public onDeleteHeaderConfirm = () => {
            var ind;
            angular.copy(this.scope.editingHeader, this.originalHeader);
            ind = this.boardProject.boardHeaders.indexOf(this.originalHeader);
            this.boardProject.boardHeaders.splice(ind, 1);
            this.headerManager.deleteHeader(this.originalHeader, this.organizationSlug, this.projectSlug);
            this.scope.editingHeader = this.originalHeader = null;
            return this.scope.$root.$broadcast("clearSelection");
        }

        public onDelete = () => {
            this.deleteCellConfirmService.confirm(this.selectedCells).then(this.onDeleteConfirm);
        }

        public onMultiDelete() {
            this.deleteCellConfirmService.confirm(this.selectedCells).then(this.onMultiDeleteConfirm);
        }

        protected onMultiDeleteConfirm =(targetCells:Array<BoardCell>) => {
            var targetId = null;

            if(targetCells.length > 0) {
                targetId = targetCells[0].id;
            }

            this.selectedCells.forEach( (hc:BoardHeader|BoardCell) => {
                if(hc.header) {
                    this.headerManager.deleteHeader(hc, this.organizationSlug, this.projectSlug).then(()=>{
                        var ind = this.boardProject.boardHeaders.indexOf(<BoardHeader>hc);
                        this.boardProject.boardHeaders.splice(ind, 1);
                    });
                } else {
                    this.cellManager.deleteCell(hc, this.organizationSlug, this.projectSlug, targetId).then(()=>{
                        var ind = this.boardProject.boardCells.indexOf(<BoardCell>hc);
                        this.boardProject.boardCells.splice(ind, 1);
                    })
                }
            });

            this.selectedCells = [];
        }

        public onDeleteConfirm = (targetCells:Array<BoardCell>) => {
            var ind;
            angular.copy(this.scope.editingCell, this.originalCell);
            ind = this.boardProject.boardCells.indexOf(this.originalCell);
            this.boardProject.boardCells.splice(ind, 1);
            if(targetCells.length > 0) {
                this.cellManager.deleteCell(this.originalCell, this.organizationSlug, this.projectSlug, targetCells[0].id);
            } else {
                this.cellManager.deleteCell(this.originalCell, this.organizationSlug, this.projectSlug);
            }
            this.scope.editingCell = this.originalCell = null;
            return this.scope.$root.$broadcast("clearSelection");
        }

        public onSave = () => {
            trace("onSave " + this.selectedCells.length)

            if (this.scope.editingCell != null) {
                this.saveCell();
                this.scope.editingCell = null;
            }
            if (this.scope.editingHeader != null) {
                this.saveHeader();
                return this.scope.editingHeader = null;
            }
        }

        public saveHeader = () => {
            var ex, ey, sx, sy, t;
            sx = this.originalHeader.sx;
            sy = this.originalHeader.sy;
            ex = this.originalHeader.ex;
            ey = this.originalHeader.ey;

            angular.copy(this.scope.editingHeader, this.originalHeader);

            this.originalHeader.sx = sx;
            this.originalHeader.sy = sy;
            this.originalHeader.ex = ex;
            this.originalHeader.ey = ey;
            t = this;
            if (this.scope.editingPolicy.cells.length > 0) {
                if (this.scope.editingPolicy.id == null) {
                    // Need to create the new policy before we save the header
                    this.policyManager.createPolicy(this.scope.editingPolicy,
                                                    this.organizationSlug,
                                                    this.projectSlug).then((policy) => {
                        trace("Created policy " + policy.id + ", saving header.");
                        t.originalHeader.policy_id = policy.id;
                        t.headerManager.saveHeader(t.originalHeader, t.organizationSlug, t.projectSlug);
                        t.scope.editingPolicy = t.scope.editingHeader = t.originalHeader = null;
                        return t.scope.boardProject.policies.push(policy);
                    });
                } else {
                    // Can just save both records at once
                    angular.copy(this.scope.editingPolicy, this.scope.originalPolicy);
                    this.policyManager.savePolicy(this.scope.originalPolicy, this.organizationSlug, this.projectSlug);
                    this.headerManager.saveHeader(this.originalHeader, this.organizationSlug, this.projectSlug);
                    this.scope.editingPolicy = this.scope.editingHeader = this.originalHeader = null;
                }
            } else {
                // No policy to worry about, so only save the header.
                this.originalHeader.policy_id = null;
                this.headerManager.saveHeader(this.originalHeader, this.organizationSlug, this.projectSlug);
                this.scope.editingPolicy = this.scope.editingHeader = this.originalHeader = null;
            }
        }

        public closeWorkflowHelp = () => {
            this.scope.helpClosed = true;
            this.currentWorkflow = _.findWhere(this.boardProject.workflows, { flow_type: 0 })
            this.checkCurrectWorkflow();      
        }
        public checkCurrectWorkflow = () => {
            if (angular.isUndefined(this.currentWorkflow)) {
                this.currentWorkflow = null;
                this.isProfileExist = false;
            }
            else {
                this.isProfileExist = true;
            } 
        }
        public saveCell = () => {
            // x,y,width,height aren't changed by the dialog, but are changed by the board movements.
            var height, width, x, y;
            x = this.originalCell.x;
            width = this.originalCell.width;
            y = this.originalCell.y;
            height = this.originalCell.height;

            angular.copy(this.scope.editingCell, this.originalCell);

            if (this.originalCell.wipLimit == "" || (this.originalCell.wipLimit == null)) {
                this.originalCell.wipLimit = 0;
            }
            if (this.originalCell.pointLimit == "" || (this.originalCell.pointLimit == null)) {
                this.originalCell.pointLimit = 0;
            }

            this.originalCell.x = x;
            this.originalCell.width = width;
            this.originalCell.y = y;
            this.originalCell.height = height;

            this.cellManager.saveCell(this.originalCell, this.organizationSlug, this.projectSlug);

            this.scope.editingCell = this.originalCell = null;
        }

        public editingSomething = () => {
            return (this.selectedCells.length > 0) || (this.originalCell != null) || (this.originalHeader != null);
        }

        public pickCellsForStep = (step) => {
            var _ref, _ref1;
            this.scope.selectingCells = true;
            this.selectedCells = this.boardProject.boardCells.filter( (cell) => cell.steps.indexOf(step.id) >= 0 )


            this.finishedSelecting = (selectedCells) => {
                var i:number;

                this.boardProject.boardCells.forEach((cell:BoardCell) => {
                    i = cell.steps.indexOf(step.id);
                    if (selectedCells.indexOf(cell) >= 0) {
                        // Make sure it's in there
                        if (i === -1) {
                            cell.dirty = true;
                            cell.steps.push(step.id);
                            this.cellSaveQueue.push(cell);
                        }
                    } else {
                        // Make sure it's not in there
                        if (i !== -1) {
                            cell.dirty = true;
                            cell.steps.splice(i, 1);
                            this.cellSaveQueue.push(cell);
                        }
                    }
                });
                this.saveNextCell();
                if (step.name === "New Step" && selectedCells.length > 0) {
                    // Automatically set up the name & color if it's a brand new step.
                    var cell:any = _.findWhere(this.boardProject.boardCells, {
                        id: selectedCells[0].id
                    });
                    step.name = cell.label;
                    step.report_color = cell.headerColor;
                    this.workflowManager.saveStep(step, this.organizationSlug, this.projectSlug, this.currentWorkflow.id);
                }

                this.finishedSelecting = null;
            };
        }

        protected _saveCells(cells:Array<BoardCell|BoardHeader>) {
            if(this.cellSaveQueue == null) {this.cellSaveQueue = [];}
            this.cellSaveQueue = this.cellSaveQueue.concat(cells);
            this.saveNextCell();
        }

        public saveNextCell = ():void => {
            var cell:BoardCell|BoardHeader;
            if (this.cellSaveQueue.length === 0) {
                return;
            }

            cell = this.cellSaveQueue.shift();
            if(cell.dirty) {
                if (cell.hasOwnProperty('time_type')) {
                    this.cellManager.saveCell(cell, this.organizationSlug, this.projectSlug).then(this.saveNextCell);
                } else {
                    // really a header...
                    this.headerManager.saveHeader(cell, this.organizationSlug, this.projectSlug).then(this.saveNextCell);
                }
            } else {
                this.saveNextCell();
            }
        }

        public addWorkflowStep = () => {
            var nextOrder, properties, t;
            if (this.currentWorkflow == null) {
                return;
            }

            if (_.isEmpty(this.currentWorkflow.steps)) {
                nextOrder = 50;
            } else {
                nextOrder = _.max(_.pluck(this.currentWorkflow.steps, "order")) + 10;
            }

            properties = {
                workflow_id: this.currentWorkflow.id,
                name: "New Step",
                report_color: 12303291,
                order: nextOrder
            };
            t = this;
            return this.workflowManager
                .createStep(properties, this.organizationSlug, this.projectSlug, this.currentWorkflow.id)
                .then( (newStep) => {
                    t.currentWorkflow.steps.push(newStep);
                    return this.mixpanel.track("Create Report Profile Step");
                });
        }

        public deleteWorkflow = (workflow) => {
            return this.confirmService.confirm("Are you sure?", "Are you sure you want to delete the workflow '" + workflow.name + "' ?", "No", "Yes").then(() => {
                this.confirmDeleteWorkflow(workflow);
                return this.mixpanel.track("Delete Report Profile");
            });
        }

        public confirmDeleteWorkflow = (workflow) => {
            var t;
            t = this;
            return this.workflowManager.deleteWorkflow(workflow, this.organizationSlug, this.projectSlug).then(() => {
                var i;
                i = t.boardProject.workflows.indexOf(workflow);
                t.boardProject.workflows.splice(i, 1);
                if (t.boardProject.workflows.length > 0) {
                    t.currentWorkflow = _.findWhere(this.boardProject.workflows, { flow_type: 0 })
                    this.checkCurrectWorkflow();               
                } else {         
                    t.currentWorkflow = null;
                    this.isProfileExist = false;
                }
            });
        }

        public newWorkflow = () => {
            var prompt, title;
            return this.confirmService.prompt(title = "New Report Profile", prompt = "Please enter a name.").then((result) => this.workflowManager.createWorkflow({
                name: result
            }, this.organizationSlug, this.projectSlug).then((workflow) => {
                this.boardProject.workflows.push(workflow);
                this.currentWorkflow = workflow;
                if (this.boardProject.workflows.length>0) {
                    this.isProfileExist = true;
                }
                return this.mixpanel.track("Create Report Profile");
            }));
        }
        
        public validateWipLimit = () => {
            if (this.scope.editingCell != null) {
                this.validCellWipLimits = true;
                var editingCell = this.scope.editingCell;
                if((editingCell.minWipLimit > editingCell.wipLimit && (editingCell.minWipLimit > 0 && editingCell.wipLimit >0)) ||
                    (editingCell.minPointLimit > editingCell.pointLimit && (editingCell.minPointLimit != 0 && (editingCell.pointLimit >0)))){
                        this.validCellWipLimits = false;
                    }
            }
            if (this.scope.editingHeader != null) {
                this.validHeaderWipLimits = true;
                if(this.scope.editingPolicy.min_related_value > this.scope.editingPolicy.related_value &&
                    (this.scope.editingPolicy.min_related_value > 0 && this.scope.editingPolicy.related_value >0)){
                    this.validHeaderWipLimits = false;
                }
            }
        }
    }
}