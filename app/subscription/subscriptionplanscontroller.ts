/// <reference path='../_all.ts' /> 

module scrumdo {
    export class SubscriptionPlansController {
        public static $inject: Array<string> = [
            "$scope",
            "$http",
            "API_PREFIX",
            "$uibModal",
            "urlRewriter",
            "mixpanel"
        ];

        private annual: boolean;
        private paid: boolean;
        private subscription;
        private userCount: number;
        private userCountLevels: Array<number>;
        private longOptions;
        private plansPage: boolean;
        private plans;
        private selectedStandardPlan;
        private selectedPremiumPlan;
        private standardPrice;
        private premiumPrice;
        private userSelectOption;

        constructor(
            private scope,
            private http: ng.IHttpService,
            public API_PREFIX: string,
            public modal: ng.ui.bootstrap.IModalService,
            private urlRewriter: URLRewriter,
            private mixpanel) {

            this.http.get(this.API_PREFIX + "organizations/subscription").then(this.onSubscription);
            this.annual = true;
            this.paid = false;
            this.subscription = null;
            this.userCount = 5;
            this.userCountLevels = [5, 10, 15, 30, 60, 100, 150, 200, 500, 1000, 2000];
            this.longOptions = (function() {
                var i, len, ref, results;
                ref = this.userCountLevels;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    var c = ref[i];
                    results.push({
                        label: c + " users",
                        value: c
                    });
                }
                return results;
            }).call(this);
            this.plansPage = true;
        }

        onSubscription = (result) => {
            this.subscription = result.data;
            this.plans = result.data.available_plans.annual;
            this.selectPlan(5);
        }

        selectPlan(userCount: number) {
            this.userCount = userCount;
            if (this.annual) {
                this.selectedStandardPlan = _.findWhere(this.subscription.available_plans.annual, { users: userCount, premium_plan: false, show_in_grid: true });
                this.selectedPremiumPlan = _.findWhere(this.subscription.available_plans.annual, { users: userCount, premium_plan: true, show_in_grid: true });
            } else {
                this.selectedStandardPlan = _.findWhere(this.subscription.available_plans.monthly, { users: userCount, premium_plan: false, show_in_grid: true });
                this.selectedPremiumPlan = _.findWhere(this.subscription.available_plans.monthly, { users: userCount, premium_plan: true, show_in_grid: true });
            }

            trace(this.selectedStandardPlan, this.selectedPremiumPlan);
            if (this.selectedStandardPlan != null) {
                this.standardPrice = this.selectedStandardPlan.price_val;
            }
            if (this.selectedPremiumPlan != null) {
                this.premiumPrice = this.selectedPremiumPlan.price_val;
            } else {
                this.premiumPrice = "";
            }
            this.userSelectOption = _.findWhere(this.longOptions, { value: this.userCount });
        }

        toggleAnnual() {
            this.annual = !this.annual;
            this.selectPlan(this.userCount);
        }
    }
}