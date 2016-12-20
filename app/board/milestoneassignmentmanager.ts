/// <reference path='../_all.ts' />

module scrumdo {

    interface MilestoneAssignmentResponse {
        [index:number]:MilestoneAssignment;
    }

    export interface MilestoneAssignment extends ng.resource.IResource<MilestoneAssignment> {
        id: number;
        assigned_project:{
            name: string;
            slug: string;
        };
        milestone_id:number;
        milestone_project_slug:string;
        active:boolean;
        assigned_date:string;
        status:number;
        cards_total:number;
        cards_completed:number;
        cards_in_progress:number;
        points_total:number;
        points_completed:number;
        points_in_progres:number;

        $update(properties:Object):ng.IPromise<MilestoneAssignment>;
    }

    interface MilestoneAssignmentResource extends ng.resource.IResourceClass<MilestoneAssignment> {
        setAssignments(properties:Object, projectSlugs:Array<string>) : ng.resource.IResourceArray<MilestoneAssignment>;
    }


    export class MilestoneAssignmentManager {

        public static $inject:Array<string> = ["$resource", "API_PREFIX", "organizationSlug"];
        private api:MilestoneAssignmentResource;
        private assignments:{[milestoneId:number]: Array<MilestoneAssignment>} = {};

        constructor(private $resource:ng.resource.IResourceService,
                    private API_PREFIX:string,
                    private organization_slug:string) {

            var setAssignmentsAction : ng.resource.IActionDescriptor = {
                method: 'POST',
                isArray: true
            };



            this.api = <MilestoneAssignmentResource> $resource(API_PREFIX +
                "organizations/:organizationSlug/projects/:projectSlug/milestoneassignment/:milestoneId/",
                {organizationSlug:this.organization_slug},
                {setAssignments: setAssignmentsAction,
                 update:{method: 'PUT'}
                });
        }

        public update(assignment:MilestoneAssignment, projectSlug:string) : ng.IPromise<MilestoneAssignment> {
            return assignment.$update({milestoneId:assignment.id,
                                     organizationSlug:this.organization_slug,
                                     projectSlug:projectSlug
            });
        }

        public getCached(milestoneId:number):Array<MilestoneAssignment> {
            if(milestoneId in this.assignments) {
                return this.assignments[milestoneId];
            }
            return [];
        }

        public getAssignmentsForProject(projectSlug:string):ng.resource.IResourceArray<MilestoneAssignment> {
            return this.api.query({projectSlug:projectSlug});
        }

        private cacheAssignments(milestoneId:number, assignments:Array<MilestoneAssignment>) {
            if(milestoneId in this.assignments) {
                var existing:Array<MilestoneAssignment> = this.assignments[milestoneId];
                var args:Array<any> = [0, existing.length];
                Array.prototype.splice.apply(existing, args.concat(assignments));
            } else {
                this.assignments[milestoneId] = assignments;
            }
        }

        public getAssignments(projectSlug:string, milestoneId:number):ng.resource.IResourceArray<MilestoneAssignment> {
            if(milestoneId in this.assignments) {
                return this.assignments[milestoneId];
            } else {
                var rv:ng.resource.IResourceArray<MilestoneAssignment> = this.api.query({
                    projectSlug: projectSlug,
                    milestoneId: milestoneId
                });
                this.cacheAssignments(milestoneId, rv);
                return rv;
            }
        }

        public setAssignments(projectSlug:string, milestoneId:number, projectSlugs:Array<string>) : ng.resource.IResourceArray<MilestoneAssignment> {
            var rv:ng.resource.IResourceArray<MilestoneAssignment> = this.api.setAssignments({projectSlug:projectSlug, milestoneId:milestoneId}, projectSlugs);
            rv.$promise.then((assignments:Array<MilestoneAssignment>) => {
                this.cacheAssignments(milestoneId, assignments);
            });
            return rv
        }
    }
}