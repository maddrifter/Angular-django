/// <reference path='../_all.ts' />

module scrumdo {

    const DEFAULT_LEVEL_COLORS = ["#3898DB", "#9A59B5", "#F5764E"];
    const availableIcons = [
        "fa-folder",
        "fa-server",
        "fa-bullseye",
        "fa-users",
        "fa-bank",
        "fa-user",
        "fa-book",
        "fa-bookmark",
        "fa-bug",
        "fa-building",
        "fa-calendar",
        "fa-cloud",
        "fa-comment",
        "fa-cube",
        "fa-diamond",
        "fa-exchange",
        "fa-feed",
        "fa-industry",
        "fa-random",
        "fa-ship",
        "fa-sitemap",
        "fa-tasks",
        "fa-user-secret"
    ];


    interface PortfolioLevelStub {
        name:string;
        icon:string;
        time_period: string;
        projects:Array<PortfolioProjectStub>;
        level_number:number;
        defaultWorkItem:string;
    }

    export interface PortfolioStub {
        id: number;
        root: PortfolioProjectStub;
        time_period: string;
        levels: Array<PortfolioLevelStub>;
    }
    
    export class PortfolioWindowController {
        public static $inject:Array<string> = [
            "portfolioManager",
            "projectManager",
            "$scope",
            "confirmService",
            "portfolio",
            "organizationSlug",
            "projectPickerService",
            "alertService"
        ];

        public action:string = 'Create Portfolio';
        public portfolio;
        public uiStage = 0;
        public allValid = false;
        public working = false;
        protected portfolioCopy;
        private userSubscription:any;


        private placeholderId:number = -10000;


        private templates = [
            [
                {
                    workItem:'User Story',
                    name:"Workspace",
                    value:1,
                    icon: "fa-cube",
                    time_period: "Iteration"
                }
            ],
            [
                {
                    workItem:'Feature',
                    name:"Program",
                    icon: "fa-bullseye",
                    value:1,
                    time_period: "Increment"
                },
                {
                    workItem:'User Story',
                    name:"Team",
                    icon: "fa-users",
                    value:1,
                    time_period: "Iteration"
                }
            ],
            [
                {
                    workItem:'Capability',
                    name:"Value Stream",
                    value:1,
                    icon: "fa-server",
                    time_period: "Value Stream Increment"
                },
                {
                    workItem:'Feature',
                    name:"Program",
                    icon: "fa-bullseye",
                    value:1,
                    time_period: "Program Increment"
                },
                {
                    workItem:'User Story',
                    name:"Team",
                    icon: "fa-users",
                    value:1,
                    time_period: "Iteration"
                }
            ]
        ];

        private template;

        constructor(private portfolioManager:PortfolioManager, 
                    private projectManager:ProjectManager,
                    private $scope,
                    private confirmationService:ConfirmationService,
                    portfolio:Portfolio,
                    private organizationSlug:string,
                    private projectPickerService:ProjectPickerService,
                    private alertService:AlertService) {

            if (portfolio) {
                this.portfolio = portfolio;
                this.uiStage = 3;
                this.action = 'Modify Portfolio';

            } else {
                this.createPorfolioStub();
            }
            this.portfolioCopy = angular.copy(this.portfolio);
            this.$scope.colorPalette = SCRUMDO_COLOR_PALETTE;

            this.userSubscription = this.$scope.$parent.user.organization.subscription;
        }

        
        private createPorfolioStub() {
            this.portfolio = {
                number: null,
                auto_teams: true,
                time_period: "Portfolio Increment",
                root: {
                    name:'New Portfolio',
                    work_item_name:'Portfolio Epic',
                    parents: [],
                    color: "#000000",
                    icon: "fa-folder",
                    uid: 'root'
                },
                levels: []
            };
        }

        private createLevelStub(name:string='New Level',
                                workItem:string='User Story',
                                icon:string=null):PortfolioLevelStub {
            if(icon == null){
                icon = <string>_.sample(availableIcons);
            }
            return {
                name:name,
                projects:[],
                time_period: "Iteration",
                level_number:this.portfolio.levels.length+1,
                defaultWorkItem:workItem,
                icon: icon
            };
        }

