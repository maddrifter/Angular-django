/// <reference path='../_all.ts' />

module scrumdo {
    export class WorkflowManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX"
        ];

        public Workflow: ng.resource.IResourceClass<any>;
        public Step: ng.resource.IResourceClass<any>;

        constructor(
            public resource: ng.resource.IResourceService,
            public API_PREFIX) {
            this.Workflow = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/workflows/:id",
                {
                    id: '@id',
                    organizationSlug: 'organizationSlug',
                    projectSlug: 'projectSlug'
                },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "projectSlug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "projectSlug",
                            id: "@id"
                        }
                    }
                }
            );
            this.Step = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/workflows/:workflowId/steps/:id",
                {
                    id: '@id',
                    workflowId: 'workflowId',
                    organizationSlug: 'organizationSlug',
                    projectSlug: 'projectSlug'
                },
                {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "projectSlug",
                            workflowId: "workflowId"
                        }
                    },
                    save: {
                        method: 'PUT',
                        params: {
                            organizationSlug: 'organizationSlug',
                            projectSlug: "projectSlug",
                            workflowId: "workflowId",
                            id: "@id"
                        }
                    }
                }
            );

        }

        loadWorkflows(organizationSlug: string, projectSlug: string): ng.IPromise<any> {
            return this.Workflow.query({ organizationSlug: organizationSlug, projectSlug: projectSlug }).$promise;
        }

        saveWorkflow(workflow, organizationSlug: string, projectSlug: string) {
            return workflow.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }

        saveStep(step, organizationSlug: string, projectSlug: string, workflowId) {
            var sstep = new this.Step();
            _.extend(sstep, step);
            return sstep.$save({ organizationSlug: organizationSlug, projectSlug: projectSlug, workflowId: workflowId });
        }

        deleteWorkflow(workflow, organizationSlug: string, projectSlug: string) {
            return workflow.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }

        deleteStep(step, organizationSlug: string, projectSlug: string, workflowId) {
            var sstep = new this.Step();
            _.extend(sstep, step);
            return sstep.$delete({ organizationSlug: organizationSlug, projectSlug: projectSlug, workflowId: workflowId });
        }

        createWorkflow(properties, organizationSlug: string, projectSlug: string) {
            var workflow = new this.Workflow();
            _.extend(workflow, properties);
            return workflow.$create({ organizationSlug: organizationSlug, projectSlug: projectSlug });
        }

        createStep(properties, organizationSlug, projectSlug, workflowId) {
            var step = new this.Step();
            _.extend(step, properties);
            return step.$create({ organizationSlug: organizationSlug, projectSlug: projectSlug, workflowId: workflowId });
        }
    }
}