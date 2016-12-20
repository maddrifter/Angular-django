# Installation Instructions

We're using grunt.js (http://gruntjs.com/) to do all the coffescript compilation, SASS processing, 
minification, and combination of files.  These steps should get everything running for you:


Install compass
> sudo gem update --system  
> sudo gem install compass

Install Node JS (assuming you have homebrew installed)
> brew install node

If you previously had grunt or bower, let's clean up
> sudo npm uninstall -g grunt  
> sudo npm uninstall -g bower

Install Bower
> sudo npm install -g bower


Install Grunt JS
> npm install -g grunt-cli

Add grunt to your PATH
-- /usr/local/share/npm/lib/node_modules/grunt-cli/bin/

Go into scrumdo_web/static

Install the projet dependencies
> npm install


# Using grunt.js

Go into scrumdo_web/static

Run this to do a full once-over production compile:
> grunt

Run this while you're developing.  It will watch for files being changed and automatically 
do it's thing. Also, it will make a click noise after it's done so you know it's safe to reload the page:
> grunt watch

# Files/Directories of note

The grunt config file we're using:
> Gruntfile.js

Where all the typescript files go
> app

Here's where our styling info goes:  http://sass-lang.com/ http://compass-style.org/ 
> sass

Grunt compiles things to these folders.  They do not go into source control.
> generated_css  
> generated_js

Where css goes (don't put new things in here, use sass instead)
> css

Raw authored javascript goes here. (Don't put new stuff in, use typescript instead)
> javascript
> js

# Developing Tips

Set this in your local settings:
TEMPLATE_DEBUG = True

If you look in base.html, you'll see that var is checked for which css/js files to include like so:

	    {% ifsetting TEMPLATE_DEBUG %}
	        <!-- These are compiled into scrumdocoffee.min.js by grunt.js -->
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/scrumdoglobals.js"></script>    
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/scrumdotemplates.js"></script>
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/scrumdomodels.js"></script>
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/taskviews.js"></script>
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/commentviews.js"></script>    
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/sidebar.js"></script>            
	    {% else %}
	        <!-- BEGIN PRODUCTION MODE -->
	        <script type="text/javascript" src="{{ STATIC_URL }}generated_js/scrumdocoffee.min.js"></script>  
	    {% endifsetting %}


In Chrome, click the cog icon in the developer tools and turn "Enable source maps" on.  That will let you debug typescript instead of generated javascript.  **this doesn't always work, lately I've just been debugging the compiled javascript**

The SASS/Compass compile can take a few seconds.  
