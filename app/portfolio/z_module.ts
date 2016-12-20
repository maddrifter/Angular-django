/// <reference path='../_all.ts' />

var portfoliomodule: ng.IModule = angular.module("scrumdoPortfolio", ['scrumdoCommon']);

portfoliomodule.service("portfolioManager", scrumdo.PortfolioManager);
portfoliomodule.service("storyAssignmentManager", scrumdo.StoryAssignmentManager);

portfoliomodule.service("portfolioWindowService", scrumdo.PortfolioWindowService);
portfoliomodule.controller("PortfolioWindowController", scrumdo.PortfolioWindowController)
