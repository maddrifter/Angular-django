/// <reference path='../_all.ts' />

var SCRUMDO_BRIGHT_COLORS, SCRUMDO_COLOR_PALETTE;

SCRUMDO_COLOR_PALETTE = [["747E89", "F5F5F5", "6C8FB4", "3898DB", "34CC73", "BF392B", "9A59B5", "E57E24", "23BC9C", "F5764E"], ["777777", "444444", "1F1581", "448cca", "0D7D5B", "A60D05", "818B16", "8dc73e", "FFC54A", "ff7f0e"], ["f2f2f2", "7f7f7f", "ddd9c3", "c6d9f0", "dbe5f1", "f2dcdb", "ebf1dd", "e5e0ec", "dbeef3", "fdeada"], ["FFFFFF"]];
SCRUMDO_BRIGHT_COLORS = ["3898DB", "34CC73", "BF392B", "9A59B5", "E57E24", "23BC9C", "F5764E", "1F1581", "448cca", "0D7D5B", "A60D05", "818B16", "8dc73e", "FFC54A", "ff7f0e"];

var trace: Function = function (...vars) { };

if (window.location.hostname.indexOf("app.scrumdo.com") === -1) {
    // Only enable trace support if we are not on app.scrumdo.com
    if (typeof console === "object" && typeof console.log === "function") {
        trace = function (...vars) {
            return vars.map((msg) => console.log(msg));
        }
    } else {
        trace = function (...vars) { }
    }
}



/**
 * Pad a string or number to a given width.
 * @param n num/string to pad
 * @param width how long?
 * @param chr What character to use?
 * @returns {string}
 */
function pad(n, width: number, chr = "0"): string {
    var r: string = n + "";
    if (r.length >= width) {
        return r;
    } else {
        return new Array(width - r.length + 1).join(chr) + n;
    }
}

/**
 * Convert a hex color string to a decimal value.
 * @param hex
 * @returns {number}
 */
function hexColorToInt(hex: string): number {
    return parseInt(hex.replace("#", ""), 16);
}

/**
 * Convert a decimal color value to a hex string.
 * @param colorInt
 * @returns {string}
 */
function colorToHex(colorInt: number): string {
    return pad(colorInt.toString(16), 6);
}

/**
 * For a given color C, return a good label color to show over it based on color brightness.
 * @param c
 * @returns {string}
 */
function getLabelColor(c: number): string {
    var B, G, R, brightness, labelColor;
    R = (c & 0xff0000) >> 16;
    G = (c & 0x00ff00) >> 8;
    B = c & 0x0000ff;
    brightness = 0.299 * R + 0.587 * G + 0.114 * B;
    if (brightness < 170) {
        return "#ffffff";
    } else {
        return "#333333";
    }
}

/**
 * Returns true if the color passed in is considered a "light" color.
 * @param rgb
 * @returns {boolean}
 */
function isLightColor(rgb: number): boolean {
    // Pass a decimal color
    var b, g, luma, r;
    r = (rgb >> 16) & 0xff;  // extract red
    g = (rgb >> 8) & 0xff;  // extract green
    b = (rgb >> 0) & 0xff;  // extract blue

    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;  // per ITU-R BT.709
    return luma > 200;
}

/**
 * Given hours and minutes, tell us how many minutes it equals.  Useful for transforming user
 * input into a usable value as it can detect missing values.
 * @param hoursStr
 * @param minutesStr
 * @returns {any}
 */
function minutesHoursToMinutes(hoursStr: string | number, minutesStr: string | number): number {
    var hours, minutes;
    hours = Number(hoursStr);
    if (isNaN(hours)) {
        hours = 0;
    }
    minutes = Number(minutesStr);
    if (isNaN(minutes)) {
        minutes = 0;
    }
    return hours * 60 + minutes;
}

/**
 * Generate an hours/minutes array useful for display.
 * @param minutes
 * @returns [hours:number, minutes:number]
 */
function minutesToHoursMinutes(minutes) {
    var hours;
    hours = Math.floor(minutes / 60);
    minutes = minutes - (hours * 60);
    return [hours, minutes];
}

function minutesToLabel(minutes) {
    var hm;
    if ((minutes == null) || minutes === 0) {
        return "";
    }
    hm = minutesToHoursMinutes(minutes);
    if (hm[0] === 0) {
        return hm[1] + " minutes";
    }
    if (hm[1] === 0) {
        return hm[0] + " hours";
    }
    return hm[0] + "h:" + hm[1] + "m";
}

