/// <reference path='../_all.ts' />

module scrumdo {
    import HotkeysProvider = angular.hotkeys.HotkeysProvider;
    export class KeyboardShortcutService {
        public static $inject:Array<string> = ["hotkeys", "storyEditor","confirmService"];

        constructor(public hotkeys:HotkeysProvider, public storyEditor) {

        }

        protected openCardByNumber(project):void {

            var cardNumber = parseInt(window.prompt("Open Card: Enter card number", ''))
            if( !isNaN(cardNumber) ) {
                this.storyEditor.editStoryByNumber(cardNumber, project)
            }
        }


        public setupCardShortcuts(scope:ng.IScope, project:Project, defaultCellId=null, defaultIterationId=null, canWrite:boolean = true) {
            var props = {relativeRank:0};

            if(defaultCellId != null){
                props['cell_id'] = defaultCellId;
            }

            if(defaultIterationId != null) {
                props["iteration_id"] = defaultIterationId;
            }

            //check if user have write access to the project
            if(canWrite){
            this.hotkeys.bindTo(scope)
                .add({
                        combo: "a",
                        description: "Add a Card",
                        callback: (event) => {
                            event.preventDefault()
                            this.storyEditor.createStory(project, props);
                      }
                });
            }
            this.hotkeys.bindTo(scope)
                .add({
                    combo: "o",
                    description: "Open a card",
                    callback: (event) => {
                        event.preventDefault()
                        this.openCardByNumber(project);
                }
            })
        }

        public removeShortcut(combo){
            this.hotkeys.del(combo);
        }
    }
}