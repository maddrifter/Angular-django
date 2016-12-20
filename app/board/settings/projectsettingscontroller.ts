/// <reference path='../../_all.ts' />
///<reference path="../../common/util.ts"/>

module scrumdo {
    
    interface CustomPointScale extends PointScale {
        error: string;
        isValid: boolean;
    }
    
    export class ProjectSettingsController {
        public static $inject: Array<string> = [
            "$scope",
            "projectManager",
            "confirmService",
            "mixpanel",
            "organizationSlug",
            "teamManager"
        ];

        private project;
        private saveCalled: boolean;
        private project_shared: boolean;
        private project_shared_key: string;
        private harvestEnabled: boolean;
        public releaseMode: boolean;
        private customPointScales: Array<PointScale>;
        private customPointScalesCopy: Array<PointScale>;
        private pointScaleApiError:string;
        private agingRecommendedValues: {warning:number, critical:number} = {warning:0, critical:0};
        public prefix_error:string;
        private projectLabelCopy: Array<any>;
        private projectTagsCopy: Array<any>;
        private projectTeams: Array<any>;
        private loadingTeams: boolean;
        public projectHexColor:string;

        constructor(
            private scope,
            private projectManager: ProjectManager,
            private confirmService: ConfirmationService,
            public mixpanel,
            private organizationSlug: string,
            private teamManager: TeamManager) {

            this.scope.ctrl = this;
            this.scope.colorPalette = SCRUMDO_COLOR_PALETTE;
            this.project = angular.copy(this.scope.currentProject);
            this.releaseMode = this.project.project_type === 2;
            this.scope.$watch("currentProject", this.onProjectChanged);
            this.scope.$watch("ctrl.project.point_scale_type", this.onPointScaleSelected)
            this.mixpanel.track('View Board Settings', { subpage: 'app.settings.project' });
            this.scope.$on('$stateChangeStart', this.onStateChangeStart);
            this.saveCalled = false;
            this.project_shared = false;
            this.project_shared_key = '';
            this.checkProjectSharing();
            this.harvestEnabled = false;
            this.checkTimeTrackingMode();
            this.prefix_error = null;
            this.projectLabelCopy = angular.copy(this.project.labels);
            this.projectTagsCopy = angular.copy(this.project.alltags);
            this.projectTeams = [];
            this.loadingTeams = true;
            this.projectHexColor = "#" + colorToHex(this.project.color);
        }

        checkTimeTrackingMode() {
            this.harvestEnabled = this.project.time_tracking_mode === "harvest";
        }

        setTimeTrackingMode() {
            this.project.time_tracking_mode = this.harvestEnabled ? "harvest" : "scrumdo";
            angular.copy(this.project, this.scope.currentProject);
            this.projectManager.saveProject(this.scope.currentProject).then(() => {
                trace("tracking mode updated");
            });
        }

        onStateChangeStart = (event, toState, toParams, fromState, fromParams) => {
            if ((!this.saveCalled) && (fromState.name === "app.settings.project")) {
                this.projectManager.loadProject(this.organizationSlug, this.project.slug, true);
            }
            if (fromState.name === "app.settings.labeltags") {
                this.projectManager.loadProject(this.organizationSlug, this.project.slug, true);
            }
        }

        onProjectChanged = () => {
            this.project = angular.copy(this.scope.currentProject);
            this.loadPointScale();
            this.loadProjectStats()
        }

        setIcon(icon:string) {
            this.project.icon = icon;
        }

        setColor(color:string)  {
            this.project.color = hexColorToInt(color);
        }

        editLabel(label) {
            label.hexColor = colorToHex(label.color);
            label.editMode = true;
        }

        saveLabel(label) {
            label.color = hexColorToInt(label.hexColor);
            if (label.id === -1) {
                this.mixpanel.track('Create Label', { name: label.name });

            }
            this.projectManager.saveLabel(label, this.scope.currentProject.slug).then((result) => {
                label.id = result.id;
                label.editMode = false;
            });
        }

        cancelEditLabel(label){
            var labelCopy = _.find(this.projectLabelCopy, (l) => l.id == label.id);
            if(labelCopy != null){
                label.name = labelCopy.name;
            }
            label.editMode = false;
            if(label.id == -1){
                this.confirmDelete(label);
            }
        }

