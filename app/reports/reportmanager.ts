/// <reference path='../_all.ts' />

module scrumdo {
    export class ReportManager {

        public static $inject = ["$http", "API_PREFIX"];

        constructor(public http:ng.IHttpService, public API_PREFIX) {
        }

        public loadAging = (organizationSlug, projectSlug, workflowId, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/kstats/aging/" + workflowId,
                method: "GET",
                params: options
            });
        }

        public loadLead = (organizationSlug, projectSlug, workflowId, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/kstats/lead/" + workflowId,
                method: "GET",
                params: options
            });
        }

        public loadCFD = (organizationSlug, projectSlug, workflowId, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/kstats/cfd/" + workflowId,
                method: "GET",
                params: options
            });
        }

        public loadProjectBurn = (projectSlug) => {
            var p;
            p = this.http({
                url: "/projects/project/" + projectSlug + "/burndown",
                method: "GET"
            });
            p.then(this.normalizeData);
            return p;
        }

        public loadIterationBurn = (projectSlug, iterationId) => {
            var p;
            p = this.http({
                url: "/projects/project/" + projectSlug + "/" + iterationId + "/burndown",
                method: "GET"
            });
            p.then(this.normalizeData);
            return p;
        }
        
        public loadBlockers = (organizationSlug, projectSlug, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/blockers/reportdata" ,
                method: "GET",
                params: options
            });
        }
        
        public loadBlockerCards = (organizationSlug, projectSlug, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/blockers/cards" ,
                method: "GET",
                params: options
            });
        }
        
        public loadBlockersList = (organizationSlug, projectSlug, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/blockers/reportlistdata" ,
                method: "GET",
                params: options
            });
        }

        public loadBlockersFreq = (organizationSlug, projectSlug, options) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/blockers/reportfreq" ,
                method: "GET",
                params: options
            });
        }

        public loadIncrementFeaturesProgress = (organizationSlug, projectSlug, incrementId) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/kstats/incrementfeaturesprogress/iteration/" + incrementId,
                method: "GET",
                params: null
            });
        }

        public loadIncrementStoriesProgress = (organizationSlug, projectSlug, incrementId) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/kstats/incrementstoriesprogress/iteration/" + incrementId,
                method: "GET",
                params: null
            });
        }

        public loadIncrementFeaturesLead = (organizationSlug, projectSlug, incrementId) => {
            return this.http({
                url: this.API_PREFIX + "organizations/" + organizationSlug + "/projects/" + projectSlug + "/kstats/incrementfeatureslead/iteration/" + incrementId,
                method: "GET",
                params: null
            });
        }

        public normalizeData(data) {
            // Set up object based values
            // And make sure each series has the same # of entries to make them easy to plot later.
            var entry, lastValue, requiredValue, requiredValues, series, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
            requiredValues = [];

            data.data.forEach((series:{values:Array<any>, data:Array<any>}) => {
                series.values = series.data.map((d) => ({
                    x: d[0],
                    y: d[1]
                }));
                return series.values.map((entry) => {
                    if (_ref = entry.x, requiredValues.indexOf(_ref) < 0) {
                        return requiredValues.push(entry.x);
                    }
                });
            });

            _ref1 = data.data;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                series = _ref1[_i];
                series.values.sort((a, b) => a.x - b.x);
                for (_j = 0, _len1 = requiredValues.length; _j < _len1; _j++) {
                    requiredValue = requiredValues[_j];
                    lastValue = 0;
                    _ref2 = series.values;
                    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                        entry = _ref2[_k];
                        if (entry.x === requiredValue) {
                            break;
                        }
                        if (entry.x > requiredValue) {
                            series.data.push([requiredValue, lastValue]);
                            series.values.push({
                                x: requiredValue,
                                y: lastValue,
                                interpolated: true
                            });
                            break;
                        }
                        lastValue = entry.y;
                    }
                }
                series.values = _.uniq(series.values, false, (d:{x:number}) => d.x);  // Also, make sure the server didn't return any duplicate entries.
            }
        }
    }
}