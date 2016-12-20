/// <reference path='../_all.ts' />

var dashmodule: ng.IModule = angular.module("scrumdoDashboard", ["scrumdo-mixpanel", "ngCookies"]);

dashmodule.service("groupedNewsfeedManager", scrumdo.GroupedNewsfeedManager);
dashmodule.service("realtimeService", scrumdo.NullRealtimeService);
dashmodule.service("favoriteManager", scrumdo.FavoriteManager);

dashmodule.controller("dashboardController", scrumdo.DashboardController);
dashmodule.controller("DashboardProjectController", scrumdo.DashboardProjectController);
dashmodule.controller("DashboardPortfolioProjectController", scrumdo.DashboardPortfolioProjectController);

dashmodule.controller("DashboardInboxRedirectController", scrumdo.DashboardInboxRedirectController);
dashmodule.controller("DashboardPortfolioRedirectController", scrumdo.DashboardPortfolioRedirectController);
dashmodule.controller("UpgradeWindowController", scrumdo.UpgradeWindowController);
dashmodule.controller("SubscriptionMessageController", scrumdo.SubscriptionMessage);
dashmodule.controller("DashboardPortfolioController", scrumdo.DashboardPortfolioController);
dashmodule.controller('DashboardNavController', scrumdo.DashboardNavController);

dashmodule.directive("sdDashboardYourStories", function() {
    return {
        templateUrl: STATIC_URL + "app/dashboard/dashboardstories.html"
    };
});

dashmodule.directive("sdPorfolioSingleProject", function() {
    return {
        templateUrl: STATIC_URL + "app/dashboard/portfolio_single_project.html"
    };
});


dashmodule.directive("sdDashboardYourProjects", function() {
    return {
        templateUrl: STATIC_URL + "app/dashboard/dashboardprojects.html"
    };
});

dashmodule.directive("sdDashboardNews", function() {
    return {
        templateUrl: STATIC_URL + "app/dashboard/dashboardnews.html"
    };
});

dashmodule.directive("sdDashboard", function() {
    return {
        templateUrl: STATIC_URL + "app/dashboard/dashboard.html",
        controller: "dashboardController",
        controllerAs: "ctrl"
    };
});

dashmodule.directive("sdSubscriptionMessage", function() {
    return {
        scope: {
            user: "=",
            organization: '='
        },
        templateUrl: STATIC_URL + "app/dashboard/subscriptionmessage.html",
        controller: "SubscriptionMessageController",
        controllerAs: 'ctrl'
    };
});

dashmodule.directive("sdSubscriptionClass", function() {
    return {
        restrict: "A",
        link: (scope, element, attrs) => {
            var elem = angular.element(element).parents(".project-app")
            var header = angular.element("#boardHeader")
            elem.addClass("subscribe-alert")
            header.addClass("subscribe-alert")
            scope.$on('$destroy', function() {
                elem.removeClass("subscribe-alert")
                header.removeClass("subscribe-alert")
            });
        }
    };
});