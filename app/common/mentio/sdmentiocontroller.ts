/// <reference path='../../_all.ts' /> 

module scrumdo {
    export class sdMentioController {
        public static $inject: Array<string> = [
            "$scope",
            "organizationSlug",
            "projectManager",
            "mentioUtil"
        ];

        public projectSlug: string;
        public users: Array<any>;

        constructor(
            public scope,
            public organizationSlug: string,
            public projectManager: ProjectManager,
            public mentioUtil) {

            this.scope.$root.assignees = [];
            this.projectSlug = "";
            this.users = [];
            this.loadUsers();
        }

        init(element) {
            this.scope.ctrl = this;
        }

        loadUsers() {
            if (this.scope.$root.project_slug != null) {
                this.projectSlug = this.scope.$root.project_slug;
            } else if (this.scope.$root.project != null) {
                this.projectSlug = this.scope.$root.project.slug;
            } else {
                this.projectSlug = this.scope.project.slug;
            }

            if (this.scope.$root.assignees[this.projectSlug] == null) {
                var p = this.projectManager.loadProject(this.organizationSlug, this.projectSlug);
                p.then((result: any) => {
                    this.scope.$root.assignees[this.projectSlug] = result.members;
                });
                return p;
            }
        }

        searchUsers(term) {
            this.users = [];
            _.forEach(this.scope.$root.assignees[this.projectSlug], (item: any) => {
                if (item.username.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                    this.users.push(item);
                }
            });
        }

        getUserMentionText(item) {
            return '@' + item.username;
        }
    }
}