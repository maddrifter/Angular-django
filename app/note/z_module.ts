/// <reference path='../_all.ts' />

var notemodule: ng.IModule = angular.module("scrumdoNotes", ['scrumdoCommon','scrumdoEditor']);

notemodule.service("noteService", scrumdo.NoteService);
notemodule.service("incrementNoteService", scrumdo.IncrementNoteService);
notemodule.controller("notesController", scrumdo.NotesController);
notemodule.controller("noteController", scrumdo.NoteController);
notemodule.controller("incrementnotescontroller", scrumdo.IncrementNotesController)
notemodule.controller("notewindowcontroller", scrumdo.NoteWindowController)

notemodule.directive("sdNotes", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/note/notes.html",
        controller: "notesController",
        controllerAs: 'ctrl'
    };
});

notemodule.directive("sdNote", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/note/sdnote.html",
        scope:{
            noteId: "=",
            project :"="
        },
        controller: "noteController",
        controllerAs: 'ctrl'
    };
});

notemodule.directive("incrementNotes", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/note/incrementnotes.html",
        scope:{
            increment: "=",
            project :"="
        },
        controller: "incrementnotescontroller",
        controllerAs: 'ctrl'
    };
});