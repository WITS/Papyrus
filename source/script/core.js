/*
 * Core.js - adds new methods to Elements
 * and defines some useful "constants"
 * Copyright (C) 2015  Ian Jones
 */

Element.prototype.hasClass = function(className) {

	return (new RegExp("(\\b(?!-))" + className + "\\b(?!-)"
		).test(this.className));
}

Element.prototype.addClass = function(className) {

	if (!this.hasClass(className)) {
		this.className +=
			(this.className.length ? " " : "") +
			className;
	}
}

Element.prototype.appendTextNode = function(text) {
	var node = document.createTextNode(text);
	this.appendChild(node);
}

Element.prototype.removeClass = function(className) {

	this.className = this.className.replace(
		new RegExp("\\b(?!-)" + className + "\\b(?!-)", "g"),
			"").trim().replace(/\s{2,}/g, " ");
}

Element.prototype.toggleClass = function(className) {

	if (this.hasClass(className)) {
		this.removeClass(className);
	} else {
		this.addClass(className);
	}
}

function EventListenerInfo(arg) {
	this.type = arg[0];
	this.func = arg[1];
	this.capture = arg[2] || false;
}

Element.prototype._addEventListener =
	Element.prototype.addEventListener;

Element.prototype.addEventListener = function(type,
	func, capture) {
	// If events hasn't been initialized, initialize it
	if (!this.events) this.events = new Array();
	// Store the event listener so it can be
	// removed later
	this.events.push(new EventListenerInfo(arguments));
	// Call the client's native method
	this._addEventListener(type, func, capture);
}

Element.prototype.unbindEventListeners = function(type) {
	if (!this.events) return;
	var type = type || "";
	var i = this.events.length;
	while (i --) {
		var e = this.events[i];
		if (type != "" && type != e.type) continue;
		this.removeEventListener(e.type,
			e.func, e.capture);
		this.events.splice(i, 1);
	}
}

Element.prototype.empty = function() { // Removes all children
	while (this.firstChild) {
		if (this.firstChild instanceof Element) {
			// Remove child's children
			this.firstChild.empty();
			// Remove events
			this.firstChild.unbindEventListeners();
		}
		// Remove child node
		this.removeChild(this.firstChild);
	}
}

Element.prototype.remove = function() {
	this.unbindEventListeners();
	if (this.parentElement != null) {
		this.parentElement.removeChild(this);
	}
}

Element.prototype.getStyle = function(name) {
	return this.currentStyle ? this.currentStyle[name] :
     getComputedStyle(this, null)[name];
}

HTMLCollection.prototype.forEach =
NodeList.prototype.forEach = function(fn) {
	for (var i = this.length; i --; ) {
		fn(this[i]);
	}
}

IS_TOUCH_DEVICE = !!(('ontouchstart' in window) ||
	window.DocumentTouch && document instanceof DocumentTouch);
