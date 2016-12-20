/// <reference path='../_all.ts' />

var scrumdoCommon: ng.IModule = angular.module("scrumdoCommon", ['cfp.hotkeys', 'mentio']);

scrumdoCommon.service('scrumdoTerms', scrumdo.ScrumDoTerms);
scrumdoCommon.service('keyboardShortcutService', scrumdo.KeyboardShortcutService);
scrumdoCommon.service('betaOptions', scrumdo.BetaOptions);
scrumdoCommon.service('cardPicker', scrumdo.CardPicker);
scrumdoCommon.service('WIPLimitManager', scrumdo.WIPLimitManager);

scrumdoCommon.controller("sdMentioController", scrumdo.sdMentioController);

scrumdoCommon.directive("sdMentio", () => {
    return {
        scope: {
            project: "=",
            editor: "=",
            trigger: "="
        },
        restrict: 'E',
        controller: "sdMentioController",
        controllerAs: "ctrl",
        templateUrl: STATIC_URL + "app/common/mentio/sdmentio.html",
        link: (scope, element, attrs, controller: any) => {
            return controller.init(element);
        }
    };
});
