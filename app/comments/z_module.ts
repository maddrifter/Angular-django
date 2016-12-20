/// <reference path='../_all.ts' />

var mod: ng.IModule = angular.module("scrumdoComments", ['scrumdoCommon']);

interface commScope extends ng.IScope {
    readonly
}

interface commController extends ng.IControllerService {
    init: Function
}

mod.service("commentsManager", scrumdo.CommentsManager);
mod.controller("CommentsController", scrumdo.CommentsController);
mod.controller("EditableCommentsController", scrumdo.EditableCommentsController);
mod.controller("CommentsBoxController", scrumdo.CommentsBoxController);

mod.directive("sdComments", function() {
    return {
        scope: {
            comments: '=',
            commentParent: '='
        },
        restrict: 'AE',
        templateUrl: STATIC_URL + "app/comments/comments.html"
    };
});

mod.directive("sdComment", function() {
    return {
        restrict: 'AE',
        controller: "CommentsController",
        templateUrl: STATIC_URL + "app/comments/comment.html"
    };
});

mod.directive("sdEditableComment", function() {
    return {
        scope: {
            story: "=",
            note: "=",
            project: "=",
            comments: '=',
            comment: "="
        },
        restrict: 'AE',
        controller: "EditableCommentsController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/comments/editablecomment.html",
        link: function(scope, element, attrs, controller: commController) {
            return controller.init(element);
        }
    };
});

mod.directive("sdCommentsBox", function() {
    return {
        restrict: "E",
        controller: "CommentsBoxController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/comments/commentsbox.html",
        scope: {
            story: "=",
            note: "=",
            project: "=",
            user: "="
        },
        require: ['sdCommentsBox', 'ngModel'],
        link: function(scope: commScope, element, attrs, controllers) {
            var myCtrl, ngModel;
            myCtrl = controllers[0], ngModel = controllers[1];
            myCtrl.init(element, ngModel);
            if (attrs.readonly === 'true') {
                return scope.readonly = true;
            }
        }
    };
});