        deleteLabel(label) {
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this label?", "No", "Yes").then(() => {
                this.confirmDelete(label);
            });
        }

        confirmDelete(label) {
            var i: number = this.project.labels.indexOf(label);
            if (i !== -1) {
                this.project.labels.splice(i, 1);
            }
            if (label.id !== -1) {
                this.projectManager.deleteLabel(label.id, this.scope.currentProject.slug);
            }
        }

        save() {
            this.saveCalled = true;
            this.prefix_error = null;
            if(this.project.warning_threshold === "") this.project.warning_threshold = null;
            if(this.project.critical_threshold === "") this.project.critical_threshold = null;
            angular.copy(this.project, this.scope.currentProject);
            var toSavePrefix = this.project.prefix;
            this.projectManager.saveProject(this.scope.currentProject).then((result) => {

                if(this.scope.projectSettingsForm) {
                    this.scope.projectSettingsForm.$setPristine();
                }
                this.project.prefix = result.prefix;
                if(result.prefix_error != null){
                    this.prefix_error = "<strong>\'"+toSavePrefix+"\'</strong> prefix has been already used for another workspace,\
                     please choose another one for this workspace!";
                }
                this.scope.$root.$broadcast("projectSettingsUpdated", null);
                
            });
        }
        
        inputFocus(event) {
            setTimeout(() => {
                $(event.target).parent().prev().find("input").focus();
            }, 150)
        }

        addLabel(event) {
            var c = SCRUMDO_BRIGHT_COLORS[_.random(0, (SCRUMDO_BRIGHT_COLORS.length - 1))];
            this.project.labels.push({
                name: '',
                color: 0,
                hexColor: c,
                editMode: true,
                id: -1
            });
            this.inputFocus(event);
        }
        
        addTag(event) {
            this.project.alltags.push({
                name: '',
                editMode: true,
                id: -1
            });
            this.inputFocus(event);
        }
        
        saveTag(tag) {
            if (tag.id === -1) {
                this.mixpanel.track('Create Tag', { name: tag.name });
            }
            this.projectManager.saveTag(tag, this.scope.currentProject.slug).then((result) => {
                if (tag.id === -1) {
                tag.id = result.id;
                }else{
                    if(result.dups != null && result.dups.length > 0){
                        this.removeDuplicateTags(tag, result.dups);
                    }
                }
                tag.editMode = false;
            });
        }

        editTag(tag) {
            tag.editMode = true;
        }

        cancelEditTag(tag){
            var tagCopy = _.find(this.projectTagsCopy, (t) => t.id == tag.id);
            if(tagCopy != null){
                tag.name = tagCopy.name;
            }
            tag.editMode = false;
            if(tag.id == -1){
                this.confirmDeleteTag(tag);
            }
        }
        
        removeDuplicateTags(tag, dups){
            for(var i in dups){
                var t = dups[i];
                var similar_tag = _.find(this.project.alltags, (d:any ) => (d.name == t.name && d.id != tag.id));
                if(similar_tag != null ){
                    var j: number = this.project.alltags.indexOf(similar_tag);
                    if (j !== -1) {
                        this.project.alltags.splice(j, 1);
                    }
                }
            }
        }
        
        deleteTag(tag) {
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this tag?", "No", "Yes").then(() => {
                this.confirmDeleteTag(tag);
            });
        }
        
        confirmDeleteTag(tag) {
            var i: number = this.project.alltags.indexOf(tag);
            if (i !== -1) {
                this.project.alltags.splice(i, 1);
            }
            if (tag.id !== -1) {
                this.projectManager.deleteTag(tag.id, this.scope.currentProject.slug);
            }
        }
        
        searchByTag(tag) {
            var q = encodeURIComponent('tag: ' + tag.name + ',');
            var url = "/projects/project/" + this.project.slug + "/search?q=" + q;
            var win = window.open(url, '_blank');
            win.focus();
        }

        checkProjectSharing() {
            if ((this.project.shared != null) && this.project.shared !== '') {
                this.project_shared = true;
                this.project_shared_key = this.project.shared;
            }
        }

        updateProjectSharing() {
            var key = this.project_shared ? projectSharedKey(16) : null;
            this.project.shared = key;
            angular.copy(this.project, this.scope.currentProject);
            this.projectManager.saveProject(this.scope.currentProject).then(() => {
                trace("project updated");
                this.project_shared_key = key;
            });
        }
        
        loadPointScale() {
            this.projectManager.loadPointScales(this.project.slug).then((result) => {
                this.customPointScales = result;
                this.customPointScalesCopy = angular.copy(this.customPointScales);
            });
        }
        
        editPointScale(scale: CustomPointScale) {
            if (scale.scale_value.length < 25) {
                scale.scale_value.push(["", ""]);
            }
            scale.isValid = true;
            scale.editMode = true;
        }
        
        addPointScale() {
            var scale_type = -1;
            var defaultScale;
             var scale: CustomPointScale = {
                value: angular.copy(this.scope.currentProject.point_scale),
                id: -1,
                scale_value: angular.copy(this.scope.currentProject.point_scale),
                project: null,
                user: null,
                editMode: true,
                error: "",
                isValid: true
            }
             if (scale.scale_value.length < 25) {
                 scale.scale_value.push(["", ""]);
             }
            this.customPointScales.push(scale);
            setTimeout(this.focusOnLast, 200); 
        }
        
        focusOnLast = () => {
            var lastScaleElement = $(".scale-values", ".custom-point-scales").last();
            var inputElement = $("input", lastScaleElement).first();
            inputElement.focus();
        }
        
        onPointScaleSelected = () => {
            this.save();
        }
        
        onPointScaleChange = (scale: CustomPointScale, s) => {
            var values = scale.scale_value;
            if (values[values.length - 1][0].length > 0 && values.length < 25) {
                scale.scale_value.push(["", ""]);
            } else if (s[0] == '' && values.length != 25 && values.length > 2) {
                scale.scale_value.splice(-1, 1);
            }
            s[1] = s[0];
            scale.isValid = this.isValidInput(s);
        }
        
        onPointLabelChange = (scale: CustomPointScale, s) => {
            if (s[1] == "") {
                s[1] = s[0];
            }
        }
        
        validateValue = (scale: CustomPointScale, s) => {
            var v = isNaN(s[0]) || s[0] == "Infinity" ? s[0].toLowerCase() : s[0];
            if (this.isValidInput(s)) {
                if (v == "inf" || v == "infinite" || v == "infinity") {
                    s[0] = "Inf";
                    s[1] = "Infinity";    
                } 
                if (!isNaN(s[0]) && s[0] > 9999999) {
                    s[0] = s[1] = 9999999;
                } else if (s[0] > 0) {
                    s[0] = s[1] = Math.round(s[0] * 100) / 100;
                }
            } else {
                s[0] = s[1] = "";
            }
            scale.isValid = this.isValidInput(s);
        }
        
        isValidInput(s) {
            if (s[0] == "") return true;
            var v = isNaN(s[0]) || s[0] == "Infinity" ? s[0].toLowerCase() : s[0];
            var validStrings = ["?", "inf", "infinite", "infinity"];
            if (validStrings.indexOf(v) > -1 || !isNaN(s[0])) {
                return true;
            } else {
                return false;
            }
        }
        
        validateScale(scale: PointScale) {
            return _.filter(scale.scale_value, (v) => v[0] != "").length >= 2;
        }
        
        savePointScale(scale: CustomPointScale) {
            if (scale.id > 0) {
                this.projectManager.updatePointScale(this.project.slug, scale).then((result) => {
                    scale.scale_value = result.scale_value;
                    scale.editMode = false;
                    scale.error = null;
                    if (this.project.point_scale_type == (scale.id + 5)) {
                        this.save();
                    }
                }, (error) => {
                    scale.error = error.data;
                });
            } else {
                this.projectManager.savePointScale(this.project.slug, scale).then((result) => {
                    scale.scale_value = result.scale_value;
                    scale.id = result.id;
                    scale.editMode = false;
                    scale.error = null;
                    this.project.point_scale_type = scale.id + 5;
                }, (error) => {
                    scale.error = error.data;
                });
            }
        }
        
        deletePointScale(scale: PointScale) {
            this.confirmService.confirm("Are you sure?", "Are you sure you want to delete this Point Scale?", "No", "Yes").then(() => {
                this.projectManager.removePointScale(this.project.slug, scale).then(() => {
                    var i: number = this.customPointScales.indexOf(scale);
                    if (i !== -1) {
                        this.customPointScales.splice(i, 1);
                    }
                });
            });
        }
        
        cancelPointScale(scale: PointScale) {
            if (scale.id > 0) {
                var scaleCopy: PointScale;
                try {
                    scaleCopy = _.find(this.customPointScalesCopy, (s) => s.id == scale.id);
                    scale.scale_value = angular.copy(scaleCopy.scale_value);
                } catch (error) {
                    trace(error);
                }
                scale.editMode = false;
            } else {
                var i: number = this.customPointScales.indexOf(scale);
                if (i !== -1) {
                    this.customPointScales.splice(i, 1);
                }
            }
        }
        
        isEditingPointScale() {
            return _.filter(this.customPointScales, (s) => s.editMode == true).length > 0;
        }
        
        //load the leadtime values for aging thresholds suggestion
        loadProjectStats(){
            this.projectManager.loadStats(this.project.slug).then((result) => {
                this.agingRecommendedValues.warning = result.warning;
                this.agingRecommendedValues.critical = result.critical;
            });
        }
        
        validThresholdValues(){
            return (parseInt(this.project.critical_threshold) >= parseInt(this.project.warning_threshold)) || 
                (this.project.critical_threshold == "" || this.project.warning_threshold == "" || 
                this.project.critical_threshold == null || this.project.warning_threshold == null);
        }
        
        validateThresholdValues(type){
            if(!this.validThresholdValues()){
                if(type == "critical") this.project.critical_threshold = this.project.warning_threshold;
                if(type == "warning") this.project.warning_threshold = this.project.critical_threshold;
            }
        }

        validateDuedateThreshold(){
            if(this.project.duedate_warning_threshold == null){
                this.project.duedate_warning_threshold = 0;
            }
        }

        loadTeams(){
            this.teamManager.loadProjectTeams(this.organizationSlug, this.project.slug).then((teams) => {
                this.projectTeams = teams;
                this.loadingTeams = false;
            });
        }

        getTeamAccessLabel(team){
            switch (team.access_type) {
                case 'read':
                    return "Read Only Access";
                    break;
                case 'write':
                    return "Read/Write Access";
                    break;
                case 'admin':
                    return "Workspace Manager Access";
                    break;
                case 'staff':
                    return "Account Owner Access";
                    break;
            }
        }
    }
}
