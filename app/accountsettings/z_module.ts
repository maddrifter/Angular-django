/// <reference path='../_all.ts' />

var accountmodule: ng.IModule = angular.module("scrumdoAccountSettings", ['angularFileUpload']);

accountmodule.service("accountManager", scrumdo.AccountManager);
accountmodule.controller("accountSettingsPageController", scrumdo.AccountSettingsPageController);
accountmodule.directive("sdAccountSettingsPage", function() {
    return {
        templateUrl: STATIC_URL + "app/accountsettings/accountsettingspage.html",
        controller: "accountSettingsPageController"
    }
}); 