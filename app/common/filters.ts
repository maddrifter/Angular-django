/// <reference path='../_all.ts' />

module scrumdo {
    export var shortuser = (input) => {
        if ((typeof input === "undefined" || input === null) || (input.username == null)) {
            return "";
        }

        if ((input.first_name != null) && input.first_name !== "") {
            return input.first_name + " " + input.last_name;
        } else {
            return input.username;
        }
    }

    export var localtime = (input) => {
        return moment(input).format("lll");
    }
}

var mod: ng.IModule = angular.module("scrumdoFilters", []);

mod.filter('tooshortuser', () => {
    return (input) => {
        if ((typeof input === "undefined" || input === null) || (input.username == null)) {
            return "";
        }

        if ((input.first_name != null && input.first_name != "")) {
            return input.first_name;
        } else {
            return input.username;
        }
    }
});

mod.filter('words', () => {
    return (input, words) => {
        var inputWords;
        if (isNaN(words)) {
            return input;
        }
        if (words <= 0) {
            return '';
        }
        if (input) {
            inputWords = input.split(/\s+/);
            if (inputWords.length > words) {
                input = inputWords.slice(0, words).join(' ') + '…';
            }
        }
        return input;
    }
});


mod.filter('htmlToPlaintext', () => {
    return (text) => {
        if (typeof text === "undefined" || text === null) {
            return void 0;
        }
        return String(text).replace(/<\/[^>]+>/gm, ' ').replace(/<(?!br\s*?)[^>]+>/gm, '').replace(/<br\s*[\/]?>/gim, '\n');
    }
});


mod.filter('newlines', () => {
    return (text) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
            .replace(/\n/g, '<br/>');
    }
});

mod.filter("iterationToName", () => {
    return (iterationId, iterations) => {
        var iteration;
        iteration = _.findWhere(iterations, { id: iterationId });
        if (iteration != null) {
            return iteration.name;
        }
        return "";
    }
});

mod.filter("formatMinutes", () => {
    return (input) => {
        var hours, minutes, ref;
        ref = minutesToHoursMinutes(input), hours = ref[0], minutes = ref[1];
        return hours + ":" + (pad(minutes, 2));
    }
});

mod.filter("parentEpicToName", () => {
    return (epic, epics) => {
        try {
            epic = _.findWhere(epics, { id: epic.id });
            if (epic.parent_id == null) {
                return;
            }
            epic = _.findWhere(epics, { id: epic.parent_id });
            if (epic == null) {
                return "";
            }
            return "(#" + epic.number + " " + epic.summary + ")";
        } catch (error) {
            return "";
        }
    }
});

mod.filter("epicToName", () => {
    return (epic, epics) => {
        epic = _.findWhere(epics, { id: epic.id });
        if (epic == null) {
            return "";
        }
        return "#" + epic.number + " " + epic.summary;
    }
});

mod.filter("decimalToHexColor", () => {
    return (input) => {
        if (typeof input === "undefined" || input === null) {
            return "";
        } else if(typeof input == "string" && input.substr(0,1) == '#') {
            // If it's already in the right format, don't do anything.
            return input;
        }
        return "#" + (colorToHex(input));
    }
});


mod.filter('to_trusted', ['$sce', ($sce) => {
    return (text) => {
        return $sce.trustAsHtml(text);
    }
}]);

mod.filter("shortuser", () => {
    return scrumdo.shortuser;
});

mod.filter("longuser", ($sce) => {
    return (input) => {
        if ((typeof input === "undefined" || input === null) || (input.username == null)) {
            return "";
        }

        var em = input.email != null ? "&lt;" + input.email + "&gt;" : "";
        if ((input.first_name != null) && input.first_name !== "") {
            return $sce.trustAsHtml(input.first_name + " " + input.last_name + " @" + input.username + " " + em);
        } else {
            return $sce.trustAsHtml("@" + input.username + " " + em);
        }
    }
});

mod.filter("mediumuser", () => {
    return (input) => {
        if ((input == null) || (input.username == null)) {
            return "";
        }
        if ((input.first_name != null) && input.first_name !== "") {
            return input.first_name + " " + input.last_name + " @" + input.username;
        } else {
            return "@" + input.username;
        }
    }
});

mod.filter("ymddate", () => {
    return (input) => {
        return moment(input).format('YYYY-MM-DD');
    }
});

mod.filter("mdydate", () => {
    return (input) => {
        return moment(input).format('MM/DD/YYYY');
    }
});


mod.filter("localtime", () => {
    return scrumdo.localtime;
});

if (typeof Handlebars !== "undefined" && Handlebars !== null) {
    Handlebars.registerHelper('shortuser', function(user, options) {
        return scrumdo.shortuser(user);
    });
    Handlebars.registerHelper('localtime', function(date, options) {
        return scrumdo.localtime(date);
    });
    Handlebars.registerHelper('decimalToHexColor', function(color, options) {
        return "#" + (colorToHex(color));
    });
}



