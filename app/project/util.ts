module scrumdo {

    /**
     * Takes a flat list of projects and returns a new list that is grouped by category.
     *
     * TODO: This unreadable mess of code was generated from the old very readable coffeescript and should
     *       be rewritten to be more understandable.
     *
     * @param projects
     * @returns {T[]}
     */
    export function projectsByCategory(projects) {
        var k,v;

        return _.sortBy((function () {
            var _ref, _results;
            _ref = _.groupBy(projects, (p:Project) => p.category);
            _results = [];
            for (k in _ref) {
                v = _ref[k];
                _results.push(v);
            }
            return _results;
        }).call(this), (g) => g[0].category);
    }

    export function projectByPortfolio(projects:Array<MiniProjectList>){
        var result = [];
        var Portfolio = {};
        var NonPortfolio = {};
        for(var index in projects){
            var project = projects[index];
            var pSlug = project.portfolioSlug;
            if(pSlug != null){
                var portfolio = _.find(projects, (p) => p.slug == pSlug);
                if(portfolio != null){
                    if(!(portfolio.slug in Portfolio)){
                        //Portfolio[portfolio.slug] = {};
                        Portfolio[portfolio.slug] = [portfolio, project];
                    }else{
                        Portfolio[portfolio.slug].push(project);
                    }
                }
            }else if(project.isPortfolio == false){
                if(!('projects' in NonPortfolio)){
                    NonPortfolio['projects'] = {};
                    NonPortfolio['projects'] = [project];
                }else{
                    NonPortfolio['projects'].push(project);
                }
            }
        }
        sortPortfolioPrpjects(Portfolio);

        NonPortfolio['projects'] = _.groupBy(NonPortfolio['projects'], (p:Project) => p.category)
        result['portfolio'] = Portfolio;
        result['nonportfolio'] = NonPortfolio;

        return result;
    }

    export function sortPortfolioPrpjects(portfolios){
        for(var k in portfolios){
            portfolios[k].sort(sort_by('portfolioLevel', {
                name: 'name'
            }));
        }
    }

    export function projectByPortfolioV2(projects:Array<Project>){
        var result = [];
        var Portfolio = {};
        var NonPortfolio = {};
        for(var index in projects){
            var project = projects[index];
            if(project.id!=null){
                var pSlug = project.portfolio_slug;
                if(pSlug != null){
                    var portfolio = _.find(projects, (p) => p.slug == pSlug);
                    if(portfolio != null){
                        if(!(portfolio.slug in Portfolio)){
                            Portfolio[portfolio.slug] = [portfolio, project];
                        }else{
                            Portfolio[portfolio.slug].push(project);
                        }
                    }
                }else if(project.project_type !== 2){
                    if(!('projects' in NonPortfolio)){
                        NonPortfolio['projects'] = {};
                        NonPortfolio['projects'] = [project];
                    }else{
                        NonPortfolio['projects'].push(project);
                    }
                }
            }
        }
        sortPortfolioPrpjectsV2(Portfolio);

        NonPortfolio['projects'] = _.groupBy(NonPortfolio['projects'], (p:Project) => p.category)
        result['portfolio'] = Portfolio;
        result['nonportfolio'] = NonPortfolio;

        return result;
    }

    function sortPortfolioPrpjectsV2(portfolios){
        for(var k in portfolios){
            portfolios[k].sort(sort_by(
                {'name':'project_type', reverse:true},
                'portfolio_level_id'
            ));
        }
    }
}