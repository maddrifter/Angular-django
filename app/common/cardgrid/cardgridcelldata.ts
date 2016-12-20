/// <reference path='../../_all.ts' />

/*
 This represents the cards that are listed within a single cell of the cardgrid.  To render those, we need to know

 1. The list of cards/stories
 2. The project for them
 3. A list of epics that they might go inside (TODO: Consider refactoring this into the sd-card directive)

 This class is a container for those pieces of information.

 */

module scrumdo {
    export class CardGridCellData {
        public cards:Array<Story> = [];
        public project:Project;
        public epics:Array<Epic> = [];

        public loading: boolean = true;
        public error:boolean = false;

        public loaded:ng.IPromise<any>;

        constructor(cards:ng.IPromise<Array<Story>>,
                    project:ng.IPromise<Project>,
                    epics:ng.IPromise<Array<Epic>>,
                    $q:ng.IQService) {

            this.loaded = $q.all([
                cards.then((cards) => this.cards = cards ),
                project.then((project) => this.project = project),
                epics.then((epics) => this.epics = epics)
            ])
            .catch(() => this.error = true)
            .then(() => this.loading = false)
        }
    }
}