// This converts a single dimensional array
// into a two dimensional array based on a comparison function.
// We use it on the projects page to go from a flat project list,
// to one with alpha headers.
mod.filter("headerChunk", () => {
    return (orig, same, getChunkID) => {
        var cur, i, result;
        if (!(orig instanceof Array)) {
            return orig;
        }
        if (orig.length === 0) {
            return orig;
        }
        result = [];
        cur = [];
        i = 0;
        i = 0;
        while (i < orig.length) {
            if (i === 0 || same(orig[i], orig[i - 1])) {
                cur.push(orig[i]);
            } else {
                result.push({
                    id: getChunkID(orig[i - 1]),
                    items: cur
                });
                cur = [orig[i]];
            }
            i++;
        }
        result.push({
            id: getChunkID(orig[orig.length - 1]),
            items: cur
        });
        i = 0;
        while (i < result.length) {
            result[i].$$hashKey = i;
            i++;
        }
        return result;
    };
});


mod.filter("characters", () => {
    return (input, chars, breakOnWord) => {
        var lastspace;
        if (isNaN(chars)) {
            return input;
        }
        if (chars <= 0) {
            return "";
        }
        if (input && input.length > chars) {
            input = input.substring(0, chars);
            if (!breakOnWord) {
                lastspace = input.lastIndexOf(" ");
                if (lastspace !== -1) {
                    input = input.substr(0, lastspace);
                }
            } else {
                while (input.charAt(input.length - 1) === " ") {
                    input = input.substr(0, input.length - 1);
                }
            }
            return input + "…";
        }
        return input;
    }
});


mod.filter("splitcharacters", () => {
    return (input, chars) => {
        var postfix, prefix;
        if (isNaN(chars)) {
            return input;
        }
        if (chars <= 0) {
            return "";
        }
        if (input && input.length > chars) {
            prefix = input.substring(0, chars / 2);
            postfix = input.substring(input.length - chars / 2, input.length);
            return prefix + "..." + postfix;
        }
        return input;
    }
});


mod.filter("words", () => {
    return (input, words) => {
        var inputWords;
        if (isNaN(words)) {
            return input;
        }
        if (words <= 0) {
            return "";
        }
        if (input) {
             inputWords = input.split(/\s+/);
            if (inputWords.length > words) {
                input = inputWords.slice(0, words).join(" ") + "…";
            }
        }
        return input;
    }
});


mod.filter('shorttext', () => {
    return (value, wordwise, max, tail) => {
        if (!value) return;

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace - 1) == '.' || value.charAt(lastspace - 1) == ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});

mod.filter('hoursToTimeString', () => {
    return (hours) => {
        var seconds = Math.floor(hours * 3600);
        var hour = Math.floor((seconds % 86400) / 3600);
        var days = Math.floor(seconds / 86400);
        var timeString = '';
        if (days > 0) timeString += (days > 1) ? (days + " days ") : (days + " day ");
        if (hour > 0) timeString += (hour > 1) ? (hour + " hours ") : (hour + " hour ");
        if (days == 0 && hour == 0) timeString += "less than an hour";
        return timeString;
    }
});

mod.filter('hoursToDay', () => {
    return (hours) => {
        var seconds = Math.floor(hours * 3600);
        var hour = Math.floor((seconds % 86400) / 3600);
        var days = Math.floor(seconds / 86400);
        var timeString = '';
        if (days > 0) timeString += (days + "d ");
        if (hour > 0) timeString += (hour + "h");
        if (hour <= 0) timeString += ("0h");
        return timeString;
    }
});

mod.filter('startFrom', () => {
	return  (input, start) => {
		if (input) {
			start = +start;
			return input.slice(start);
		}
		return [];
	}
});

mod.filter('decodeHtmlEntities', () => {
    return (input) => {
        var txt = document.createElement("textarea");
        txt.innerHTML = input;
        return txt.value;
    }
});

mod.filter("prettytasktags", () => {
    return (value: string) => {
        if (!value) return;
        var tags: Array<string> = value.split(",");
        var html: string = "";
        for (var i in tags) {
            var tag = tags[i];
            html += "<span class='badges primary normal-view'>" + tag + "</span>";
        }
        return html;
    };
});

mod.filter('setDecimal', ($filter) => {
    return (input, places) => {
        if (isNaN(input)) return input;
        // If we want 1 decimal place, we want to mult/div by 10
        // If we want 2 decimal places, we want to mult/div by 100, etc
        // So use the following to create that factor
        var factor: any = "1" + Array(+(places > 0 && places + 1)).join("0");
        return Math.round(input * factor) / factor;
    };
});

mod.filter('orderProjectByCat', function() {
    return function(items, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {
            if(a[0]["category"] == null) return 1;
            return (a[0]["category"] > b[0]["category"] ? 1 : -1);
        });
        if(reverse) filtered.reverse();
        return filtered;
    };
});


mod.filter("pluralize", () => {
    return (input) => {
        if(input == null) return
        return pluralize(input)
    }
});