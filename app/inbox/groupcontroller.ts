/// <reference path='../_all.ts' />

module scrumdo {

    import HotkeysProvider = angular.hotkeys.HotkeysProvider;

    interface InboxGroupScope extends ng.IScope {
        groupCounts:Array<number>;
    }

    export class GroupController {
        public static $inject:Array<string> = ["$scope",
                                               "$stateParams",
                                               "$state",
                                               "organizationSlug",
                                               "inboxManager",
                                               "projectManager",
                                               "$sce",
                                               "hotkeys"];
        public group:InboxGroup;
        public project:Project;
        public newComment:string;

        public static ignoreList = ["cell_id", "rank"];

        public static diffNames = {
            cell_name: "Cell",
            tags_cache: "Tags"
        };

        constructor(private $scope:InboxGroupScope,
                    private $stateParams:ng.ui.IStateParamsService,
                    private $state:ng.ui.IStateService,
                    organizationSlug:string,
                    private inboxManager:InboxManager,
                    projectManager:ProjectManager,
                    private $sce:ng.ISCEService,
                    hotkeys:HotkeysProvider) {


            this.group = inboxManager.getCachedGroup($stateParams['groupId']);
            if(this.group == null) {
                $state.go("inbox");
                return
            }

            projectManager.loadProject(organizationSlug, $stateParams['projectSlug']).then((project:Project) => {
                this.project = project;
            });



            hotkeys.bindTo(this.$scope)
                .add({
                    combo: "esc",
                    description: "Back to project list",
                    callback: (event) => {
                        event.preventDefault()
                        this.back();
                    }
                })
                .add({
                    combo: "del",
                    description: "Delete Entry",
                    callback: (event) => {
                        event.preventDefault()
                        this.archive();
                    }
                })
                .add({
                    combo: "right",
                    description: "Next Entry",
                    callback: (event) => {
                        event.preventDefault()
                        this.next();
                    }
                })
                .add({
                    combo: "left",
                    description: "Previous Entry",
                    callback: (event) => {
                        event.preventDefault()
                        this.previous();
                    }
                })

                .add({
                    combo: "k",
                    description: "Next Entry",
                    callback: (event) => {
                        event.preventDefault()
                        this.next();
                    }
                })
                .add({
                    combo: "j",
                    description: "Previous Entry",
                    callback: (event) => {
                        event.preventDefault()
                        this.previous();
                    }
                })

        }

        public previous():void {
            this.$scope.$root.$broadcast("previousGroup", this.group);
        }

        public next():void {
            this.$scope.$root.$broadcast("nextGroup", this.group);
        }

        public back():void {
            this.$scope.$emit('loadScroll');
            this.$state.go("inbox")
        }

        public archive():void {
            this.next();
            if( this.group.id > 0) {
                //this.$scope.groupCounts[1]--;
                this.inboxManager.deleteGroup(this.project.slug, this.group);
            }
        }

        public showDiff(key:string):boolean {
            return GroupController.ignoreList.indexOf(key) == -1;
        }

        public translateDiffKey(key:string):string {
            if(key in GroupController.diffNames) {
                return GroupController.diffNames[key];
            }
            var k = key.replace("_", " ")
            return k.charAt(0).toUpperCase() + k.slice(1);
        }
        
        public getDiffValues(key:string, values:any):string{
            if(key == 'labels'){
                var labels:string = "";
                for(var k in values){
                    var bgcolor:string = "#"+values[k].color.toString(16);
                    labels += "<span style=\"background-color: "+bgcolor+"\" class='labels'>"+values[k].name+"</span>";
                }
                return this.$sce.trustAsHtml(labels);
            }else{
                return values;
            }
        }
    }
}