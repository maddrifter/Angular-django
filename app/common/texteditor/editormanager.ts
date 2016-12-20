/// <reference path='../../_all.ts' />

module scrumdo {

    export class EditorManager {
        // For the clickable editors, we only want one in edit-mode at a time.
        // This manager will keep track of which one that is and set the old ones read-only.

        // Also, we want to be able to tab from clickable editor to clickable editor.
        // We do this by registering each editor with a number.  If one editor loses
        // focus we check if n+1 editor exists.  If so, we set it's focus.

        // To manage different tab orderings and make sure we don't tab stupidly,
        // we'll use different ranges:
        // 0-999 = Anything on the page itself (not a popup/control)
        // 1000 = story edit window
        // 2000 = story add control


        public editors:any;
        public currentEditor:EditorController;

        constructor(public timeout) {
            this.editors = {};
        }

        public registerEditor = (editor) => {
            trace("Register editor " + editor);
            return this.editors[editor.number] = editor;
        }

        public editByNumber = (number) => {
            return this.timeout(() => this.editors[number].edit());
        }

        public onEdit = (editor:EditorController) => {
            if (editor === this.currentEditor) {
                return;
            }
            //if (this.currentEditor != null) {
            //    this.disconnectListener();
            //}

            this.currentEditor = editor;
            return this.timeout(() => {
                this.currentEditor.focus();
            });
        }

        public onKey = (event) => {
            var next;
            if ((this.currentEditor != null) && event.keyCode === 9) {
                if (event.shiftKey) {
                    next = this.currentEditor.number - 1;
                } else {
                    next = this.currentEditor.number + 1;
                }
                if (next in this.editors) {
                    event.stopPropagation();
                    event.preventDefault();
                    return this.editors[next].edit();
                }
            }
        }

    }
}