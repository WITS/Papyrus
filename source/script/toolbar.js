AppBar = function(json) {
	var json = json || {};
	var _this = this;

	if (json instanceof Element) {
		var elem = json;

		if (elem.getAttribute("data-z") == null) {
			var scrollY = document.body.scrollTop ||
				window.pageYOffset || window.scrollY || 0;
			elem.setAttribute("data-z", elem.hasClass("seam") ?
				0 : !elem.hasClass("waterfall") || scrollY ?
				2 : 0);
		}

		// var firstChild = elem.firstChild;
		// function insertElement(el) {
		// 	if (firstChild) {
		// 		elem.insertBefore(el, firstChild);
		// 	} else {
		// 		elem.appendChild(el);
		// 	}
		// }

		this.element = elem;
	} else {
		this.backgroundColor = json.backgroundColor ||
			json.bgColor || json.bg || "black";
		this.color = json.color || json.c || "white";
		this.icon = json.icon || json.navIcon || "menu";
		// ^ icon = false for no icon
		this.title = json.title || "Title";
		this.actions = json.actions || new Array();
		// ^ an array of IconButtons
		this.menu = json.menu || false;
		// ^ some papyrus menu object or false
	}

	if (this.element.hasClass("waterfall")) {
		window.addEventListener("scroll", function() {
			var scrollY = document.body.scrollTop ||
				window.pageYOffset || window.scrollY || 0;
			_this.element.setAttribute("data-z", scrollY ? 2 : 0);
		});
	}
}

PapyrusTabs = function(json) {
	var json = json || {};
	var _this = this;

	if (json instanceof Element) {
		var elem = json;

		this.hasInk = !elem.hasClass("no-ink");
		this.hasLightInk = elem.hasClass("light-ink");
		this.hasSlide = !elem.hasClass("no-slide");
		this.tabLength = elem.children.length;

		this.element = elem;
	} else {

	}

	// Set up tab container
	this.element.object = this;
	if (this.tabLength <= 5) {
		this.element.addClass("with-" + this.tabLength);
	}

	// Set up each tab
	for (var i = this.element.children.length; i --; ) {
		var elem = this.element.children[i];
		// TODO: handle icon
		// Make text span
		var span = document.createElement("span");
		span.appendTextNode(elem.innerText || elem.textContent);
		elem.empty();
		elem.appendChild(span);
		// Add index attribute
		elem.setAttribute("data-index", i);
		// Selected ?
		if (elem.hasClass("selected")) {
			_this.selected = elem;
		}
		// Ink ?
		if (_this.hasInk) {
			elem.addClass("ink");
			if (_this.hasLightInk) {
				elem.addClass("light-ink");
			}
		}
		// Add bar
		var bar = document.createElement("div");
		bar.addClass("bottom-bar");
		elem.appendChild(bar);
		// Add event
		elem.addEventListener("mouseup", function(event) {
			if (this == _this.selected) {
				// You're already selected, silly
				return;
			}
			_this.selectTab(this);
		}, false);
	}

	// None selected? Choose the first
	if (!this.selected) {
		this.selectTab(this.element.children[0]);
	}
	this.onchange();
}

PapyrusTabs.prototype.selectTab = function(tab) {
	if (typeof tab === 'string') var tab = document.querySelector(tab);
	// console.log(tab);
	var _this = this;
	var sel, bar1, bar2;
	if (this.selected && this.hasSlide) {
		sel = this.selected;
		bar1 = sel.children[sel.children.length -
			1 - !!this.hasInk];
		bar2 = tab.children[tab.children.length -
			1 - !!this.hasInk];
	}
	var selectNew = function() {
		var hasSelected = false;
		if (_this.selected) {
			_this.selected.removeClass("selected");
			hasSelected = true;
		}
		_this.selected = tab;
		tab.addClass("selected");
		if (!_this.hasSlide || !hasSelected) {
			return;
		}
		bar1.style.width = "";
		bar2.style.width = "";
		_this.onchange();
	}
	if (!this.hasSlide || !this.selected) {
		selectNew();
	} else {
		var tab_id = +tab.getAttribute("data-index");
		var sel_id = +sel.getAttribute("data-index");
		var start, end;
		if (tab_id > sel_id) {
			bar1.style.left = bar2.style.right = "0";
			bar1.style.right = bar2.style.left = "auto";
			start = tab_id;
			end = sel_id;
		} else {
			bar1.style.left = bar2.style.right = "auto";
			bar1.style.right = bar2.style.left = "0";
			start = sel_id;
			end = tab_id;
		}
		var par = this.element;
		var width = 0;
		for (var i = start; i >= end; -- i) {
			width += par.children[i].offsetWidth;
		}
		bar1.style.width = bar2.style.width = width + "px";
		setTimeout(selectNew, 100);
	}
}