        setIcon(level:PortfolioLevelStub, icon:string) {
            level.icon = icon;
            for(var project of level.projects) {
                project.icon = icon;
            }
        }

        hasParent(project:PortfolioProjectStub, parent:PortfolioProjectStub) {
            return project.parents.filter((p) => p == parent || p.id == parent.id).length > 0;
        }

        toggleParent($event, project:PortfolioProjectStub, parent:PortfolioProjectStub) {
            $event.preventDefault();
            $event.stopImmediatePropagation();

            if(this.hasParent(project,parent)) {
                project.parents = project.parents.filter((p) => p != parent && p.id != parent.id);
            } else {
                project.parents.push(parent);
            }
        }

        parentProjects(level){
            var index = this.portfolio.levels.indexOf(level, 0);
            if (index > 0) {
                return this.portfolio.levels[index-1].projects;
            } else {
                return [this.portfolio.root];
            }
        }

        addExistingProject(level) {
            this.projectPickerService
                .pickProject()
                .then((project) => this.onAddExisting(level, project));
        }

        onAddExisting = (level:PortfolioLevelStub, project) => {
            // If this project exists in another level of the portfolio, we need to remove it from there.
            for(let otherLevel of this.portfolio.levels) {
                for(let otherProject of otherLevel.projects) {
                    removeById(otherProject.parents, project.id);
                }
                removeById(otherLevel.projects, project.id);
            }

            project.uid = uuid();
            
            level.projects.push(project);
            project.icon = level.icon;

            project.parents = [];

            if(level.level_number == 1) {
                project.parents.push(this.portfolio.root); // we don't have a UI to se the root project in level 1
            }

        }

        addLevel(name:string='', workItem:string='', icon:string='fa-question', timeType:string = 'Iteration'):PortfolioLevelStub {
            if(this.portfolio.levels.length > 20){return;}
            let level = this.createLevelStub(name, workItem, icon);
            level.time_period = timeType;
            this.portfolio.levels.push(level);
            return level;
        }

        removeLevel(level:PortfolioLevelStub) {
            this.confirmationService.confirm('Remove this level?', "This will remove the level and workspaces within it from the portfolio.", "No", "Yes").then(() => {
                this._onRemoveLevelConfirm(level);
            });

        }

        private _onRemoveLevelConfirm(level) {
            var index = this.portfolio.levels.indexOf(level);
            if(index == -1){return;}

            // First, remove the level
            this.portfolio.levels.splice(index, 1);


            if(this.portfolio.levels.length <= index) { return; } // no levels below this one, no more to do

            // There is a level under the one removed, it potentially has parents invalidly set, so we have to fix those.
            let parents = [];
            if(index == 0) {
                parents = [this.portfolio.root];
            }

            for(var project of this.portfolio.levels[index].projects) {
                project.parents = parents.concat();
            }

            // We also have to reset level numbers
            for(var i=0; i<this.portfolio.levels.length; i++) {
                this.portfolio.levels[i].level = i+1;
            }

        }

        removeProject(project, level:PortfolioLevelStub) {
            this.confirmationService.confirm('Remove this workspace?',
                                             "This will remove the workspace from the portfolio.  Any portfolio card relationships will be lost.  Are you sure?",
                                             "No", "Yes").then(() => {
                this._confirmRemoveProject(project, level);
            });
        }

        private _confirmRemoveProject(project, level:PortfolioLevelStub) {
            let index = level.projects.indexOf(project, 0);
            if (index == -1) { return; }

            level.projects.splice(index, 1);

            // Also need to remove this project from the parent arrays of any other projects
            let childLevelIndex = this.portfolio.levels.indexOf(level) + 1;

            if(childLevelIndex >= this.portfolio.levels.length) { return; } // it was in the lowest level, so no children possible.

            let l = this.portfolio.levels[childLevelIndex];
            for(var childProject of l.projects) {
                index = childProject.parents.indexOf(project, 0);
                if (index > -1) {
                    childProject.parents.splice(index, 1);
                }
                
                if(project.id) {
                    // When we're editing a portfolio, we might have separate objects and have
                    // to remove it by id instead of equality like when we're going through the
                    // create/build process.
                    removeById(childProject.parents, project.id);
                }
            }
        }