function reduceTasks(tasks) {
    var i, rv;
    rv = [];
    i = 1;
    tasks.forEach((task) => {
        if ((task != null) && task !== "") {
            rv.push({
                id: i,
                name: task
            });
        }
        return i += 1;
    });
    return rv;
}

function createSlug(str) {
    var slug, trimmed;
    slug = "";
    trimmed = $.trim(str);
    slug = trimmed.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return slug.toLowerCase();
}

function createFilename(str) {
    var slug, trimmed;
    slug = "";
    trimmed = $.trim(str);
    slug = trimmed.replace(/[^a-z0-9-]/gi, "_").replace(/-+/g, "_").replace(/^-|-$/g, "");
    return slug.toLowerCase();
}

function removeById(list, id) {
    var element, index;
    element = _.findWhere(list, {
        id: id
    });
    if (element == null) {
        return;
    }
    index = list.indexOf(element);
    list.splice(index, 1);
    return list;
}

function toIntWithEmpty(str) {
    if (str === "") {
        return 0;
    }
    try {
        return parseInt(str);
    } catch (_error) {
        return 0;
    }
}

// Transforms the points list entry from a project to one a sd-select can use
// Used by the addStory and storyEditWindow controllers.
function transformPoints(val) {
    var c;
    c = parseFloat(val[1]);
    if (isNaN(c)) {
        return [val[0], val[1], val[1] + " Points"];
    } else {
        return [val[0], val[1], c + " Point" + (c !== 1 ? "s" : "")];
    }
}

function calculateValueOverTime_withRules(card) {
    var numerator = card.business_value;
    var denominator = card.estimated_minutes / 60;
    if (card.estimated_minutes === 'Infinite') {
        denominator = +'Inf';
    }
    if (card.estimated_minutes === '?') {
        denominator = null;
    }
    if (card.business_value === 'Infinite') {
        numerator = +'Inf';
    }
    if (card.business_value === '?') {
        numerator = null;
    }
    return sortWithRule(numerator, denominator);
}

function calculateValueOverTime(card) {
    var numerator = card.business_value;
    var denominator = card.estimated_minutes / 60;
    if (card.estimated_minutes === 'Infinite') {
        denominator = +'Inf';
    }
    if (card.estimated_minutes === '?') {
        denominator = null;
    }
    if (card.business_value === 'Infinite') {
        numerator = +'Inf';
    }
    if (card.business_value === '?') {
        numerator = null;
    }
    return sortingValue(numerator, denominator);
}

function calculateValueOverPoints_withRules(card) {
    var numerator = card.business_value;
    var denominator = card.points_value
    if (card.points === 'Infinite') {
        denominator = 'Inf';
    }
    if (card.points === '?') {
        denominator = null;
    }
    if (card.business_value === 'Infinite') {
        numerator = +'Inf';
    }
    if (card.business_value === '?') {
        numerator = null;
    }
    return sortWithRule(numerator, denominator);
}

function calculateValueOverPoints(card) {
    var numerator = card.business_value;
    var denominator = card.points_value
    if (card.points === 'Infinite') {
        denominator = 'Inf';
    }
    if (card.points === '?') {
        denominator = null;
    }
    if (card.business_value === 'Infinite') {
        numerator = +'Inf';
    }
    if (card.business_value === '?') {
        numerator = null;
    }
    return sortingValue(numerator, denominator);
}