// The default onchange event attempts to use data attributes to find the
// sheet-tabs to manipulate
PapyrusTabs.prototype.onchange = function() {
	var sheet_id = this.element.getAttribute("data-for");
	if (sheet_id == null) return false;
	var sheet_query = "*[data-tabs-id='" + sheet_id.replace(/'/g, "\\'") + "']";
	var sheet_elem = document.querySelector(sheet_query);
	if (sheet_elem == null) return false;
	// console.log(sheet_elem);
	var tab_id = +this.selected.getAttribute("data-index");
	var sheet_tabs = document.querySelectorAll(sheet_query + " > .sheet-tab");
	sheet_tabs.forEach(function(elem) {
		elem.removeClass("selected");
		elem.style.left = (-100 * tab_id) + "%";
	});
	var selected_sheet = document.querySelector(sheet_query +
		" > .sheet-tab:nth-of-type(" + (1 + tab_id) + ")");
	selected_sheet.addClass("selected");
	window.scrollTo(0, 0);
	// TODO: ACTUALLY MAKE THIS EASY TO REUSE
	// MAYBE DO THE COLUMNS STUFF BEFORE THAT THOUGH
}

PapyrusSnackbar = function() {
	this.queue = new Array();
	var elem = this.wrapper = document.createElement("div");
	elem.className = "snackbar-wrapper";

	elem = this.element = document.createElement("div");
	elem.className = "snackbar";
	elem.setAttribute("data-z", "2");
	this.wrapper.appendChild(elem);

	elem = this.action = document.createElement("div");
	elem.className = "action";
	this.element.appendChild(elem);

	elem = this.text = document.createElement("span");
	elem.className = "text";
	this.element.appendChild(elem);
}

PapyrusSnackbar.prototype.visible = false;
PapyrusSnackbar.prototype.timeout = -1;


PapyrusSnackbar.prototype.push = function(json) {
	this.queue.push(json);
	this.show();
}

PapyrusSnackbar.prototype.show = function() {
	// Hide the current message if visible
	if (this.visible) {
		this.hide();
	} else {
		// Show the first in the queue
		var first = this.queue[0];
		this.element.removeClass("action-pressed");
		this.text.empty();
		this.text.appendTextNode(first.text);
		this.action.empty();
		this.action.unbindEventListeners("mouseup");
		if (first.actionText) {
			this.action.appendTextNode(first.actionText);
			if (first.actionEvent) {
				this.action.addEventListener("mouseup", function() {
					first.actionEvent();
					PapyrusSnackbar.element.addClass("action-pressed");
					PapyrusSnackbar.hide();
				});
			}
		}
		this.element.removeClass("multiline");
		// console.log(this.element.offsetHeight);
		if (this.element.offsetHeight > 50) this.element.addClass("multiline");
		document.body.addClass("snackbar-visible");
		this.visible = true;
		this.timeout = setTimeout(function() {
			PapyrusSnackbar.hide();
		}, first.timeout || 2250);
	}
}

PapyrusSnackbar.prototype.hide = function() {
	if (this.timeout != -1) {
		if (this.visible) {
			this.visible = false;
			clearTimeout(this.timeout);
			document.body.removeClass("snackbar-visible");
			this.timeout = setTimeout(function() {
				PapyrusSnackbar.timeout = -1;
				PapyrusSnackbar.visible = false;
				PapyrusSnackbar.hide();
			}, 250);
		}
		return false;
	}
	// If there are more in the queue, show them
	this.queue.splice(0, 1);
	if (this.queue.length) this.show();
}

PapyrusSnackbar = new PapyrusSnackbar();