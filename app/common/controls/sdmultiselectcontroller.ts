/// <reference path='../../_all.ts' />

module scrumdo {
    export class SDMultiSelectController {
        public static $inject: Array<string> = [
            "$scope",
            "urlRewriter"
        ];

        public name: string;
        public menuOpen: boolean;
        public element: HTMLElement;
        public ngModel: ng.INgModelController;
        public labelProp;
        public templateName: string;
        public hasLabelFunction = null;
        public filterQuery: string;
        public showFilter: boolean = false;

        constructor(
            public scope,
            public urlRewriter: URLRewriter) {

            this.scope.ctrl = this;
            this.name = 'SDMultiSelectController';
            this.menuOpen = false;
            this.filterQuery = "";
            if (this.scope.showFilter != null) {
                this.showFilter = this.scope.showFilter;
            }
        }

        init(element, ngModel, labelProp, templateName, hasCustomCompare, hasLabelFunction) {
            this.hasLabelFunction = hasLabelFunction;
            this.element = element;
            this.ngModel = ngModel;
            this.labelProp = labelProp;
            this.templateName = this.urlRewriter.rewriteAppUrl(templateName);
            this.scope.currentValue = ngModel.$modelValue;
            if (!hasCustomCompare) {
                this.scope.compareFunction = function(hash) {
                    return angular.equals(hash.value1, hash.value2);
                };
            }
            var t = this;
            this.ngModel.$render = () => {
                t.scope.currentValue = ngModel.$modelValue;
            }
        }

        toggleMenu($event: MouseEvent) {
            $event.preventDefault();
            $event.stopPropagation();
            this.menuOpen = !this.menuOpen;
            trace("Menu open: " + this.menuOpen);
        }

        isSelected(obj) {
            if (this.scope.currentValue == null) {
                return false;
            }
            var ref = this.scope.currentValue;
            for (var i = 0, len = ref.length; i < len; i++) {
                var selected = ref[i];
                if (this.scope.compareFunction({
                    value1: obj,
                    value2: selected
                })) {
                    return true;
                }
            }
            return false;
        }

        getLabel(obj) {
            if (typeof obj === "undefined" || obj === null) {
                return "";
            }
            if (this.hasLabelFunction) {
                return this.scope.labelFunction({
                    obj: obj
                });
            }
            return obj[this.labelProp];
        }

        getMainLabel() {
            if ((this.scope.currentValue == null) || this.scope.currentValue.length === 0) {
                if (this.scope.defaultLabel) {
                    return this.scope.defaultLabel;
                } else {
                    return "None Selected";
                }
            }
            var labels = (function() {
                var i, len, ref, results;
                ref = this.scope.currentValue;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var o = ref[i];
                    results.push(this.getLabel(o));
                }
                return results;
            }).call(this);
            return labels.join(", ");
        }

        select($event, newValue) {
            $event.preventDefault();
            $event.stopPropagation();
            var t = this;
            if (this.isSelected(newValue)) {
                // We need an angular.equals because it might not be the same
                // object.
                var firstMatch = _.find(this.scope.currentValue, function(obj) {
                    return t.scope.compareFunction({
                        value1: obj,
                        value2: newValue
                    });
                });
                var index = this.scope.currentValue.indexOf(firstMatch);
                this.scope.currentValue.splice(index, 1);
            } else {
                this.scope.currentValue.push(newValue);
            }
            this.ngModel.$setViewValue(this.scope.currentValue);
        }

        doFilterQuery = (option) => {
            var key = this.scope.controlType;
            var v: string;
            if (this.filterQuery == "") return true;
            if (key == "assignee") {
                var u: string, f: string, l: string;
                u = "@"+option.username;
                f = option.first_name != null ? option.first_name : "";
                l = option.last_name != null ? option.last_name : "";
                v = u + " " + f + " " + l;
                return v.toLowerCase().indexOf(this.filterQuery.toLowerCase()) !== -1;
            }
            if (key == "labels") {
                v = option.name.toLowerCase();
                return v.indexOf(this.filterQuery.toLowerCase()) !== -1;
            }
            return true;
        }
    }

}