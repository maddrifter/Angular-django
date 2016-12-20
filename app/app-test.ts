/// <reference path='_all.ts' />

module scrumdo {

    export var setupTest = (staticUrl, projectSlug, organizationSlug) => {
        var STATIC_URL, app;
        STATIC_URL = staticUrl;

        app = angular.module("ScrumDoTestApp", [
            'ngResource',
            'ngStorage',
            'ngAnimate',
            'ngCookies',
            'ngTagsInput',
            'ui.select',
            'angular-loading-bar',
            'ui.bootstrap',
            'ui.bootstrap-slider',
            'ui.router',
            'frangTree',
            'pubnub.angular.service',
            'angularSpectrumColorpicker',
            'scrumdoGenericDirectives',
            'scrumdoFilters',
            'scrumdoFilterWidget',
            'scrumdoSidebar',
            'scrumdoControls',
            'scrumdoEpics',
            'scrumdoUser',
            'scrumdoControls',
            'scrumdoUser',
            'scrumdoBoardPreview',
            'scrumdoAttachments',
            'scrumdoComments',
            'scrumdoStories',
            'scrumdoTasks',
            'scrumdoIterations',
            'scrumdoBoardWizard',
            'scrumdoPoker',
            'scrumdoBoard',
            'scrumdoExceptions',
            'scrumdoPoker',
            'scrumdoProject',
            'scrumdoAlert',
            'scrumdoNews',
            'scrumdoEditor'
        ]);

        app.controller("ScrumDoTestController", function ($scope, epicManager, projectManager, iterationManager,
            storyManager, boardCellManager, boardHeadersManager, cardPicker,$rootScope) {
            $scope.currentUser = null;
            $scope.ctrl = this;
            $scope.currentIterations = [];
            $scope.currentAssignees = [];
            $scope.currentLabels = [];
            $scope.currentTags = ["test", "debug"];
            $scope.currentAttachments = [];
            $scope.newComment = "";
            this.dateChosen = "2015-05-01";
            this.timeEstimate = 0;

            this.selectedCells = [];

            this.selectedCellId = -1;

            this.cells = [];

            this.richText = "<p>Hello There <b>Marc</b></p>";

            this.longOptions = [
                { name: "Here is a longer option that is longer than normal" },
                { name: "Shorter" }
            ];

            this.currentLongOption = this.longOptions[0];

            $scope.exampleTags = [
                { name: "test" },
                { name: "debug" },
                { name: "info" },
                { name: "debuging" },
                { name: "doorbell" },
                { name: "dance" }
            ];

            this.openCardPicker = function () {
                $scope.selectedCards = "";
                projectManager.loadProjectsForOrganization(organizationSlug, false, false).then((results) => {
                    var slug = results[0].slug;
                    projectManager.loadProject(organizationSlug, slug).then((results) => {
                        $scope.project = results;
                        cardPicker.openCardPicker($scope.project, organizationSlug);
                        $rootScope.$on("storiesSelected", function (event, args) {
                            var cardsNum = "";
                            for (var i = 0; i < args.length; i++) {
                                cardsNum += "#" + args[i].number + " ";
                            }
                            $scope.selectedCards = cardsNum;
                        });
                    });
                });
            };

            boardCellManager.loadCells(organizationSlug, projectSlug).then((cells) => {
                this.cells = cells;
            });

            boardHeadersManager.loadHeaders(organizationSlug, projectSlug).then((headers) => {
                this.headers = headers;
            });

            epicManager.loadEpics(organizationSlug, projectSlug).then((results) => {
                $scope.epics = results;
                $scope.selectedOption = results[2];
            });

            projectManager.loadProject(organizationSlug, projectSlug).then((results) => {
                $scope.project = results;
            });

            iterationManager.loadIterations(organizationSlug, projectSlug).then((iterations) => {
                $scope.currentIteration = iterations[1];
                $scope.iterations = iterations;
                storyManager.loadIteration(projectSlug, $scope.currentIteration.id).then((stories) => {
                    $scope.currentStory = stories[0];
                    $scope.stories = stories;
                });
            });

        });

        app.constant("sidebarMultiselect", true);
        app.constant("projectSlug", projectSlug);
        app.constant("organizationSlug", organizationSlug);
        app.constant("API_PREFIX", API_PREFIX);
        app.constant("urlRewriter", new URLRewriter(STATIC_URL));
        app.service("realtimeService", NullRealtimeService);
        sdCommonDirectives(app, STATIC_URL);

        app.directive("sdTestDirective", function () {
            return {
                templateUrl: STATIC_URL + "app/test.html",
                controller: 'ScrumDoTestController'
            };
        });
        app.run((userService) => {
            trace("Loading user service");
        });

        return app;
    }
}