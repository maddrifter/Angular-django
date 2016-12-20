/// <reference path='../_all.ts' />


class URLRewriter {
    constructor(public baseUrl) {

    }

    rewriteAppUrl(url) {
        return this.baseUrl + "app/" + url;
    }
}
