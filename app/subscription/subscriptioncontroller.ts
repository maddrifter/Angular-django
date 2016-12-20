/// <reference path='../_all.ts' /> 

module scrumdo {
    export class SubscriptionController {
        public static $inject: Array<string> = [
            "$scope",
            "$http",
            "organizationSlug",
            "API_PREFIX",
            "$uibModal",
            "urlRewriter",
            "mixpanel",
            "confirmService"
        ];

        private annual: boolean;
        private subscriptionCode: string;
        private paid: boolean;
        private subscription;
        private plans;
        private userCount: number;
        private userCountLevels: Array<number>;
        private longOptions;
        private showMembers: boolean;
        private allMembers: Array<any>;
        private allsettogo: boolean;
        private userquery: string;
        private dialog: ng.ui.bootstrap.IModalServiceInstance;
        private percent;
        private creditCard;
        private currentPrice;
        private upgradeMonthlyPlan;
        private upgradeAnnualPlan;
        private selectedStandardPlan;
        private selectedPremiumPlan;
        private standardPrice;
        private premiumPrice;
        private userSelectOption;
        private subscriptionCodeStatus;

        constructor(
            private scope,
            private http: ng.IHttpService,
            public organizationSlug: string,
            public API_PREFIX: string,
            private modal: ng.ui.bootstrap.IModalService,
            private urlRewriter: URLRewriter,
            private mixpanel,
            private confirmService: ConfirmationService) {

            this.http.get(this.API_PREFIX + "organizations/" + this.organizationSlug + "/users").then(this.onloadAllUsers);
            this.http.get(this.API_PREFIX + "organizations/" + this.organizationSlug + "/subscription").then(this.onSubscription);
            var c;

            this.annual = true;
            this.subscriptionCode = '';
            this.paid = false;
            this.subscription = null;
            this.userCount = 5;
            this.userCountLevels = [5, 10, 15, 30, 60, 100, 150, 200, 500, 1000, 2000];
            this.longOptions = (function() {
                var i, len, ref, results;
                ref = this.userCountLevels;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    c = ref[i];
                    results.push({
                        label: c + " users",
                        value: c
                    });
                }
                return results;
            }).call(this);
            this.showMembers = false;
            this.allMembers = [];
            this.allsettogo = false;
        }

        onloadAllUsers = (result) => {
            this.allMembers = result.data;
        }

        allMembersMode(mode) {
            this.showMembers = mode;
        }

        removeUser(member) {
            this.confirmService.confirm("Are you sure?", "You want to remove this User from organization?", 'No', 'Yes').then(() => {
                this.deleteConfirm(member);
            });
        }

        deleteConfirm(member) {
            this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/teams/0/removeuserallteams", { user_id: member.id }).success(() => {
                this.onUserRemoved(member);
            });
        }

        onUserRemoved = (user) => {
            this.allMembers = _.filter(this.allMembers, (member) => member.id != user.id);
            this.userquery = '';
            $('#sub_members_count').html(this.allMembers.length.toString());
            var planUsers: number = parseInt($('#sub_members_plan').html());
            var totalUsers: number = this.allMembers.length;
            if (totalUsers <= planUsers) {
                this.allsettogo = true;
            }
        }

        cancel() {
            this.dialog = this.modal.open({
                templateUrl: this.urlRewriter.rewriteAppUrl("subscription/subscriptioncanceldialog.html"),
                windowClass: "scrumdo-modal primary fade",
                backdrop: "static",
                keyboard: false
            });
            this.dialog.result.then(this.onCanceled);
        }

        onCanceled = (reason) => {
            this.mixpanel.track("Cancel", { reason: reason });
            this.cancelSubscription();
        }

        cancelSubscription() {
            this.http({
                method: 'POST',
                url: "/subscription/" + this.organizationSlug + "/cancel",
                data: $.param({ reason: 'selected free plan' }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(() => {
                this.http.get(this.API_PREFIX + "organizations/" + this.organizationSlug + "/subscription").then(this.onSubscription);
            });
        }

        onSubscription = (result) => {
            this.subscription = result.data;
            this.plans = result.data.available_plans.annual;
            this.percent = Math.round(100 * this.subscription.users_used / this.subscription.plan.users);
            this.paid = (!this.subscription.plan.isFree) && (!this.subscription.is_trial);
            this.creditCard = this.paid && this.subscription.token !== '' && this.subscription.billing.active;
            this.currentPrice = parseInt(this.subscription.plan.price_val);
            var plan = null;
            if (this.paid) {
                if (!this.subscription.plan.yearly) {
                    this.plans = this.subscription.available_plans.monthly;
                    this.annual = false;
                }
                plan = _.findWhere(this.plans, { users: this.subscription.plan.users });
                if (!this.subscription.plan.premium_plan && (plan != null)) {
                    this.upgradeMonthlyPlan = _.findWhere(this.subscription.available_plans.monthly, { users: plan.users, premium_plan: true, show_in_grid: true });
                    this.upgradeAnnualPlan = _.findWhere(this.subscription.available_plans.annual, { users: plan.users, premium_plan: true, show_in_grid: true });
                }
            }

            if (typeof plan !== "undefined" && plan !== null) {
                this.selectPlan(plan.users);
            } else {
                this.selectPlan(this.plans[0].users);
            }
        }

        selectPlan(userCount) {
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

        enterSubCode() {
            if (this.subscriptionCode.length > 0) {
                this.http.post(this.API_PREFIX + "organizations/" + this.organizationSlug + "/subscription/code", { code: this.subscriptionCode }).then((result) => {
                    if (result.status === 200) {
                        this.subscriptionCode = '';
                        this.subscriptionCodeStatus = result.data['status'];
                        this.subscription = result.data['subscription']; 
                    }
                });
            }
        }
    }
}