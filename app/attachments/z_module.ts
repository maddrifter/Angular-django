/// <reference path='../_all.ts' />

var mod: ng.IModule = angular.module("scrumdoAttachments", ['angularFileUpload', 'ngCookies']);

interface attScope extends ng.IScope {
    readonly
}

interface attAttrs extends ng.IAttributes {
    readonly
}

mod.run(["STATIC_URL", "betaOptions", ((STATIC_URL, betaOptions) => {
    if (betaOptions.dropBox()) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = "https://www.dropbox.com/static/api/2/dropins.js"
        script.id = "dropboxjs"
        $(script).attr('data-app-key', "0whhn57g2oogt1u")
        document.getElementsByTagName('head')[0].appendChild(script);
    }else{
        // Dropbox not found ---> got undefined error
        window['Dropbox'] = false;
    }
})
]);

mod.service("attachmentsManager", scrumdo.AttachmentsManager);
mod.controller("SDAttachmentServices", scrumdo.SDAttachmentServices);
mod.controller("SDAttachmentsController", scrumdo.SDAttachmentsController);
mod.controller("SDLocalAttachmentsController", scrumdo.SDLocalAttachmentsController);
mod.controller("DropboxAttachmentsController", scrumdo.DropboxAttachmentsController);
mod.controller("SDAttachmentPreviewController", scrumdo.SDAttachmentPreviewController);

mod.directive("sdAttachmentsRo", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/attachments/attachmentsro.html",
        controller: "SDAttachmentsController",
        require: ['sdAttachmentsRo'],
        scope: {
            story: "=",
            project: "=",
            preloadedAttachments: "="
        },
        link: function(scope: attScope, element, attrs, controllers) {
            var myCtrl;
            myCtrl = controllers[0];
            if (attrs.readonly === 'true') {
                scope.readonly = true;
            }
            return myCtrl.init(element);
        }
    };
});

mod.directive("sdAttachments", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/attachments/attachments.html",
        controller: "SDAttachmentsController",
        require: ['sdAttachments'],
        scope: {
            story: "=",
            note: "=",
            project: "=",
            preloadedAttachments: "="
        },
        link: function(scope: attScope, element, attrs: attAttrs, controllers) {
            var myCtrl;
            myCtrl = controllers[0];
            if (attrs.readonly === 'true') {
                scope.readonly = true;
            }
            return myCtrl.init(element);
        }
    };
});

mod.directive("sdLocalAttachments", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/attachments/localattachments.html",
        controller: "SDLocalAttachmentsController",
        controllerAs: 'ctrl',
        require: ['sdLocalAttachments'],
        scope: {
            story: "=",
            note: "=",
            project: "=",
            preloadedAttachments: "="
        },
        link: function(scope: attScope, element, attrs: attAttrs, controllers) {
            var myCtrl;
            myCtrl = controllers[0];
            if (attrs.readonly === 'true') {
                scope.readonly = true;
            }
            return myCtrl.init(element);
        }
    };
});

mod.directive("dropboxAttachments", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/attachments/dropboxattachments.html",
        controller: "DropboxAttachmentsController",
        require: ['dropboxAttachments'],
        scope: {
            story: "=",
            note: "=",
            project: "=",
            preloadedAttachments: "="
        },
        link: function(scope: attScope, element, attrs: attAttrs, controllers) {
            var myCtrl;
            myCtrl = controllers[0];
            if (attrs.readonly === 'true') {
                scope.readonly = true;
            }
            return myCtrl.init(element);
        }
    };
});

mod.directive("sdAttachmentPreview", function() {
    return {
        restrict: "E",
        templateUrl: STATIC_URL + "app/attachments/attachmentpreview.html",
        controller: "SDAttachmentPreviewController",
        require: ['sdAttachmentPreview'],
        scope: {
            attachment: "="
        },
        link: function(scope: attScope, element, attrs: attAttrs, controllers) {
            var myCtrl;
            myCtrl = controllers[0];
            return myCtrl.init(element);
        }
    };
}); 