/// <reference path='../_all.ts' />

var newsmodule: ng.IModule = angular.module("scrumdoNews", []);

newsmodule.service("newsManager", scrumdo.NewsManager);