        setTemplate(num:number) {
            this.template = this.templates[num];
            this.uiStage = 1;
        }

        blankTemplate() {
            this.uiStage = 3;
        }

        buildTemplate() {
            for(var templateLevel of this.template) {
                let level = this.addLevel(templateLevel.name + 's', templateLevel.workItem, templateLevel.icon, templateLevel.time_period);
                for(var i=0;i<templateLevel.value;i++){
                    this.addProject(level, `${templateLevel.name} ${i+1}`, templateLevel.value);
                }
            }
            this.uiStage = 2;
        }

        private addProject(level:PortfolioLevelStub, projectName:string='', projectCount:number=1) {
            let levelIndex = this.portfolio.levels.indexOf(level);
            let parents = [];
            let color = '#' + SCRUMDO_COLOR_PALETTE[0][0];

            if(projectName==null) {
                projectName = 'New ' + level.name.replace(/s$/,'');
            }

            if(levelIndex > 0) {
                let parentCount = this.portfolio.levels[levelIndex-1].projects.length;
                let groupSize = projectCount / parentCount;
                let currentChildIndex = level.projects.length;
                let parentIndex = Math.floor(currentChildIndex / groupSize);
                parentIndex = parentIndex > parentCount ? parentCount : parentIndex;
                parentIndex = parentIndex > 0 ? parentIndex-1 : parentIndex;
                parents = [this.portfolio.levels[levelIndex-1].projects[parentIndex]];

            } else {
                parents = [this.portfolio.root];
            }

            if(levelIndex < 3) {
                color = DEFAULT_LEVEL_COLORS[levelIndex];
            }

            if(level.projects.length > 50) {
                return;
            }

            level.projects.push({
                name:projectName,
                color:color,
                icon:level.icon,
                work_item_name:level.defaultWorkItem || '',
                parents:parents,
                uid: uuid(),
                active: true, 
                id: this.placeholderId++
            });
        }

        cancel() {
            if(angular.equals(this.portfolioCopy, this.portfolio) && this.uiStage == 3){
                this.$scope.$dismiss('canceled');
            }else{
                this.confirmationService
                    .confirm('Are you sure?', 'Close this window?')
                    .then(()=>this.$scope.$dismiss('canceled'));
            }
        }

        onPortfolioSaved = (portfolio) => {
            this.$scope.$close(portfolio);
        }

        onPortfolioCreated = (portfolio) => {
            this.$scope.$close(portfolio);
        }

        onPortfolioFailed = (err) => {
            this.alertService.alert("Error", "Could not save portfolio.  " + err.statusText);
            this.working = false
        }

        onSave() {
            if(this.portfolio.id) {
                this.savePortfolio();
            } else {
                this.createStructure();
            }
        }

        savePortfolio() {
            this.working = true;
            return this.portfolioManager.updatePortfolio(this.portfolio)
                .then(this.onPortfolioSaved)
                .catch(this.onPortfolioFailed)

        }

        createStructure() {
            this.working = true;
            // The actual workhorse that does all the project creation.
            this.portfolioManager.buildPortfolio(this.portfolio)
                .then(this.onPortfolioCreated)
                .catch(this.onPortfolioFailed)
        }

        error = () => {
            if(this.portfolio.root.name.length == 0) {
                return "The portfolio must have a name.";
            }

            if(this.portfolio.root.work_item_name.length == 0) {
                return "The portfolio must have a work item name.";
            }

            if(this.portfolio.levels.length == 0) {
                return "You must have at least one level in your portfolio.";
            }

            for(var level of this.portfolio.levels) {

                if(level.name.length == 0) {
                    return 'Every portfolio level must have a name.';
                }
                for(var project of level.projects) {
                    if(project.parents.length == 0) {
                        return 'Every workspace must have at least one parent.';
                    }

                    if(project.name.length == 0) {
                        return 'Every workspace must have a name.';
                    }

                    if(project.work_item_name.length == 0) {
                        return 'Every workspace must have a work item name.';
                    }
                }
                if(level.projects.length == 0) {
                    return 'Every level must have at least one workspace';
                }
            }


            return null;
        }



    }
}