/// <reference path='../_all.ts' />
module scrumdo {

    export interface MiniProjectList {
        slug: string;
        name: string;
        category: string;
        icon: string;
        color: string;
        portfolioSlug: string;
        portfolioLevel:string;
        isPortfolio: boolean;
        prefix: string;
    }

    interface MiniOrganization {
        slug: string;
        id: number;
        planning_mode: string;
        name: string;
        subscription?: any;
    }

    interface ProjectAccess {
        canRead: boolean;
        canWrite: boolean;
        canAdmin: boolean;
        category: string;
        name: string;
        favorite: boolean;
        publishKey: string;
        subscribeKey: string;
        slug: string;
        channel: string;
        uuid: string;
    }

    interface ProjectAccessHash {
        [index: string]: ProjectAccess;
    }



    interface User extends ng.resource.IResource<User> {
        project_access:ProjectAccessHash;
        username: string;
        first_name: string;
        last_name: string;
        staff_orgs: Array<any>;
        base_url: string;
        id: number;
        avatar: string;
        organization: MiniOrganization;
        timezone: string;
        email: string;
        staff: boolean;
        milestone_statuses: {[index:number]:string};

    }

    interface UserResource extends ng.resource.IResourceClass<User> {

    }


    // Service to get a user's permissions for an organization.
    export class UserService {
        public me:User;
        public myName:string;
        public safeProjectList;
        public loaded;

        private User: UserResource;

        public static $inject:Array<string> = ["$resource",
                                        "$rootScope",
                                        "organizationSlug",
                                        "$localStorage",
                                        "API_PREFIX"]


        constructor($resource, public scope, protected organizationSlug, $localStorage, public API_PREFIX) {
            this.User = $resource(API_PREFIX + "organizations/:organizationSlug/me");
            this.scope.$storage = $localStorage.$default({});

            this.loaded = this.User.get({
                organizationSlug: organizationSlug
            }).$promise.then((me) => {
                    this.scope.user = me;
                    this.myName = shortuser(me);
                    this.setupSecurityVariables(me);
                    this.scope.projectList = this.projectList(); 
                    this.buildSafeProjectList();

                    // TODO - support multiple users on the same browser instead of overwriting defaults.
                    if (this.scope.$storage.username !== me.username) {
                        this.scope.$storage.iterDisplay = 0;
                        this.scope.$storage.savedIterations = [];
                        this.scope.$storage.sidebarOpen = true;
                        this.scope.$storage.username = me.username;
                    }
                    return this.scope.$broadcast("accessChanged");
                })
                .then(()=>this);
        }

        reloadUserProjects = () => {
            this.User.get({organizationSlug: this.organizationSlug}).$promise.then((me) => {
                this.me.project_access = me.project_access;
                this.scope.projectList = this.projectList(); 
                this.buildSafeProjectList();
            });
        }

        public isOrgStaff = ():boolean => {
            return this.scope.user.staff;
        }

        private setupSecurityVariables = (me:User):void => {
            this.me = me;
        }

        public access = (projectSlug:string) => {
            if ((this.me != null) && projectSlug in this.me.project_access) {
                return this.me.project_access[projectSlug];
            } else {
                return null;
            }
        }

        public canAdmin = (projectSlug:string):boolean => {
            if(! this.me){return undefined;} // Important to return undefined so bind-once will work correctly.

            if (this.me != null ? this.me.staff : void 0) {
                return true;
            }
            return (this.me != null) && (projectSlug in this.me.project_access) && this.me.project_access[projectSlug].canAdmin;
        }

        public canWrite = (projectSlug:string):boolean => {
            if(! this.me){return undefined;} // Important to return undefined so bind-once will work correctly.

            if (this.me != null ? this.me.staff : void 0) {
                return true;
            }
            return (this.me != null) && (projectSlug in this.me.project_access) && this.me.project_access[projectSlug].canWrite;
        }

        public canRead = (projectSlug:string):boolean => {
            if(! this.me){return undefined;} // Important to return undefined so bind-once will work correctly.

            if (this.me != null ? this.me.staff : void 0) {
                return true;
            }
            return (this.me != null) && (projectSlug in this.me.project_access) && this.me.project_access[projectSlug].canRead;
        }


        public projectList = ():Array<MiniProjectList> => {
            var k, r, v, _ref;
            r = [];
            _ref = this.me.project_access;
            for (k in _ref) {
                v = _ref[k];
                r.push({
                    "slug": k,
                    "name": v.name,
                    "category": v.category,
                    "icon": v.icon,
                    "color": v.color,
                    "portfolioSlug": v.portfolioSlug,
                    "portfolioLevel": v.portfolioLevel,
                    "isPortfolio": v.isPortfolio,
                    "prefix": v.prefix
                });
            }
            return _.sortBy(r, function(v:any){ (pad(v.category, 20, " ")) + " " + v.name });
        }

        public buildSafeProjectList = () => {
            this.safeProjectList = this.scope.safeProjectList = projectByPortfolio(this.scope.projectList);
        }
    }
}