var userAgent = navigator.userAgent;
IS_MOBILE = /(iPhone|iPod|iPad|Android|BlackBerry)/i.test(userAgent);
IS_FIREFOX = (/\bfirefox\//i.test(userAgent) &&
	!/\bseamonkey\//i.test(userAgent));
IS_CHROME = (/\bchrome\//i.test(userAgent) &&
	!/\b(?:chromium|edge)\//i.test(userAgent));
IS_SAFARI = (/\bsafari\//i.test(userAgent) &&
	!/\b(?:chrome|chromium)\//i.test(userAgent));
IS_OPERA = (/\b(?:opera|opr)\//i.test(userAgent));
IS_WEBKIT = (IS_CHROME || IS_SAFARI || IS_OPERA);
IS_MSIE = (/\b(?:MSIE|Trident)\b/i.test(userAgent));
IS_MSIE_9 = (userAgent.indexOf("MSIE 9") != -1);
IS_EDGE = (userAgent.indexOf("Edge") != -1);

// Check HTML on load
window.addEventListener("load", function() {
	// Add classes to the body
	var userAgentList = ["touch-device", "mobile", "firefox", "chrome", "safari", "opera",
		"webkit", "msie", "msie-9", "edge"];
	for (var i = userAgentList.length; i --; ) {
		var className = userAgentList[i];
		if (window["IS_" + className.toUpperCase().replace(/-/g, '_')]) {
			document.body.addClass(className);
		}
	}

	// For the following section
	function toCamelCase(str) {
		return str.replace(/(?:^|\-)(\w)/g, function(match, p1) {
			return p1.toUpperCase();
		});
	}

	// Prototype-based Elements
	var proto_classes = ["papyrus-text", "app-bar",
		"papyrus-tabs", "papyrus-form"];
	var proto_str = proto_classes.join(",").replace(
		/(^|,)(\w)/g, "$1.$2");
	var proto_regex = new RegExp("(" +
		proto_classes.join("|") + ")");
	document.querySelectorAll(proto_str
		).forEach(function(elem) {
			var proto = elem.className.match(proto_regex)[0];
			new window[toCamelCase(proto)](elem);
	});

	// Tabs in AppBar
	document.querySelectorAll(".app-bar > .papyrus-tabs"
		).forEach(function(elem) {
			elem.parentElement.addClass("with-tabs");
	});

	// Regular buttons
	document.querySelectorAll(".papyrus-button, .papyrus-dropdown > li").forEach(
		function(elem) {
		elem.addClass("ink");
	});

	// Icon buttons
	document.querySelectorAll("i.papyrus-button," +
		".app-bar > i," +
		".papyrus-icon").forEach(
		function(elem) {
		elem.addClass("material-icons");
	});

	// Buttons with Icons
	document.querySelectorAll(".papyrus-button > i").forEach(
		function(elem) {
		elem.addClass("material-icons");
		elem.parentElement.addClass("with-icon");
	});

	// Dropdown button(s)
	document.querySelectorAll(".papyrus-dropdown-button").forEach(
		function(elem) {
		elem.addEventListener("mouseup", function(event) {
			// console.log(event.target);
			var delay = true;
			var btn;
			for (var el = event.target; true; el = el.parentElement) {
				if (el.tagName == "LI" || el.hasClass("papyrus-dropdown-button")) {
					delay = (el != elem);
					btn = el;
					break;
				}
				if (el == document.body) break;
			}
			setTimeout(function() {
				elem.toggleClass("expanded");
				var onaction = btn.getAttribute("onaction");
				if (onaction) eval(onaction);
			}, delay ? 250 : 1);
		});
	});

	// Floating action button(s)
	document.querySelectorAll(".papyrus-fab").forEach(
		function(elem) {
		elem.addClass("ink");
		if (!(elem.hasClass("expandable") && elem.hasClass("toggle"))) return;
		elem.addEventListener("mouseup", function(event) {
			// console.log(event.target);
			var delay = true;
			var fab;
			for (var el = event.target; true; el = el.parentElement) {
				if (el.hasClass("papyrus-fab")) {
					delay = (el != elem);
					fab = el;
					break;
				}
				if (el == document.body) break;
			}
			setTimeout(function() {
				elem.toggleClass("expanded");
				var onaction = fab.getAttribute("onaction");
				if (onaction) eval(onaction);
			}, delay ? 250 : 1);
		});
	});

	// Floating action button(s) icon(s)
	document.querySelectorAll(".papyrus-fab > i").forEach(
		function(elem) {
			elem.addClass("material-icons");
		});

	// Ink elements
	document.querySelectorAll(".ink").forEach(function(elem) {
		add_ink(elem, elem.hasClass("light-ink"));
	});

	// Dialog
	document.body.appendChild(PapyrusDialog.wrapper);

	// Add snackbar element(s)
	document.body.appendChild(PapyrusSnackbar.wrapper);

	// Page Overlay
	{
		var overlay = document.createElement("div");
		overlay.className = "papyrus-page-overlay";
		overlay.addEventListener("mouseup", function() {
			if (!PapyrusDialog.canDismiss) return;
			PapyrusDialog.hide();
		});
		document.body.appendChild(overlay);
	}

	// Fix icons on IE9
	try {
		document.querySelectorAll("i.material-icons"
			).forEach(function(elem) {
			if (elem.innerHTML[0] != "&") {
				var icon = elem.innerHTML;
				elem.innerHTML = "&#x" +
					MaterialIconIndex[icon].toUpperCase() + ";";
			}
		});
	} catch(e) {
		// Sorry, IE9. No icons for you
	}
});

EMAIL_REGEX = /(?:[a-z0-9!#$%&'\*\+\/=\?\^_`{|}~-]+(?:\.[a-z0-9!#$%&'\*\+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/