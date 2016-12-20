/// <reference path='../_all.ts' />

module scrumdo {
    export class ExportDialogController {
        public static $inject: Array<string> = [
            "$scope",
            "project",
            "exportManager",
            "$interval",
            "exportType",
            "iterationId",
            "team"
        ];

        private STATE_INITIAL: number = 0;
        private STATE_WORKING: number = 1;
        private STATE_DOWNLOAD: number = 2;
        private STATE_ERROR: number = 3;
        private filename: string;
        private state: number;
        private jobInterval: ng.IPromise<any>;

        constructor(
            private scope,
            public project,
            private exportManager: ExportManager,
            public interval: ng.IIntervalService,
            private exportType: string,
            private iterationId,
            private team) {

            this.scope.ctrl = this;
            this.filename = createFilename(this.project.name);
            this.state = this.STATE_INITIAL;
            if(this.exportType === 'Team Planning'){
                this.filename = createFilename(this.team.project.name);
            }
        }

        export() {
            this.state = this.STATE_WORKING;
            if (this.exportType === 'Workspace') {
                this.exportManager.exportProject(this.project.slug, this.filename).then(this.exportSuccess, this.exportFailure);
            } else if(this.exportType === 'Team Planning'){
                this.exportManager.exportTeamPlanning(this.project.slug, 
                                                      this.iterationId, 
                                                      this.team.project.slug, 
                                                      this.filename).then(this.exportSuccess, this.exportFailure);
            } else {
                this.exportManager.exportIteration(this.project.slug, this.iterationId, this.filename).then(this.exportSuccess, this.exportFailure);
            }
        }

        exportSuccess = (response) => {
            var check = () => this.checkStatus(response.data.job_id);
            this.jobInterval = this.interval(check, 1500);
        }

        checkStatus(jobId) {
            this.exportManager.checkJob(jobId).then(this.onStatus, this.exportFailure);
        }

        onStatus = (response) => {
            if (response.data.completed) {
                this.fileAvailable(response.data.url);
            }
        }

        fileAvailable(url) {
            this.interval.cancel(this.jobInterval);
            this.scope.downloadURL = url;
            this.state = this.STATE_DOWNLOAD;
        }

        exportFailure = () => {
            this.state = this.STATE_ERROR;
        }
    }
}