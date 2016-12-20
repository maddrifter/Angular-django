/// <reference path='../_all.ts' /> 

module scrumdo {
    export class TrackTimeController {
        public static $inject: Array<string> = [
            "timeManager",
            "trackTimeService",
            "teamManager",
            "organizationSlug",
            "projectManager",
            "$scope",
            "NgTableParams",
            "iterationManager"
        ];

        private currentProjectSlug: string;
        private endDate;
        private startDate;
        private date;
        private startDateOpen: boolean;
        private endDateOpen: boolean;
        private userId;
        private users: Array<any>;
        private entries: Array<any>;
        private timeTrackingMode: string;
        private timeTable: any;
        private isTableEmpty: boolean = true;
        private iterations: Array<any> = [];
        private workspace:Project;

        constructor(
            private timeManager: TimeManager,
            private trackTimeService: TrackTimeService,
            private teamManager,
            public organizationSlug: string,
            private projectManager,
            private scope,
            private NgTableParams,
            private iterationManager) {
            this.currentProjectSlug = null;

            var d = new Date();
            this.endDate = this.date = moment(d).format('YYYY-MM-DD');
            d.setDate(d.getDate() - 7);
            this.startDate = this.date = moment(d).format('YYYY-MM-DD');
            this.startDateOpen = false;
            this.endDateOpen = false;
            this.userId = "";
            this.users = [];
            this.entries = [];
            this.timeTrackingMode = "scrumdo";

            this.teamManager.allUsers(organizationSlug).then((results) => {
                this.users = results;
            });

            this.viewTime();

            this.scope.$watch(() => {
                return this.workspace;
            }, (val) => {
                if (val) {
                    this.loadIterations();
                }
            });
        }

        openStart(event: MouseEvent) {
            trace("opening start");
            this.startDateOpen = true;
            event.preventDefault();
            event.stopPropagation();
        }

        eow() {
            return moment(this.endDate).format("MM/DD/YYYY");
        }

        bow() {
            return moment(this.startDate).format("MM/DD/YYYY");
        }

        deleteEntry(entry) {
            this.timeManager.deleteEntry(entry).then(this.viewTime);
        }

        enterTime() {
            this.trackTimeService.trackTimeOnStory(null, null, null, null);
        }

        setProject(projectSlug) {
            if (typeof projectSlug !== "undefined" && projectSlug !== null) {
                this.projectManager.loadProject(this.organizationSlug, projectSlug).then((result) => {
                    this.currentProjectSlug = projectSlug;
                    this.timeTrackingMode = result.time_tracking_mode;
                });
            } else {
                this.timeTrackingMode = "scrumdo";
                this.currentProjectSlug = projectSlug;
            }
        }

        timeLabel(minutes) {
            var hours, minutes, ref;
            ref = minutesToHoursMinutes(minutes), hours = ref[0], minutes = ref[1];
            return hours + ":" + (pad(minutes, 2));
        }

        viewTime = () => {
            var end, start;
            if (this.startDate !== null) {
                start = this.startDate;
            } else {
                start = "2000-01-01";
            }
            if (this.endDate !== null) {
                end = this.endDate;
            } else {
                end = "2030-01-01";
            }
            this.timeManager.getTimeEntries(this.currentProjectSlug, this.userId, start, end).then((entries) => {
                //this.entries = entries;
                if (entries.length != 0) {
                    this.isTableEmpty = false;
                    entries = entries.map((entry) => {
                        entry.display_time = this.timeLabel(entry.minutes_spent);
                        return entry;
                    });
                    this.timeTable = new this.NgTableParams({
                        group: {
                            project_name: "desc"
                        }
                    }, { 
                        dataset: entries
                    });
                }
            });
        }

        updateNote(data) {
            console.log('note===', data);
        }

        updateTimeSpent(data) {
            console.log('time spent===', data);
        }

        loadIterations() {
            this.iterationManager.loadIterations(this.organizationSlug, this.workspace.slug).then((result) => {
                this.iterations = result;
                this.buildIterationTree();
            });
        }

        buildIterationTree(){
            let hasIncrement = _.find(this.iterations, (i: Iteration) => i.increment != null);
            _.forEach(this.iterations, (itr:Iteration) => {
                if(itr.increment == null && hasIncrement != null) {
                    itr.increment = {"id": -1, "name": "Others"};
                }
            });
        }

        sum(data, field) {
          var sum = 0;
          _.forEach(data, (ele:any) => {
              sum += ele.minutes_spent;
          })
          return this.timeLabel(sum);
        }
    }
}