/// <reference path='../../_all.ts' />

var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module scrumdo {
    export class HeaderController {
        public static $inject: Array<string> = [
            "boardProject",
            "$scope",
            "$attrs",
            "$element"
        ];

        public headerId;
        public header;

        constructor(
            public boardProject,
            public scope,
            public attrs,
            public element: ng.IAugmentedJQuery) {
                
            // TODO: There is probably a better way to get the CELL here.
            var parent = this.element.parent();
            this.headerId = parseInt(parent.attr("data-header-id"));
            this.scope.header = this.header = this.boardProject.getHeader(this.headerId);
            if (this.scope.header === null) {
                return;
            }
            this.scope.labelColor = getLabelColor(this.header.backgroundColor);
            this.scope.ctrl = this;
            this.scope.policy = _.findWhere(this.scope.boardProject.policies, { id: this.scope.header.policy_id });
            
            // This is a hack to make it look right on browsers since IE can't handle 100% height here.
            parent.css("background-color", '#' + this.header.backgroundColorHex());
        }

        wipValue() {
            var policy = this.scope.policy;
            var stories = _.filter(this.boardProject.boardStories, (story:any) => {
                var ref;
                return ref = story.cell_id, indexOf.call(policy.cells, ref) >= 0;
            });
            if (parseInt(policy.policy_type) === 0) {
                return stories.length;
            } else {
                return Math.round(_.reduce(stories, ((memo, story: any) => memo + story.points_value), 0) * 100) / 100;
            }
        }

        width() {
            return this.header.ex - this.header.sx;
        }
        
        toolTip(){
            var v = this.wipValue();
            var type:string;
            parseInt(this.scope.policy.policy_type)===0? type="cards" : type="points"; 
            var toolTip:string = "<div class='wip-tooltip'>";
            
            if(this.scope.policy.min_related_value>0 && this.scope.policy.min_related_value != 999){
                    toolTip += "Minimum "+ type +": " + this.scope.policy.min_related_value + "<br/>";
            }
            toolTip += "Current "+ type +": " + this.wipValue() + "<br/>";
            if(this.scope.policy.related_value > 0 && this.scope.policy.related_value != 999){ 
                toolTip += "Maximum "+ type +": " + this.scope.policy.related_value + "<br/>";
            } 
            toolTip += "</div>";
            return toolTip;
        }
        
         public overWip() {
            return (this.wipValue() > this.scope.policy.related_value && this.scope.policy.min_related_value != 999) 
                && this.scope.policy.related_value > 0 ||
                (this.wipValue() < this.scope.policy.min_related_value && this.scope.policy.min_related_value != 999) 
                && this.scope.policy.min_related_value >0;
        }
    }
}