function sortWithRule(numerator, denominator) {
    var rule1 = 1;//An infinite numerator goes at the top - multiple infinite values are ordered by the denominator
    var rule2 = 2;//A 0 denominator goes next - multiple 0's are ordered reverse by the denominator
    var rule3 = 3;//Normal numeric values go next, sorted by the mathematical expression n/d -
    var rule4 = 4;// for 0 numerators, sort by the denominator
    var rule5 = 5;//An infinite denominator with a numeric numerator goes next, sorted by the numerator
    var rule6 = 6;//A null numerator goes next, secondarily sorted by denominator
    var rule7 = 7;//A null denominator goes next, secondarily sorted by numerator
    var rule8 = 8;//null/null are at the end
    if (numerator === "Inf") {
        return (rule1);
    }
    else if (denominator === 0 && numerator != null) {
        return (rule2);
    }
    else if ($.isNumeric(numerator) && $.isNumeric(denominator) && numerator != 0 && denominator != 0 ) {
        return (rule3);
    }
    else if (numerator === 0 && denominator != null) {
        return (rule4);
    }
    else if (denominator === "Inf" && numerator != null) {
        return (rule5);
    }
    else if (numerator === null && denominator != null) {
        return (rule6);
    }
    else if (denominator === null && numerator != null) {
        return (rule7);
    }
    else if (numerator === null && denominator === null) {
        return (rule8);
    }
}
function sortingValue(numerator, denominator) {
    if (numerator === "Inf") {
        return (denominator);
    }
    else if (denominator === 0 && numerator != null) {
        return (-numerator);
    }
    else if ($.isNumeric(numerator) && $.isNumeric(denominator) && numerator != 0 && denominator != 0 ) {
        return (-(numerator / denominator).toFixed(2));
    }
    else if (numerator === 0 && denominator != null) {
        return (denominator);
    }
    else if (denominator === "Inf" && numerator != null) {
        return (numerator);
    }
    else if (numerator === null && denominator != null) {
        if (denominator == "Inf")
            return (Infinity)
        else
            return (denominator);

    }
    else if (denominator === null && numerator != null) {
        return (-(numerator).toFixed(2));
    }
    else if (numerator === null && denominator === null) {
        return (0);
    }
}


function calculateWSJFValue(card) {
    if (card.wsjf_value === "Inf") {
        return 0;
    }
    return -1 * parseFloat(card.wsjf_value);
}

function countWatchers() {
    var root, watchers, watchersWithoutDuplicates;
    root = angular.element(document.getElementsByTagName("body"));
    watchers = [];

    function f(element) {
        angular.forEach(["$scope", "$isolateScope"], (scopeProperty) => {
            if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                angular.forEach(element.data()[scopeProperty].$$watchers, (watcher) => {
                    watchers.push(watcher);
                });
            }
        });
        angular.forEach(element.children(), (childElement) => {
            f(angular.element(childElement));
        });
    }

    f(root);
    // Remove duplicate watchers
    watchersWithoutDuplicates = [];
    angular.forEach(watchers, (item) => {
        if (watchersWithoutDuplicates.indexOf(item) < 0) {
            watchersWithoutDuplicates.push(item);
        }
    });
    console.log(watchersWithoutDuplicates.length);
}

function projectSharedKey(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function isMobileDevice() :boolean{
    trace(navigator.userAgent)
    if( /Android|webOS|iPhone|iPod|BlackBerry|BB10|PlayBook|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        if(window.innerHeight > window.innerWidth){
            // portrait mode
            if(window.innerWidth > 767){
                return false;
            }
        }else{
            // landscape mode
            if(window.innerWidth > 1023){
                return false;
            }
        }
        trace("!!!***Mobile Device Detected***!!!")
        return true;
    }
    return false;
}

var sort_by;
(function() {
    // utility functions
    var default_cmp = (a, b) => {
        a = a != null && typeof a === 'string' ? a.toLowerCase() : a;
        b = b != null && typeof b === 'string' ? b.toLowerCase() : b;
        if (a == b) return 0;
        return a < b ? -1 : 1;
    },
        getCmpFunc = (primer, reverse) => {
            var cmp = default_cmp;
            if (primer) {
                cmp = (a, b) => {
                    return default_cmp(primer(a), primer(b));
                };
            }
            if (reverse) {
                return (a, b) => {
                    return -1 * cmp(a, b);
                };
            }
            return cmp;
        };

    // actual implementation
    sort_by = function() {
        var fields = [],
            n_fields = arguments.length,
            field, name, reverse, cmp;

        // preprocess sorting options
        for (var i = 0; i < n_fields; i++) {
            field = arguments[i];
            if (typeof field === 'string') {
                name = field;
                cmp = default_cmp;
            }
            else {
                name = field.name;
                cmp = getCmpFunc(field.primer, field.reverse);
            }
            fields.push({
                name: name,
                cmp: cmp
            });
        }

        return (A, B) => {
            var a, b, name, cmp, result;
            for (var i = 0, l = n_fields; i < l; i++) {
                result = 0;
                field = fields[i];
                name = field.name;
                cmp = field.cmp;

                result = cmp(A[name], B[name]);
                if (result !== 0) break;
            }
            return result;
        }
    }
}());
