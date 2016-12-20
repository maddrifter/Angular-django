/// <reference path='../_all.ts' />

module scrumdo {

    interface SentimentsScope extends ng.IScope{
        iteration: Iteration;
        team: Project;
        members: Array<User>;
        parent: Project;
    }

    export class TeamSentimentController {
        public static $inject:Array<string> = [
            '$scope',
            'organizationSlug',
            'projectSlug',
            'SentimentsManager',
            'userService'

        ];

        private sentiments: Array<Sentiment>;
        public sentiment: Sentiment;
        public loading: boolean;
        public numberOptions: Array<number>;
        public MembersVoted: Array<any>;

        constructor(
                public $scope:SentimentsScope,
                public organizationSlug:string,
                public projectSlug:string,
                private SentimentsManager:SentimentsManager,
                private userService: UserService
            ) {
                this.loading = true;
                this.sentiment = {id: -1, number: 1, reason: ""};
                this.numberOptions = [1,2,3,4,5];
                this.MembersVoted = [];
                this.loadsentiments();
                this.$scope['project'] = this.$scope.parent;

                this.$scope.$on("sentimet_added", this.updateMembers);
            
        }

        private loadsentiments(){
            this.SentimentsManager.loadTeamSentiments(this.organizationSlug, 
                                                    this.projectSlug, 
                                                    this.$scope.iteration.id, 
                                                    this.$scope.team.slug).then((result) => {
                    this.loading = false;
                    this.sentiments = result;
                    this.updateMembers();
            })
        }

        private updateMembers = () => {
            this.MembersVoted = _.map(this.sentiments, (s: Sentiment) => {
                return s.creator;
            });
        }

        public filterMembers = (member: User) => {
            if(!_.find(this.MembersVoted, (m:User) => m.username == member.username)){
                return true;
            }
            return false;
        }

        public enterKeyPressed(){
            this.SentimentsManager.createSentiment(this.organizationSlug, 
                                                    this.projectSlug, 
                                                    this.$scope.iteration.id, 
                                                    this.$scope.team.slug, this.sentiment).then(() => {
                                                        this.sentiment.number = 1;
                                                        this.sentiment.reason = "";
                                                    });
        }

    }
}