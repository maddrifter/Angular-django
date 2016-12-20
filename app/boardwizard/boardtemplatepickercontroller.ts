/// <reference path='../_all.ts' />

module scrumdo {
    export class BoardTemplatePickerController {
        public static $inject: Array<string> = [
            "$scope",
            "$http",
            "organizationSlug",
            "projectSlug",
            "API_PREFIX",
            "STATIC_URL",
            "projectManager",
            "mixpanel"
        ];

        private templatesLoaded: boolean;
        private projectsLoaded: boolean;
        private templates;

        constructor(
            private scope,
            public http: ng.IHttpService,
            private organizationSlug: string,
            private projectSlug: string,
            private API_PREFIX: string,
            private STATIC_URL: string,
            private projectManager,
            private mixpanel) {

            scope.STATIC_URL = STATIC_URL;
            http.get(API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/boardutil/templates/1").then(this.onTemplates);
        }

        setTemplate(templateSlug, existing) {
            var url: string = API_PREFIX + "organizations/" + this.organizationSlug + "/projects/" + this.projectSlug + "/boardutil/copy";
            this.http.post(url, { other_project: templateSlug }).then(this.onCopy);
            if (existing) {
                this.mixpanel.track("Copy Project");
            } else {
                this.mixpanel.track("Copy Template");
            }
        }

        onCopy = () => {
            window.location.reload();
        }

        onTemplates = (templates) => {
            templates.data = _.filter(templates.data, (d) => d['description'] != '');
            var sortedTemplates = _.sortBy(templates.data, (d) => d['category']);
            this.templates = this.categorize(sortedTemplates);
            this.projectManager.loadProjectsForOrganization(this.organizationSlug).then(this.onProjectsLoaded);
            this.templatesLoaded = true;
            return;
        }

        categorize(sortedTemplates) {
            var group = { name: '', templates: [] };
            var rv = [group];
            for (var i = 0, len = sortedTemplates.length; i < len; i++) {
                var template = sortedTemplates[i];
                if (template.category !== group.name) {
                    group = {
                        name: template.category,
                        templates: []
                    };
                    rv.push(group);
                }
                group.templates.push(template);
            }
        }
        
        onProjectsLoaded = (projects) => {
            this.projectsLoaded = true;
            this.scope.projects = this.categorize(_.sortBy(projects, (p) => p['category']));
        }
    }
}