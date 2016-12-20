/// <reference path='../_all.ts' />

module scrumdo {

    export interface ClassicProject extends ng.resource.IResource<ClassicProject>  {
        category:string;
        name:string;
        personal:string;
        id:number;
        project_type:number;
        active:boolean;
        slug:string;
    }

    interface ClassicProjectResource extends ng.resource.IResourceClass<ClassicProject> {
        //setAssignments(properties:Object, projectSlugs:Array<string>) : ng.resource.IResourceArray<MilestoneAssignment>;
    }

    export interface Label extends ng.resource.IResource<Label> {
        color: number;
        id: number;
        name: string;
    }
    
    export interface Tag extends ng.resource.IResource<Tag>{
        id: number;
        name: string;
    }

    interface LabelResource extends ng.resource.IResourceClass<Label> {

    }
    
    interface TagResource extends ng.resource.IResourceClass<Label> {

    }

    export interface MiniParentProject {
        color: number;
        id: number;
        icon: string;
        slug: string;
        name: string;
        work_item_name?: string;
        portfolio_level_id?: string;
    }

    export interface MiniRelease {
        iteration_id:number;
        number:number;
        id:number;
        project_slug:string;
        summary:string;
        project_prefix:string;
    }

    export interface User {
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        id: number;
    }
    
    export interface PointScale{
        id: number;
        value: Array<[string, string]>;
        scale_value: Array<[string, string]>;
        project: Project;
        user: User,
        editMode:boolean;
    }

    export interface IProject {
        slug: string;
        name: string;
        id: number;
        project_type: number;
        parent_id:number;
        watched: boolean;
        category: string;
        prefix: string;
        statuses:Array<string>;
        task_statuses:Array<string>;

        risk_types:Array<string>;


        stats:{
            stories_in_progress:number,
            daily_lead_time:number,
            stories_completed:number,
            cards_claimed:number,
            points_claimed:number,
            story_count:number,
            system_flow_efficiency:number,
            daily_flow_efficiency: number,
            system_lead_time: number
        };

        render_mode:number;

        personal:boolean;

        extra_1_label: string;
        extra_2_label: string;
        extra_3_label: string;

        parents:Array<MiniParentProject>;

        milestone_counts: {active:number, inactive:number};
        labels:Array<Label>;

        description: string;
        releases: Array<MiniRelease>;
        tags:Array<{name:string}>;
        story_queue_count: number;
        card_types: Array<string>;
        default_cell_id: number;
        members: Array<User>;

        active: boolean;
        iterations_left: number;

        point_scale: Array<Array<string>>;
        point_scale_type: number;

        created: string;
        url: string;
        velocity_type: number;
        burnup_reset_date: string;
        burnup_reset: number;
        creator_id: number;
        velocity: number;
        kanban_iterations: {
            archive: number,
            backlog: number
        }

        work_item_name:string;

        use_time_crit: boolean;
        use_risk_reduction: boolean;
        use_points: boolean;
        use_time_estimate: boolean;
        use_due_date: boolean;
        business_value_mode: number;
        portfolio_level_id:number;
        portfolio_id?:number;
        portfolio_slug?:string;
        tab_summary:boolean;
        tab_board:boolean;
        tab_teamplanning:boolean;
        tab_dependencies:boolean;
        tab_chat:boolean;
        tab_planning:boolean;
        tab_milestones:boolean;
        tab_timeline:boolean;
        children_count: number;
    }

    export interface Project extends IProject, ng.resource.IResource<Project> {
        sortKey?:string;  // We use this dynamic property in the project tree.
        $save();
        $create(options):ng.IPromise<any>;
    }


    interface ProjectResource extends ng.resource.IResourceClass<Project> {
        //setAssignments(properties:Object, projectSlugs:Array<string>) : ng.resource.IResourceArray<MilestoneAssignment>;
        loadStats:any;
    }

    interface PointScaleResource extends ng.resource.IResourceClass<any> {

    }

    export class ProjectManager {
        public static $inject:Array<string> = ["$resource", "API_PREFIX", "$q", "organizationSlug", "scrumdoTerms"];

        // Projects by slug
        public projects:{ [id: string] : Project } = {};
        public projectListByOrg = {};

        private projectApi:ProjectResource;
        private classicProjectApi:ClassicProjectResource;
        private labelApi:LabelResource;
        private pointScaleApi:PointScaleResource;
        private tagApi:TagResource;

        constructor(public resource:ng.resource.IResourceService,
                    public API_PREFIX:string,
                    public $q:ng.IQService,
                    public organizationSlug:string,
                    public scrumdoTerms:ScrumDoTerms) {


            this.labelApi = <LabelResource> this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/labels/:id",
                {
                id: "@id",
                organizationSlug: this.organizationSlug
                },
                {
                "delete": {
                    method: "DELETE",
                    params: {
                        id: "@id",
                        organizationSlug: this.organizationSlug
                    }
                },
                create: {
                    method: "POST",
                    params: {
                        organizationSlug: this.organizationSlug
                    }
                },
                save: {
                    method: "PUT",
                    params: {
                        id: "@id",
                        organizationSlug: this.organizationSlug
                    }
                }
            });
            
            this.tagApi = <LabelResource> this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/tags/:id",
                {
                id: "@id",
                organizationSlug: this.organizationSlug
                },
                {
                "delete": {
                    method: "DELETE",
                    params: {
                        id: "@id",
                        organizationSlug: this.organizationSlug
                    }
                },
                create: {
                    method: "POST",
                    params: {
                        organizationSlug: this.organizationSlug
                    }
                },
                save: {
                    method: "PUT",
                    params: {
                        id: "@id",
                        organizationSlug: this.organizationSlug
                    }
                }
            });

