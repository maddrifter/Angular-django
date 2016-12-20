/// <reference path='../_all.ts' />

var chatModule: ng.IModule = angular.module("scrumdoChat", ['scrumdoCommon']);

chatModule.service("chatService", scrumdo.ChatService);
chatModule.controller("ChatController", scrumdo.ChatController);
