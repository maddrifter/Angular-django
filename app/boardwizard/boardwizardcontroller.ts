/// <reference path='../_all.ts' />

module scrumdo {
    export class BoardWizardController {
        public static $inject: Array<string> = [
            "$scope",
            "$http",
            "organizationSlug",
            "projectSlug",
            "STATIC_URL",
            "mixpanel",
            "projectManager"
        ];

        private currentStep: number;
        private preset: number;
        private rowPreset: number;
        private colTypesVisible: boolean;
        private project;
        private steps: Array<any>;
        private rows: Array<any>;

        constructor(
            private scope,
            public http: ng.IHttpService,
            private organizationSlug: string,
            private projectSlug: string,
            private STATIC_URL: string,
            private mixpanel,
            private projectManager) {

            this.scope.STATIC_URL = STATIC_URL;
            this.currentStep = 0;
            this.preset = 0;
            this.rowPreset = 0;
            this.colTypesVisible = false;
            this.reset();

            this.scope.ctrl = this;
            this.scope.preset = 0;
            this.scope.colorPalette = SCRUMDO_COLOR_PALETTE;
            this.projectManager.loadProject(this.organizationSlug, this.projectSlug).then((project) => {
                this.project = project;
                this.reset();
            });
        }

        showExamples() {
            this.colTypesVisible = true;
        }

        reset() {
            this.currentStep = 0;
            this.preset = 0;
            this.rowPreset = 0;

            if ((this.project != null) && this.project.project_type === 2) {
                this.steps = [
                    { 'name': 'Todo', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                    { 'name': 'Developing', 'color': "#3898DB", 'style': 9, 'sub': ['Doing', 'Done'] },
                    { 'name': 'Done', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] },
                    { 'name': '', 'color': "#9A59B5", 'style': 0, 'sub': ['Doing', 'Done'] }
                ];
                this.rows = [
                    { name: '' }
                ];
            } else {
                this.steps = [
                    { 'name': 'Todo', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                    { 'name': 'Doing', 'color': "#3898DB", 'style': 0, 'sub': ['Doing', 'Done'] },
                    { 'name': 'Reviewing', 'color': "#F5764E", 'style': 0, 'sub': ['Doing', 'Done'] },
                    { 'name': 'Done', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] },
                    { 'name': '', 'color': "#9A59B5", 'style': 0, 'sub': ['Doing', 'Done'] }
                ];
                this.rows = [
                    { name: '' }
                ];
            }
        }

        stepPresetChanged() {
            var presets: Array<any>;
            if ((this.project != null) && this.project.project_type === 2) {
                presets = [
                    [
                        { 'name': 'Todo', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Doing', 'color': "#3898DB", 'style': 9, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Reviewing', 'color': "#F5764E", 'style': 9, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Done', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] }],
                    [
                        { 'name': 'Work Queue', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Analysis', 'color': "#3898DB", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Developing', 'color': "#F5764E", 'style': 9, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Deployed', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] }
                    ],
                    [
                        { 'name': 'Analysis', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Development', 'color': "#3898DB", 'style': 9, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Testing', 'color': "#F5764E", 'style': 9, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Deployed', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] }
                    ],
                ];
            } else {
                presets = [
                    [{ 'name': 'Todo', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Doing', 'color': "#3898DB", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Reviewing', 'color': "#F5764E", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Done', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] }
                    ],
                    [
                        { 'name': 'Work Queue', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Developing', 'color': "#3898DB", 'style': 1, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Testing', 'color': "#F5764E", 'style': 1, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Deployed', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] }
                    ],
                    [
                        { 'name': 'Analysis', 'color': "#747E89", 'style': 0, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Development', 'color': "#3898DB", 'style': 1, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Testing', 'color': "#F5764E", 'style': 1, 'sub': ['Doing', 'Done'] },
                        { 'name': 'Deployed', 'color': "#34CC73", 'style': 0, 'sub': ['Doing', 'Done'] }
                    ],

                ];
            }
            var selected: number = this.preset - 1;
            if (selected >= 0) {
                this.steps = presets[selected];
            }
            this.addRemoveInputs(false);
        }

        rowPresetChanged() {
            var selected: number = this.rowPreset - 1;
            var presets: Array<any> = [
                [{ 'name': '', 'default': true }],
                [{ 'name': 'Expedited', 'default': true }, { 'name': 'Standard', 'default': true }],
                [{ 'name': '', 'default': true }, { 'name': 'Blocked', 'default': true }],
                [{ 'name': 'Alpha Team', 'default': true }, { 'name': 'Beta Team', 'default': true }, { 'name': 'Gamma Team', 'default': true }]
            ];
            if (selected >= 0) {
                this.rows = presets[selected];
            }
            this.addRemoveRowInputs();
        }

        stepOne() {
            this.currentStep = 1;
            this.addRemoveInputs();
        }

        stepTwo() {
            this.steps = _.filter(this.steps, (val) => val.name != '');
            this.currentStep = 2;
        }

        stepThree() {
            this.currentStep = 3;
            if (this.rows === []) {
                this.rows = [
                    { 'name': 'Standard', 'default': true },
                    { 'name': '', 'default': false }
                ];
            }
        }

        buildBoard() {
            trace("Building board...");
            var data = {
                columns: this.steps,
                rows: this.rows
            };
            this.http.post("/api/v2/organizations/" + this.organizationSlug + "/projects/" + this.projectSlug + "/boardutil/wizard", data).success(
                this.onBuildBoard
            );
            this.mixpanel.track('Board Wizard', { columns: this.steps.length, rows: this.rows.length });
        }

        onBuildBoard = () => {
            window.location.reload();
        }

        addRemoveRowInputs() {
            if (this.rows[this.rows.length - 1].name !== '') {
                this.rows.push({ 'name': '', 'default': false });
            }
        }

        addRemoveInputs(flag:boolean = true) {
            if (this.steps[this.steps.length - 1].name !== '') {
                this.steps.push({
                    'name': '',
                    'color': "#747E89",
                    'style': 0,
                    'sub': ['Doing', 'Done']
                });
            }
            if(flag){
                this.preset = 0;
            }
        }
    }
}