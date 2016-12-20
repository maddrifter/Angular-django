/// <reference path='../_all.ts' />

module scrumdo {
    export class FavoriteManager {
        public static $inject: Array<string> = [
            "$http",
            "projectManager",
            "organizationSlug",
            "API_PREFIX"
        ];

        constructor(
            private http: ng.IHttpService,
            private projectManager,
            public organizationSlug: string,
            public API_PREFIX: string) {

        }

        addProjectFavorite(project) {
            var p = this.http.post(this.API_PREFIX + "favorite/project/" + project.slug, {});
            p.success((fav) => {
                this.projectManager.loadProject(this.organizationSlug, project.slug);
            });

            return p;
        }

        removeProjectFavorite(project) {
            var p = this.http.delete(this.API_PREFIX + "favorite/project/" + project.slug);
            p.success((fav) => {
                this.projectManager.loadProject(this.organizationSlug, project.slug);
            });

            return p;
        }
    }
}   