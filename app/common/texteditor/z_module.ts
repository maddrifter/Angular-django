/// <reference path='../../_all.ts' />

var scrumdoEditor: ng.IModule = angular.module("scrumdoEditor", ['scrumdoCommon', 'ui.tinymce']);

scrumdoEditor.service("editorManager", ["$timeout", scrumdo.EditorManager]);

scrumdoEditor.controller("EditorController", scrumdo.EditorController);


scrumdoEditor.directive("clickableEditor", function($compile) {
    return {
        restrict: "EA",
        scope: {
            html: "=",
            project: "="
        },
        templateUrl: STATIC_URL + "app/common/texteditor/editor.html",
        controller: "EditorController",
        controllerAs: 'ctrl',
        link: function(scope, element: any, attrs, controller) {
            return controller.init(parseInt(attrs['clickableEditor'], element));
        }
    };
});
