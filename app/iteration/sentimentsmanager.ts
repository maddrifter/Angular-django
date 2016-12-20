/// <reference path='../_all.ts' />

module scrumdo {

    export interface Sentiment{
        id: number;
        creator?: {username:string, first_name:string, last_name:string};
        iteration?: {name:string, id:number};
        number: number;
        reason: string;
        date?: string;
    }

    export class SentimentsManager {
        public static $inject: Array<string> = [
            "$rootScope",
            "$resource",
            "API_PREFIX",
            "$q",
            "organizationSlug"
        ];

        private sentiments: {};
        private teamSentiments: {};
        private Sentiments: ng.resource.IResourceClass<any>;
        private TeamSentiments: ng.resource.IResourceClass<any>;

        constructor(
            private rootScope,
            private resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            private q: ng.IQService,
            private organizationSlug:string) {

            this.sentiments = {};
            this.teamSentiments = {};

            this.rootScope.$on("DATA:ADD:SENTIMENT", this.reloadSentiments);

            this.Sentiments = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:id/sentiments/:sentiment_id", {},
                {
                get: {
                    method: 'GET'
                },
                query: {
                    method: 'GET',
                    isArray: true
                }
            }); 

            this.TeamSentiments = this.resource(API_PREFIX + "organizations/:organizationSlug/projects/:projectSlug/iterations/:id/sentiments/team/:teamSlug", {},
                {
                query: {
                    method: 'GET',
                    isArray: true
                },
                create: {
                    method: 'POST',
                    params: {
                        organizationSlug: "organizationSlug",
                        projectSlug: "projectSlug"
                    }
                },
            });
        }

        reloadSentiments = (event, data) => {
            var payload = data.payload;
            if(payload.old_id){
                this.removeOldEntry(payload.old_id, payload.team);
            }
            var s = _.find(this.sentiments[payload.team], (s:any) => s.id == payload.id);
            if(s == null){
                this.loadSentiment(this.organizationSlug, payload.project, payload.iteration_id, payload.id).then((sentiment) => {
                    this.sentiments[payload.team].push(sentiment);
                    this.rootScope.$broadcast("sentimet_added", sentiment);
                });
            }
            
        }

        loadSentiment(organizationSlug:string, projectSlug:string, iterationId:number, id:number){
            return this.Sentiments.get({organizationSlug:organizationSlug, projectSlug:projectSlug, id:iterationId, sentiment_id:id}).$promise;
        }

        loadTeamSentiments(organizationSlug:string, projectSlug:string, iterationId:number, teamSlug:string, reload:boolean = true){
            var p = this.TeamSentiments.query({organizationSlug:organizationSlug, projectSlug:projectSlug, id:iterationId, teamSlug:teamSlug}).$promise;
            let key = `${organizationSlug}:${projectSlug}:${iterationId}:${teamSlug}`;
            p.then((data) => {
                if(key in this.teamSentiments && reload == false){
                    return this.teamSentiments[key];
                }
                this.sentiments[teamSlug] = data;
            });
            this.teamSentiments[key] = p;
            return p;
        }

        createSentiment(organizationSlug:string, projectSlug:string, iterationId:number, teamSlug:string, properties:Sentiment){
            var sentiment = new this.TeamSentiments();
            _.extend(sentiment, properties);
            if ("id" in sentiment) {
                delete sentiment.id;
            }
            var p = sentiment.$create({ projectSlug: projectSlug, organizationSlug: organizationSlug, id:iterationId, teamSlug:teamSlug });
            p.then((data) => {
                if(data.old_id != 0){
                    this.removeOldEntry(data.old_id, teamSlug);
                }
                this.sentiments[teamSlug].push(data.sentiment);
                this.rootScope.$broadcast("sentimet_added", data.sentiment);
            });
            return p;
        }

        private removeOldEntry(id, teamSlug){
            var s = _.find(this.sentiments[teamSlug], (s:any) => s.id == id);
            if(s != null){
               this.sentiments[teamSlug].splice(_.indexOf(this.sentiments[teamSlug], s), 1);
            }
        }
    }

}