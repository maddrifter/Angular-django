/// <reference path='../_all.ts' />

module scrumdo {
    export class DashboardProjectController {
        public static $inject: Array<string> = [
            "$scope"
        ];

        constructor(private scope) {
            if (!((this.scope.project != null) && (this.scope.project.stats != null))) {
                return;
            }
            var stats = this.scope.project.stats;
            var s: Array<any> = [];

            if ((this.scope.project.velocity != null) && this.scope.project.velocity > 0) {
                s.push({ label: 'Velocity', value: this.scope.project.velocity });
            }

            if (stats.points_claimed > 0) {
                s.push({ label: 'Points Completed', value: stats.points_claimed });
            }

            if (stats.system_flow_efficiency > 0) {
                s.push({ label: 'Flow Efficiency', value: stats.system_flow_efficiency + "%" });
            }

            if (stats.system_lead_time > 1440) {
                s.push({ label: 'Lead Time', value: Math.round(stats.system_lead_time / 1440) });
            }

            if (stats.daily_flow_efficiency > 0) {
                s.push({ label: 'Daily Flow Efficiency', value: stats.daily_flow_efficiency + "%" });
            }

            if (stats.daily_lead_time > 1440) {
                s.push({ label: 'Daily Lead Time', value: Math.round(stats.daily_lead_time / 1440) });
            }

            s = s.slice(0, 4);

            this.scope.stats = s;
        }

    }
}