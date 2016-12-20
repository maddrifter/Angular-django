/// <reference path='../_all.ts' />

module scrumdo {

    import IAugmentedJQuery = angular.IAugmentedJQuery;
    interface InboxScope extends ng.IScope {
        myStories:any;
        projectsBySlug:{[slug:string]:Project};

    }


    export class InboxController {
        public static $inject:Array<string> = ["$scope",
            "organizationSlug",
            "projectManager",
            "storyManager",
            "$element",
            "$window"
        ];

        public projects:Array<Project>;

        public watchedProjectByCategory:Array<any>;
        public otherProjectByCategory:Array<any>;

        protected scrollPosition:number;


        //
        //public toggleFavorite = (project) => {
        //    if (project.watched) {
        //        this.removeFavorite(project);
        //    } else {
        //        this.addFavorite(project);
        //    }
        //}
        //
        //public addFavorite = (project) => {
        //    project.watched = true;
        //    return this.favoriteManager.addProjectFavorite(project);//.then(() => this.reloadProject(project.slug));
        //}
        //
        //public removeFavorite = (project) => {
        //    project.watched = false;
        //    return this.favoriteManager.removeProjectFavorite(project);
        //}



        constructor(protected $scope:InboxScope,
                    public organizationSlug:String,
                    //protected favoriteManager,
                    protected projectManager:ProjectManager,
                    storyManager,
                    protected $element:IAugmentedJQuery,
                    public window:ng.IWindowService) {


            projectManager.loadProjectsForOrganization(organizationSlug, true).then((projects:Array<Project>) => {
                var k, v;

                this.projects = projects;
                $scope.$root.$emit("fullyLoaded");

                for(var project of projects ){
                    if( project.stats ) {
                        project.stats.daily_lead_time = Math.round(project.stats.daily_lead_time/1440);
                        project.stats.system_lead_time = Math.round(project.stats.system_lead_time/1440);
                    }

                }

                var groupMap = _.groupBy(_.where(this.projects, {watched:true}), function(p:Project):string{ return p.category });
                var groups = _.values(groupMap);
                this.watchedProjectByCategory = _.sortBy(groups,function(g){return g[0].category;});

                groupMap = _.groupBy(_.where(this.projects, {watched:false}), function(p:Project):string{ return p.category });
                groups = _.values(groupMap);
                this.otherProjectByCategory = _.sortBy(groups,function(g){return g[0].category;});

                this.$scope.projectsBySlug = {};
                projects.forEach((p) => {
                    this.$scope.projectsBySlug[p.slug] = p;
                });
            });


            storyManager.loadActiveStories().then(this.onMyStoriesLoaded);
            $scope.$on('saveScroll', this.saveScrollPosition);
            $scope.$on('loadScroll', this.loadScrollPosition);
        }


        protected saveScrollPosition = () => {
            this.scrollPosition = this.$element.find(".scrumdo-wrapper").scrollTop()
            this.$element.find(".scrumdo-wrapper").scrollTop(0);
        }

        protected loadScrollPosition = () => {
            this.$element.find(".scrumdo-wrapper").scrollTop(this.scrollPosition);
        }
        
        public search = (query) => {
            var q, url;
            q = encodeURIComponent(query); 
            url = "/projects/org/" + this.organizationSlug + "/search?q=" + q;
            return this.window.location.assign(url);
        }

        public onMyStoriesLoaded = (stories) => {
            var currentList, lastProject, myStoriesByProject;
            myStoriesByProject = [];
            lastProject = null;
            currentList = null;
            stories.forEach((story:Story) => {
                if (lastProject !== story.project_slug) {
                    lastProject = story.project_slug;
                    currentList = [];
                    myStoriesByProject.push({
                        "slug": story.project_slug,
                        stories: currentList
                    });
                }
                if (currentList.indexOf(story) < 0) {
                    return currentList.push(story);
                }
            });

            this.$scope.myStories = myStoriesByProject;
        }

    }
}