/// <reference path='../_all.ts' />

module scrumdo {
    export class BetaOptions {
        public static $inject:Array<string> = ["$localStorage"];

        constructor(protected localStorage) {
            if(!localStorage.betaOptions) {
                localStorage.betaOptions = {
                    textEditor: 'tinymce',
                    animations: true,
                    dashboard: 'dashboard',
                    dropbox: 'enabled',
                    portfolio: 'disabled'
                }
            }
        }

        public dropBox():boolean {
            return this.localStorage.betaOptions.dropbox != 'disabled';
        }

        public getPortfolio():boolean {
            return this.localStorage.betaOptions.portfolio == 'enabled';
        }

        public getTextEditor():string {
            return this.localStorage.betaOptions.textEditor;
        }

        public getAnimations():string {
            return this.localStorage.betaOptions.animations;
        }
        
        public getDashboard():string {
            return this.localStorage.betaOptions.dashboard;
        }


    }
}