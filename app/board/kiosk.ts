/// <reference path='../_all.ts' />

module scrumdo {
    export class Kiosk {
        public enabled: boolean = false;

        toggle() {
            this.enabled = !this.enabled;
            if (this.enabled) {
                this.goFullscreen();
            } else {
                this.goWindowed();
            }
        }

        goFullscreen() {
            var elem, error;
            try {
                elem = $("body")[0];
                if (elem.requestFullscreen != null) {
                    elem.requestFullscreen();
                } else if (elem.msRequestFullscreen != null) {
                    elem.msRequestFullscreen();
                } else if (elem.mozRequestFullScreen != null) {
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen != null) {
                    elem.webkitRequestFullscreen();
                }
            } catch (error) {
                trace("Could not go fullscreen.");
            }
        }

        goWindowed() {
            var doc: any = window.document; // ts cmpiler had problem with some definitions of cancelFullScreen
            var requestMethod = doc.cancelFullScreen
                || doc.webkitCancelFullScreen
                || doc.mozCancelFullScreen
                || doc.exitFullscreen;

            if (typeof requestMethod !== "undefined" && requestMethod !== null) {
                requestMethod.call(document);
            }
        }
    }
}