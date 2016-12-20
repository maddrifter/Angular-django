/// <reference path='../_all.ts' />

var wizardMod: ng.IModule = angular.module("scrumdoBoardWizard", ['scrumdo-mixpanel']);

wizardMod.controller("BoardWizardController", scrumdo.BoardWizardController);
wizardMod.controller("BoardTemplatePickerController", scrumdo.BoardTemplatePickerController);