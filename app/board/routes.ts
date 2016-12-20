/// <reference path='../_all.ts' />
module scrumdo {

    export function boardRoutes(
        $stateProvider: ng.ui.IStateProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        urlRewriter: URLRewriter) {

        $urlRouterProvider.otherwise("/view");

        $stateProvider.state('view', {
            url: "/view",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/board.html')
                }
            }
        });

        $stateProvider.state('viewIteration', {
            url: "/view/iteration/:iterationid",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/board.html')
                }
            }
        });

        $stateProvider.state('viewStory', {
            url: "/view/iteration/:iterationid/story/:storyid",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/board.html')
                }
            }
        });

        $stateProvider.state('settings', {
            url: "/settings",
            views: {
                bodyContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/settings.html'),
                    controller: 'SettingsController',
                    controllerAs: "settingsCtrl"
                }
            }
        });

        $stateProvider.state('settings.board', {
            url: "/settings/board",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/boardeditor/boardeditor.html')
                }
            }
        });

        $stateProvider.state('settings.reports', {
            url: "/settings/reports",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/boardeditor/boardeditor.html')
                }
            }
        });

        $stateProvider.state('settings.project', {
            url: "/settings/project",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/projectsettings.html')
                }
            }
        });
        
        $stateProvider.state('settings.labeltags', {
            url: "/settings/labeltags",
            views: {
                settingsContent: { 
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/projectlabeltags.html')
                }
            }
        });


        $stateProvider.state('settings.card', {
            url: "/settings/card",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/cardsettings.html')
                }
            }
        });


        $stateProvider.state('settings.admin', {
            url: "/settings/admin",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/adminsettings.html')
                }
            }
        });

        $stateProvider.state('settings.extras', {
            url: "/settings/extras",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/extrassettings.html')
                }
            }
        });

        $stateProvider.state('settings.githubextra', {
            url: "/settings/extras/github",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/githubextrassettings.html'),
                    controllerAs: 'githubctrl',
                    controller: "GithubProjectController"
                }
            }
        });

        $stateProvider.state('settings.slackextra', {
            url: "/settings/extras/slack",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/slackextrasettings.html'),
                    controllerAs: 'slackctrl',
                    controller: "SlackExtraController"
                }
            }
        });

        $stateProvider.state('settings.flowdockextra', {
            url: "/settings/extras/flowdock",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/flowdockextrasettings.html'),
                    controllerAs: 'flowdockctrl',
                    controller: "FlowdockExtraController"
                }
            }
        });

        $stateProvider.state('settings.emailcardextra', {
            url: "/settings/extras/emailcard",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/emailcardextrasettings.html'),
                    controllerAs: 'emailctrl',
                    controller: "EmailCardExtraController"
                }
            }
        });

        $stateProvider.state('settings.hipchatextra', {
            url: "/settings/extras/hipchat",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/hipchatextrassettings.html'),
                    controllerAs: 'hipchatctrl',
                    controller: "HipChatExtraController"
                }
            }
        });

        $stateProvider.state('settings.sharing', {
            url: "/settings/sharing",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/sharingsettings.html'),
                    controllerAs: 'sharectrl',
                    controller: "SharingController"
                }
            }
        });

        $stateProvider.state('settings.basecampextra', {
            url: "/settings/extras/basecamp",
            views: {
                settingsContent: {
                    templateUrl: urlRewriter.rewriteAppUrl('board/settings/basecampextrassettings.html')
                }
            }
        });
    }
}