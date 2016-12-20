/// <reference path='../_all.ts' /> 

module scrumdo {
    // This directive will add canRead and canWrite attributes based upon a project and user in scope.
    // Example:
    //   <div sd-access >{{canWrite}} {{canRead}}</div>
    //
    // It relies on a user variable set up in the scope, this is usually managed
    // by the userService and contains a hash of project slugs <-> access info.
    //
    
    export var sdAccess = function($compile, userService) {
        return {
            scope: false,
            restrict: 'A',
            link: function(scope, element, attrs) {
                var setAccess;
                setAccess = function() {
                    if (scope.project != null) {
                        scope.canAdmin = userService.canAdmin(scope.project.slug);
                        scope.canRead = userService.canRead(scope.project.slug);
                        scope.canWrite = userService.canWrite(scope.project.slug);
                    } else {
                        scope.canAdmin = void 0;
                        scope.canRead = void 0;
                        scope.canWrite = void 0;
                    }
                };
                this.unwatchProject = scope.$watch('project', setAccess);
                scope.$on('accessChanged', setAccess);
            }
        };
    };
    
    /*
    #    On some of our pages, we're looking at multiple apps. One example of this is
    #    the organization dashboard.  In those cases, it's often times useful to set
    #    a scope.project equal to something so sub-components think they are on a single
    #    project page.  sd-project can do that for you.
    #    <div sd-project="project_slug">
    #      Hello {{project.name}}
    #    </div>
    #
    #    Note: sd-project relies on a projectsBySlug hash set up in the root scope to actually
    #    do it's magic.  You can see this done in the dashboardcontroller
    */

    export var sdProject = function($compile) {
        return {
            scope: true,
            restrict: 'A',
            link: function(scope, element, attrs) {
                var setProject;
                setProject = function() {
                    if (scope.projectsBySlug == null) {
                        return;
                    }
                    if (attrs.sdProject in scope.projectsBySlug) {
                        return scope.project = scope.projectsBySlug[attrs.sdProject];
                    }
                };
                return scope.$watch("projectsBySlug", setProject, true);
            }
        };
    };

}