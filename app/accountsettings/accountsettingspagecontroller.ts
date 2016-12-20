/// <reference path='../_all.ts' />

module scrumdo {
    interface AccountScope extends ng.IScope {
        user: any,
        userEmail: any,
        application: any,
        token:any,
        openIDs:any,
        uploader:any,
        ctrl:any
    }

    export class AccountSettingsPageController {
        public static $inject: Array<string> = [
            "$scope",
            "$timeout",
            "$sce",
            "accountManager",
            "FileUploader",
            "$cookies"];

        public avatarVersion: number;
        public deleteAccountPassword: string;
        public uploader = new this.FileUploader({
            headers: {
                'X-CSRFToken': this.cookies.get('csrftoken')
            }
        });

        public github;
        public showEmailUpdateForm: boolean;
        public showPasswordForm: boolean;
        public authenticateDelete: boolean;
        public displayAllAvatars: boolean;
        public showAvatarButtons: boolean;
        public isMatch: boolean;
        public showOAuthApps: boolean;
        
        public oldPass:string;
        public newPass1:string;
        public newPass2:string;
        public passwordResult:any;
        public deleteResult:any;
        public newAppName:string;
        public newAppDescription:string;

        constructor(
            public scope: AccountScope,
            public timeout: ng.ITimeoutService,
            public sce: ng.ISCEService,
            public accountManager: scrumdo.AccountManager,
            public FileUploader,
            public cookies: ng.cookies.ICookiesService) {

            this.avatarVersion = _.random(0, 100000);
            this.deleteAccountPassword = '';
            this.scope.uploader = this.uploader;
            this.scope.uploader.queueLimit = 1;
            this.scope.uploader.autoUpload = true;
            this.scope.uploader.removeAfterUpload = true;
            this.scope.uploader.url = "/api/v2/account/defaultavatar/avatar";
            this.scope.uploader.onCompleteAll = this.updateAvatar;
                
            // API calls to get user info ##
            this.scope.user = this.accountManager.loadUser();
            this.scope.userEmail = this.accountManager.loadUserEmail();
                
            // API calls to get user info ##
            this.scope.application = this.accountManager.getOAuthApp();
            this.scope.token = this.accountManager.getOAuthToken();
            this.scope.openIDs = this.accountManager.getOpenID();
            this.loadGithub();
                
            // initialize variables that manage template views in details.html##
            this.showEmailUpdateForm = false;
            this.showPasswordForm = false;
            this.authenticateDelete = false;
            this.displayAllAvatars = true;
            this.showAvatarButtons = false;
            this.isMatch = true;

            // initialize variables that manage template views in api.html##
            this.showOAuthApps = false;
            this.scope.ctrl = this;
        }

        resetAvatar() {
            this.accountManager.resetAvatar().then(this.updateAvatar);
        }

        updateAvatar = () => {
            trace("Avatar Updated")
            this.timeout(() => {
                this.avatarVersion += 1;
            }, 2000);
        }

        loadGithub = () => {
            this.accountManager.getGithubAccounts().$promise.then((r) => {
                this.github = r;
            });
        }

        saveSubscriptions(form) {
            this.accountManager.saveSubscriptions(this.scope.user.subscriptions).then(() => {
                form.$setPristine();
            });
        }

        saveName(form) {
            this.accountManager.saveUser(this.scope.user).then(() => {
                form.$setPristine();
            });
        }
        
        // function to change email and send confirmation to that email address
        updateEmail(form){
            this.accountManager.updateEmail(this.scope.userEmail.email).then(() => {
                form.$setPristine();
            });
            this.scope.userEmail.verified = false;
        }
        
        // function to re-send confirmation to that email address
        confirmEmail(email){
            this.accountManager.confirmEmail(email);
        }
        
        // function to change password
        changePassword(){
            this.isMatch = true;
            if(this.newPass1 != this.newPass2){ 
                this.isMatch = false;
                return;
            }
            
            if(this.newPass1 == this.newPass2){
                this.passwordResult = '';
                this.accountManager.changePassword(this.oldPass, this.newPass1, this.newPass2).then( (result) => {
                    this.passwordResult = result;
                    this.newPass1 = '';
                    this.newPass2 = '';
                    this.oldPass = '';
                });
            }
        }
        
        // function to delete account
        deleteAccount(){
            this.accountManager.deleteAccount(this.deleteAccountPassword).then( (result) => {
                this.deleteResult = result.data;
            });
            this.authenticateDelete = false;
            return;
        }
        
        //###############################################################
        //############################################################### 
        //    ## functions associated with api.html page ##	
        //###############################################################
        //###############################################################
        getOAuthApp = () => {
            this.scope.application = this.accountManager.getOAuthApp();
        }
        
        // Add new OAuthApp
        addOAuthApp(){
            this.accountManager.addOAuthApp(this.newAppName, this.newAppDescription).then(this.getOAuthApp);
        }
        
        revokeOAuthToken(key){
            this.accountManager.revokeOAuthToken(key).then( () => {
                this.scope.token = this.accountManager.getOAuthToken();
            });
            return;
        }
        
        //###############################################################
        //############################################################### 
        //      ## functions associated with openID.html page ##	
        //###############################################################
        //###############################################################
        // Get openID associations
        getOpenID = () => {
            this.scope.openIDs = this.accountManager.getOpenID();
        }
        
        removeGithubAssociation(){
            this.accountManager.removeGithubAssociation().$promise.then(this.loadGithub);
        }
        
        // Remove openID association
        removeOpenIDAssociation(id){
            this.accountManager.removeOpenIDAssociation(id).then(this.getOpenID);
        }
    }
}