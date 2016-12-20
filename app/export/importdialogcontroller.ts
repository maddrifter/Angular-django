/// <reference path='../_all.ts' />

module scrumdo {
    export class ImportDialogController {
        public static $inject: Array<string> = [
            "$scope",
            "project",
            "exportManager",
            "iterationId",
            "FileUploader",
            "$cookies"
        ];
        private STATE_INITIAL: number = 0;
        private STATE_WORKING: number = 1;
        private STATE_DOWNLOAD: number = 2;
        private STATE_ERROR: number = 3;
        private filename: string;
        private state: number;
        private exportType: string;
        private interval: ng.IIntervalService;
        private jobInterval: ng.IPromise<any>;

        constructor(
            private scope,
            private project,
            private exportManager: ExportManager,
            private iterationId,
            private FileUploader,
            private $cookies: ng.cookies.ICookiesService) {

            this.scope.ctrl = this;
            this.filename = createFilename(this.project.name);
            this.state = this.STATE_INITIAL;

            var url: string = "/projects/" + this.project.slug + "/iteration/" + this.iterationId + "/import";
            this.scope.uploader = new this.FileUploader({
                url: url,
                headers: {
                    'X-CSRFToken': $cookies.get('csrftoken')
                }
            });
            this.scope.uploader.autoUpload = true;
            this.scope.uploader.alias = 'import_file';
            this.scope.uploader.onCompleteAll = this.importComplete;
            this.scope.uploader.onAfterAddingFile = this.uploadStarted;
        }

        uploadStarted = () => {
            this.state = this.STATE_WORKING;
        }

        importComplete = () => {
            this.scope.$dismiss();
            window.location.reload();
        }

        export() {
            this.state = this.STATE_WORKING;
            if (this.exportType === 'Project') {
                this.exportManager.exportProject(this.project.slug, this.filename).then(this.exportSuccess, this.exportFailure);
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