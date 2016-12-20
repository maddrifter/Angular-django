/// <reference path='../_all.ts' />

module scrumdo {

    export class AccountManager {
        public static $inject: Array<string> = [
            "$resource",
            "API_PREFIX",
            "$http"];

        private User: ng.resource.IResourceClass<any>;
        private EmailInfo: ng.resource.IResourceClass<any>;
        private OAuthApp: ng.resource.IResourceClass<any>;
        private OAuthToken: ng.resource.IResourceClass<any>;
        private OpenID: ng.resource.IResourceClass<any>;
        private GithubAccount: ng.resource.IResourceClass<any>;

        constructor(public resource: ng.resource.IResourceService,
            public API_PREFIX: string,
            public http: ng.IHttpService) {

            this.User = this.resource(API_PREFIX + "account/me", {}, {
                save: {
                    method: 'PUT'
                }
            });

            this.EmailInfo = this.resource(API_PREFIX + "account/email");
            this.OAuthApp = this.resource(API_PREFIX + "account/OAuthApp");
            this.OAuthToken = this.resource(API_PREFIX + "account/OAuthToken");
            this.OpenID = this.resource(API_PREFIX + "account/OpenID");
            this.GithubAccount = this.resource(API_PREFIX + "account/github", {}, {
                query: {
                    method: 'GET',
                    is_array: false
                },
                delete: {
                    method: 'DELETE'
                }
            });
        }
        // API call to get general user information
        loadUser() {
            return this.User.get();
        }

        saveSubscriptions(subscriptions) {
            return this.http.put(this.API_PREFIX + "account/email_subscriptions", subscriptions);
        }

        saveUser(user) {
            return user.$save();
        }
        
        // API call to get email information
        loadUserEmail() {
            return this.EmailInfo.get();
        }

        resetAvatar() {
            return this.http.post(this.API_PREFIX + "account/deleteavatar/avatar", {});
        }

        saveName(first: string, last: string) {
            return this.http.post(this.API_PREFIX + "account/", { first: first, last: last });
        }
        
        // API call to update & confirm email 
        updateEmail(emailAddress: string) {
            return this.http.post(this.API_PREFIX + "account/changeemail/email", { email: emailAddress });
        }
        
        // API call to confirm email
        confirmEmail(emailAddress: string) {
            this.http.post(this.API_PREFIX + "account/confirmemail/email", { email: emailAddress })
                .success
        }

        changePassword(oldpassword: string, password1: string, password2: string) {
            return this.http.post(this.API_PREFIX + "account/getpassword", {
                oldpassword: oldpassword,
                password1: password1,
                password2: password2
            });
        }
        
        // API call to delete account
        deleteAccount(password: string) {
            return this.http.post(this.API_PREFIX + "account/deleteaccount", { password: password });
        }
        
        //###############################################################
        //############################################################### 
        //    ## functions associated with api.html page ##	
        //###############################################################
        //###############################################################
        
        // Get registered OAuth Tokens
        getOAuthToken() {
            return this.OAuthToken.query();
        }
        
        // Get registered OAuth Apps
        getOAuthApp() {
            return this.OAuthApp.query();
        }

        getGithubAccounts() {
            return this.GithubAccount.query();
        }
        
        // API call to revoke OAuth Token
        revokeOAuthToken(key: string) {
            return this.http.post(this.API_PREFIX + "account/revokeOAuthToken", { key: key });
        }
        
        // API call to add OAuth App
        addOAuthApp(appName: string, appDescription: string) {
            return this.http.post(this.API_PREFIX + "account/addOAuthApp", {
                name: appName,
                description: appDescription
            });
        }
        
        //###############################################################
        //############################################################### 
        //      ## functions associated with openID.html page ##	
        //###############################################################
        //###############################################################
        
        // Get OpenID associated with user
        getOpenID() {
            return this.OpenID.query();
        } 
        
        // API call to remove openID association
        removeOpenIDAssociation(openid: string) {
            return this.http.post(this.API_PREFIX + "account/OpenID", { openid: openid });
        }

        removeGithubAssociation() {
            return this.GithubAccount.delete();
        }
    }
}