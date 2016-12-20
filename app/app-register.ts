/// <reference path='_all.ts' />

module scrumdo {

    export var setupRegisterApp = (staticUrl) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;
        trace("Setting up user register app ");

        app = angular.module("RegisterApp", [
            "scrumdoGenericDirectives",
            'scrumdoExceptions',
            'scrumdo-mixpanel',
            'scrumdoAlert'
        ]);
        
        app.config(['$compileProvider', ($compileProvider) => {
            $compileProvider.debugInfoEnabled(false);
        }]); 

        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.constant("sidebarMode", "");
        app.constant("organizationSlug", "");

        app.controller("RegisterViewController", RegisterViewController);

        return app;

    }

    export class RegisterViewController {
        public static $inject: Array<string> = [
            "$scope",
            "$timeout",
            "mixpanel"
        ];

        public orgName: string;
        public projectName: string;
        public addresses: Array<any>;
        public tempAddress: string;
        public distinct_id;
        public invitees;

        constructor(
            public scope,
            public timeout: ng.ITimeoutService,
            public mixpanel) {

            this.scope.ctrl = this;
            this.scope.currentStep = 0;
            this.orgName = '';
            this.projectName = '';
            this.addresses = [];
            this.tempAddress = '';
            this.mixpanel.track('Registration Wizard - Step 1');
            this.setDistinctId();
        }

        setDistinctId = () => {
            try {
                trace("Getting distinct ID");
                this.distinct_id = this.mixpanel.get_distinct_id();
            } catch (error) {
                // Sometimes, it's not ready right away.
                this.timeout(this.setDistinctId, 1000);
            }
        }

        onSubmit = () => {
            this.scope.currentStep = 3;
            this.mixpanel.track('Registration Wizard - Step 3');
            this.mixpanel.track('Registration Wizard - Complete');
        }

        step2() {
            if (!this.scope.setupForm.organization_name.$valid) {
                return;
            }
            this.scope.currentStep = 1;
            this.timeout(() => { $("#project_name").focus(); });
            this.mixpanel.track('Registration Wizard - Step 2');
        }

        step3() {
            if (!this.scope.setupForm.project_name.$valid) {
                return;
            }
            this.scope.currentStep = 2;
            this.timeout(() => { $("#invite_box").focus(); });
            this.mixpanel.track('Registration Wizard - Step 3');
        }

        removeAddress(index) {
            this.addresses.splice(index, 1);
            this.invitees = this.addresses.join("\n");
        }

        addAddress() {
            if (!this.scope.setupForm.address_to_add.$valid) {
                return;
            }
            this.addresses.push(this.tempAddress);
            this.tempAddress = '';
            this.timeout(() => { $("#invite_box").focus(); });
            this.invitees = this.addresses.join("\n");
        }
    }
}