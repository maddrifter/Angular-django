/// <reference path='../_all.ts' />

module scrumdo {
    export class DashboardPortfolioProjectController {
        public static $inject: Array<string> = [
            "$scope",
            "$window"
        ];

        constructor(private scope, private window:ng.IWindowService) {
            if (!((this.scope.project != null) && (this.scope.project.stats != null))) {
                return;
            }
            var stats = this.scope.project.stats;
            var s: Array<any> = [];

            if ((this.scope.project.velocity != null) && this.scope.project.velocity > 0) {
                s.push({ label: 'Velocity', value: this.scope.project.velocity });
            }

            if (stats.points_claimed > 0) {
                s.push({ label: 'Points<br/>Completed', value: stats.points_claimed });
            }

            if (stats.system_flow_efficiency > 0) {
                s.push({ label: 'Flow<br/>Efficiency', value: stats.system_flow_efficiency + "%" });
            }

            if (stats.system_lead_time > 1440) {
                s.push({ label: 'Days<br/>Lead Time', value: Math.round(stats.system_lead_time / 1440) });
            }

            if (stats.daily_flow_efficiency > 0) {
                s.push({ label: 'Daily<br/>Flow Efficiency', value: stats.daily_flow_efficiency + "%" });
            }

            if (stats.daily_lead_time > 1440) {
                s.push({ label: 'Days Daily<br/>Lead Time', value: Math.round(stats.daily_lead_time / 1440) });
            }




            if (stats.story_count > 0) {
                s.push({label:"TOTAL<br/>CARDS", value:stats.story_count});

            }


            if (stats.stories_completed > 0) {
                s.push({label:"CARDS<br/>COMPLETED", value:stats.stories_completed});

            }


            if (stats.stories_in_progress > 0) {
                s.push({label:"CARDS<br/>IN PROGRESS", value:stats.stories_in_progress});

            }


            s = s.slice(0, 6);

            this.scope.stats = s;
            this.scope.showInactive = false;
            this.scope.showOnlyWatched = false;
            
        }


        onClick($event) {
            if($event.target.nodeName == 'LI') {
                $event.preventDefault();
                this.window.location.replace("/projects/" + this.scope.project.slug + "/board");
            }
        }

    }
}