/// <reference path='../../_all.ts' />

module scrumdo {
    export class WorkflowStepEditController {

        public static $inject: Array<string> = [
            "$scope",
            "workflowManager",
            "projectSlug",
            "organizationSlug",
            "confirmService",
            "$timeout"
        ];

        public inputColor: string = "#000000";
        public saveQueue: Array<any> = [];
        protected lastTimeout: number;


        constructor(
            public scope,
            public workflowManager,
            public projectSlug,
            public organizationSlug,
            public confirmService,
            public timeout) {

            this.scope.wctrl = this;
            this.scope.$watch("step", this.onStepChange);
            this.scope.$watch("wctrl.inputColor", this.onColorChange);
            this.scope.$watch("step.report_color", this.onStepChange);
            this.scope.$watch("step.order", this.onOrderChange);
            this.onStepChange();
            this.saveQueue = [];
        }

        public onOrderChange = (oldval, newval) => {
            if (oldval === newval) {
                return;
            }
            return this.queueSaveStep(this.scope.step);
        }

        public queueSaveStep = (step) => {
            trace("Queued step save");
            this.timeout.cancel(this.lastTimeout);
            this.lastTimeout = this.timeout(this.saveNextStep, 1000);
            if (this.saveQueue.indexOf(step) >= 0) {
                return;
            }
            return this.saveQueue.push(step);
        }

        public saveNextStep = () => {
            var step;
            if (this.saveQueue.length === 0) {
                return;
            }
            step = this.saveQueue.pop();
            this.saveStep(step);
            return this.lastTimeout = this.timeout(this.saveNextStep, 1000);
        }

        public onColorChange = (newColor, oldColor) => {
            if (newColor === oldColor) {
                return;
            }
            this.scope.step.report_color = hexColorToInt(newColor);
            return this.saveStep(this.scope.step);
        }

        public onStepChange = () => {
            return this.inputColor = colorToHex(this.scope.step.report_color);
        }

        public saveStep = (step) => {
            return this.workflowManager.saveStep(step, this.organizationSlug, this.projectSlug, this.scope.ctrl.currentWorkflow.id).then;
        }

        public deleteStep = (step) => {
            var t;
            t = this;
            return this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this step?", "No", "Yes").then(() => t.deleteStepConfirmed(step));
        }

        public deleteStepConfirmed = (step) => {
            return this.workflowManager.deleteStep(step,
                this.organizationSlug,
                this.projectSlug,
                this.scope.ctrl.currentWorkflow.id).then(() => {
                    this.scope.ctrl.currentWorkflow.steps =
                        _.filter(this.scope.ctrl.currentWorkflow.steps, function(s: { id }) { return s.id !== step.id; })
                });
        }
    }
}