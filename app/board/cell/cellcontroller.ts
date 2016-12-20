/// <reference path='../../_all.ts' />

module scrumdo {
    export class CellController {
        public static $inject = ["boardProject", "$scope", "$attrs", "$element", "storyEditor", "storyBulkOperations", "scrumdoTerms"];

        public cellId:number;
        public light:boolean;
        public cell:BoardCell;

        constructor(public boardProject, public scope, public attrs, public element, public storyEditor, public storyBulkOperations) {
            var parent;
            parent = this.element.parent();
            this.cellId = parseInt(parent.attr("data-cell-id"));
            this.scope.cell = this.cell = this.boardProject.getCell(this.cellId);
            this.scope.storyLayout = "normal";
            if (this.cell.layout === 2) {
                this.scope.storyLayout = "list";
            }
            if (this.cell.layout === 8) {
                this.scope.storyLayout = "tasks";
            }
            if (this.cell.layout === 9) {
                // showing normal view also for portfolio
                this.scope.storyLayout = "normal";
            }
            this.light = isLightColor(this.cell.headerColor);

            this.scope.labelColor = getLabelColor(this.cell.headerColor);
            this.scope.cellCtrl = this;
            this.scope.wipLimit = this.cell.wipLimit;
            this.element.parent().css("background-color", "#" + (this.cell.backgroundColorHex()));
        }

        public moveCards(event) {
            return this.scope.$emit("moveSelectedToCell", this.cell);
        }

        public addCard(event) {
            return this.storyEditor.createStory(this.boardProject.project, {
                relativeRank: 0,
                cell_id: this.cell.id,
                iteration_id: this.boardProject.iteration.id
            });
        }


        public archiveAll(event) {
            var default_iteration = _.findWhere(<Array<Iteration>>this.boardProject.iterations, { iteration_type: 2})
            this.storyBulkOperations.archiveAll(this.allStories(), default_iteration.id);
            return this.boardProject.uiState.archiveOpen = false;  // I was having a problem getting the archive to update, so I gave up.
        }

        public selectAll(event) {
            return this.scope.$broadcast("selectAll");
        }

        public allStories = () => {
            return _.filter(this.scope.boardStories, (card:Story) => {
                return (card.cell_id === this.cell.id);
            });
        }

        public selectNone(event) {
            return this.scope.$broadcast("selectNone");
        }

        public greyHeader = () => {
            // We're going to treat that default grey header special and show the right border all the
            // way through it.  Otherwise, the border stop just below it.
            return this.cell.headerColor === 16119285;
        }

        public sumPoints(n, story) {
            return n + story.points_value;
        }

        public pointsWipValue = () => {
            var stories;
            stories = _.where(this.scope.boardStories, {
                cell_id: this.cellId
            });
            return Math.round(_.reduce(stories, this.sumPoints, 0) * 100) / 100;
        }

        public wipValue = () => {
            return (_.where(this.scope.boardStories, {
                cell_id: this.cellId
            })).length;
        }

        public filterStory = (iterationId) => {
            return (story) => (this.cellId === story.cell_id) && (iterationId === story.iteration_id);
        }
        
        public overWip() {
            return (this.wipValue() > this.cell.wipLimit && this.cell.wipLimit!=999) && this.cell.wipLimit > 0 ||
                (this.wipValue() < this.cell.minWipLimit && this.cell.minWipLimit != 999) && this.cell.minWipLimit >0;
        }
        
        public overPointWip() {
            return (this.pointsWipValue() > this.cell.pointLimit && this.cell.pointLimit!=999) && this.cell.pointLimit > 0 ||
                (this.pointsWipValue() < this.cell.minPointLimit && this.cell.minPointLimit!=999) && this.cell.minPointLimit >0;
        }
        
        public cardToolTip(){
            var toolTip:string = "<div class='wip-tooltip'>";
            if(this.cell.minWipLimit>0 && this.cell.minWipLimit != 999){
                    toolTip += "Minimum cards: " + this.cell.minWipLimit + "<br/>";
            }
            toolTip += "Current cards: " + this.wipValue() + "<br/>";
            if(this.cell.wipLimit > 0 && this.cell.wipLimit != 999){ 
                toolTip += "Maximum cards: " + this.cell.wipLimit + "<br/>";
            } 
            toolTip += "</div>";
            return toolTip;
        }
        
        public pointToolTip(){
            var toolTip:string = "<div class='wip-tooltip'>";
            if(this.cell.minPointLimit>0 && this.cell.minPointLimit!=999){
                    toolTip += "Minimum points: " + this.cell.minPointLimit + "<br/>";
            }
            toolTip += "Current points: " + this.pointsWipValue() + "<br/>";
            if(this.cell.pointLimit > 0 && this.cell.pointLimit != 999){ 
                toolTip += "Maximum points: " + this.cell.pointLimit + "<br/>";
            } 
            toolTip += "</div>";
            return toolTip;
        }

        public policyTooltip(){
            if(!this.cell.policy_text) return;
            return this.cell.policy_text.replace(/\r?\n/g, '<br>');
        }
    }
}
