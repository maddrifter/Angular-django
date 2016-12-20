/// <reference path='../_all.ts' /> 

module scrumdo {
    export class SDAssigneeController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        private sortedPeople: Array<any>;
        private element: HTMLElement;
        private ngModel: ng.INgModelController;

        constructor(
            private scope) {

            this.scope.selectedPeople = [];
            if(this.scope.people != null){
                this.sortedPeople = this.scope.people.slice();
                this.createSortIndex();
            }
            this.scope.ctrl = this;
        }

        sortUsers() {
            this.sortedPeople.sort(this.userSortOrder);
        }

        createSortIndex() {
            _.forEach(this.sortedPeople, (user, i) => {
                var index: string = "";
                if (user.last_name !== "" && user.first_name !== "") {
                    index = user.last_name;
                }
                if (user.last_name === "" && user.first_name !== "") {
                    index = user.first_name;
                }
                if (user.first_name === "" && user.last_name === "") {
                    index = user.username;
                }
                this.sortedPeople[i].sindex = index;
            });
            this.sortUsers();
        }

        userSortOrder = (a, b) => {
            var x, y;
            if ((a.sindex == null) || (b.sindex == null)) {
                return 0;
            }
            x = a.sindex.toLowerCase();
            y = b.sindex.toLowerCase();
            if (x === y) {
                return 0;
            }
            if (x < y) {
                return -1;
            } else {
                return 1;
            }
        }

        compareUsers(user1, user2) {
            return (typeof user1 !== "undefined" && user1 !== null ? user1.username : void 0) === (typeof user2 !== "undefined" && user2 !== null ? user2.username : void 0);
        }

        init(element, ngModel) {
            this.element = element;
            this.ngModel = ngModel;
            var t = this;
            this.ngModel.$render = () => {
                t.scope.selectedPeople = ngModel.$modelValue;
            }
        }

        userLabel(user) {
            return shortuser(user);
        }

        deselectUser(user, $event) {
            $event.preventDefault();
            // We need an angular.equals because it might not be the same
            // object.
            var t = this;
            var firstMatch = _.find(this.scope.selectedPeople, (obj) => t.compareUsers(obj, user));
            var index = this.scope.selectedPeople.indexOf(firstMatch);
            this.scope.selectedPeople.splice(index, 1);
        }

        getLabel() {
            if (this.scope.label != null) {
                return this.scope.label;
            } else {
                return "Assignees";
            }
        }
    }
}