            this.projectApi = <ProjectResource> this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug",
                {
                projectSlug: "@slug",
                organizationSlug: this.organizationSlug
                },
                {
                    save: {
                        method: "PUT",
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "@slug"
                        }
                    },
                    loadStats: {
                        method: "GET",
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/leadtime",
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug"
                        }
                    },
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug
                        }
                    }
                });
            
            this.pointScaleApi = <PointScaleResource> this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/point_scales",
                {
                    organizationSlug: this.organizationSlug,
                }, {
                    create: {
                        method: 'POST',
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug"
                        }
                    },
                    save: {
                        method: 'PUT',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/point_scales/:scale_id",
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug",
                            scale_id: "@id"
                        }
                    },
                    delete: {
                        method: 'DELETE',
                        url: API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/point_scales/:scale_id",
                        params: {
                            organizationSlug: this.organizationSlug,
                            projectSlug: "projectSlug",
                            scale_id: "@id"
                        }
                    }
                }
            );

            this.classicProjectApi = <ClassicProjectResource> this.resource(API_PREFIX + "organizations/:organizationSlug/classic/projects");
        }

        public deleteLabel = (labelId, projectSlug) => {
            var label;
            label = new this.labelApi();
            label.id = labelId;
            return label.$delete({
                projectSlug: projectSlug
            });
        }

        public saveLabel = (labelProperties, projectSlug) => {
            var label;
            label = new this.labelApi();
            _.extend(label, labelProperties);
            if (label.id === -1) {
                delete label.id;
                return label.$create({
                    projectSlug: projectSlug
                });
            } else {
                return label.$save({
                    projectSlug: projectSlug
                });
            }
        }
        
        public saveTag = (tagProperties, projectSlug) => {
            var tag;
            tag = new this.tagApi();
            _.extend(tag, tagProperties);
            if (tag.id === -1) {
                delete tag.id;
                return tag.$create({
                    projectSlug: projectSlug
                });
            } else {
                return tag.$save({
                    projectSlug: projectSlug
                });
            }
        }
        
        public deleteTag = (tagId, projectSlug) => {
            var tag;
            tag = new this.tagApi();
            tag.id = tagId;
            return tag.$delete({
                projectSlug: projectSlug
            });
        }

        public loadProjectsForOrganization = (organizationSlug, stats:any = false, reload:boolean = false) => {
            var deferred, p;
            if (organizationSlug in this.projectListByOrg && !reload) {
                deferred = this.$q.defer();
                deferred.resolve(this.projectListByOrg[organizationSlug]);
                return deferred.promise;
            } else {
                p = this.projectApi.query({
                    organizationSlug: organizationSlug,
                    stats: stats
                }).$promise;
                p.then((projects) => {
                    this.projectListByOrg[organizationSlug] = projects;
                    return this.recordProjects(projects);
                });
            }
            return p;
        }

        public loadClassicProjectsForOrganization = (organizationSlug) => {
            return this.classicProjectApi.query({
                organizationSlug: organizationSlug
            }).$promise;
        }

        public saveProject = (project) => {
            return project.$save();
        }

        public recordProjects = (projects) => {
            return projects.map((project) => this.updateProjectRecord(project));
        }

        public updateProjectRecord = (project) => {
            if (project.project_type === 2) {
                this.scrumdoTerms.card = "Milestone";
                this.scrumdoTerms.iteration = "Release";
            } else {
                this.scrumdoTerms.card = "Card";
                this.scrumdoTerms.iteration = "Iteration";
            }

            if (project.slug in this.projects) {
                return angular.copy(project, this.projects[project.slug]);
            } else {
                return this.projects[project.slug] = project;
            }
        }

        private cachedProjectLoads = {};
        public loadProject = (organizationSlug, projectSlug, forceLoad:boolean=false, stats:boolean=false):ng.IPromise<Project> => {
            let key = organizationSlug + ":" + projectSlug;

            if (key in this.cachedProjectLoads && !forceLoad) {
                return this.cachedProjectLoads[key];
            } else {
                let p = this.projectApi.get({
                    organizationSlug: organizationSlug,
                    projectSlug: projectSlug,
                    stats: stats
                }).$promise;
                this.cachedProjectLoads[key] = p;
                p.then(this.updateProjectRecord);
                return p;
            }

        }
        
        public loadPointScales(projectSlug): ng.IPromise<any>{
            var ps = this.pointScaleApi.query({projectSlug:projectSlug}).$promise;
            return ps;
        }

        public createProject(projectProperties): ng.IPromise<any> {
            let project = new this.projectApi();
            _.extend(project, projectProperties);
            return project.$create({organizationSlug:this.organizationSlug});
        }
        
        public savePointScale(projectSlug, scale): ng.IPromise<any>{
            var ps = new this.pointScaleApi();
            _.extend(ps, scale);
            var p = ps.$create({projectSlug:projectSlug});
            return p;
        }
        
        public updatePointScale(projectSlug, pointScale): ng.IPromise<any>{
            var ps = new this.pointScaleApi();
            _.extend(ps, pointScale);
            var p = ps.$save({projectSlug:projectSlug});
            return p;
        }
        
        public removePointScale(projectSlug, pointScale) :ng.IPromise<any>{
            var ps = new this.pointScaleApi();
            _.extend(ps, pointScale);
            var p = ps.$delete({projectSlug:projectSlug});
            return p;
        }
        
        public loadStats(projectSlug:string){
            var p = this.projectApi.loadStats({projectSlug:projectSlug}).$promise;
            return p;
        }
    }
};
