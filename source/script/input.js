// Text input

papyrus_text_id_count = 0;

PapyrusText = function(json) {
	var json = json || new Object();
	var elem;
	if (json instanceof Element) {
		elem = json;
		// var json = Object();
		this.id = elem.getAttribute("id") || "";
		this.type = elem.getAttribute("data-type") || "text";
		this.multiline = elem.hasClass("multiline");
		this.floating = elem.hasClass("floating");
		this.dark = elem.hasClass("dark");
		this.disabled = elem.hasClass("disabled");
		this.label = elem.getAttribute("data-label") || "";
		this.name = elem.getAttribute("data-name") || elem.getAttribute("data-label") || "";
		this.value = elem.getAttribute("data-init-value") || "";
		this.color = elem.style.color;
		this.fontSize = elem.style.fontSize;
		this.validate = (elem.getAttribute("data-validate") || "").split(", ");
		if (this.validate[0] == "") this.validate.splice(0);
		this.highlightRegex = elem.getAttribute("data-highlight-regex");
		if (this.highlightRegex) {
			var regex = new Regex(this.highlightRegex, "g");
			this.highlightRegex = new Array();
			this.highlightRegex.push(regex);
		} else {
			this.highlightRegex = new Array();
		}
		this.highlightClasses = elem.getAttribute("data-highlight-classes");
		if (this.highlightClasses) {
			var class1 = this.highlightClasses;
			this.highlightClasses = new Array();
			this.highlightClasses.push(class1);
		} else {
			this.highlightClasses = new Array();
		}
		this.counter = elem.getAttribute("data-counter") || "";
		if (this.counter.length) {
			this.counter = parseInt(this.counter);
		}
		this.bottom = !!(this.validate.length || this.counter || elem.hasClass("bottom"));
		if (this.bottom) elem.addClass("bottom");
	} else {
		this.id = json.id || "";
		this.type = json.type || "text";
		this.multiline = json.multiline || false;
		this.floating = json.floating || false;
		this.dark = json.dark || false;
		this.disabled = json.disabled || false;
		this.label = json.label || "";
		this.name = json.name || json.label || "";
		this.value = json.value || "";
		this.color = json.color || "";
		this.fontSize = json.fontSize || "";
		this.bottom = !!(json.error || json.counter || json.bottom);
		this.validate = json.validate || [];
		this.highlightRegex = json.highlightRegex || new Array();
		this.highlightClasses = json.highlightClasses || new Array();
		this.counter = json.counter || null;
		this.error = json.error || null;
		elem = document.createElement("div");
		elem.addClass("papyrus-text");
		if (this.multiline) {
			elem.addClass("multiline");
		}
		if (this.floating) {
			elem.addClass("floating");
		}
		if (this.dark) {
			elem.addClass("dark");
		}
		if (this.disabled) {
			elem.addClass("disabled");
		}
		elem.style.color = this.color;
		elem.setAttribute("data-label", this.label);
	}
	if (!this.id) this.id = "papyrus-text-" + (++papyrus_text_id_count);
	elem.setAttribute("rv-style", "input.style < color fontSize");
	elem.setAttribute("rv-class-floating", "input.floating");
	elem.setAttribute("rv-class-dark", "input.dark");
	elem.setAttribute("rv-class-disabled", "input.disabled");
	elem.object = this;
	this.element = elem;
	var input;
	if (!this.multiline) {
		input = document.createElement("input");
		input.type = this.type;
		if (!IS_MOBILE) {
			input.setAttribute("autocomplete", "off");
		}
		elem.appendChild(input);
	} else {
		input = document.createElement("textarea");
		elem.appendChild(input);
		var pre = document.createElement("pre");
		pre.setAttribute("rv-html", "input.value | highlight input.highlightRegex input.highlightClasses");
		elem.appendChild(pre);
	}
	if (this.disabled) {
		input.disabled = true;
	}
	if (this.name) {
		input.name = this.name;
	}
	input.id = this.id;
	input.setAttribute("rv-value", "input.value");
	input.setAttribute("rv-disabled", "input.disabled");
	var label = document.createElement("label");
	label.addClass("label");
	label.appendTextNode(this.label);
	label.setAttribute("for", this.id);
	label.setAttribute("rv-class-floating", "input.value");
	elem.appendChild(label);
	var bottom_edge = document.createElement("div");
	bottom_edge.addClass("bottom-edge");
	elem.appendChild(bottom_edge);
	var bottom_edge_highlight = document.createElement("div");
	bottom_edge_highlight.addClass("bottom-edge-highlight");
	bottom_edge.appendChild(bottom_edge_highlight);

	// Parse validation processes
	var validate = this.validate;
	this.validate = [];
	for (var i = validate.length; i --; ) {
		var v = validate[i].trim();
		// Regex?
		if (v[0] == "/") {
			var slash_index = v.search(/[^\\]\//, 1) + 1;
			var colon_index = v.indexOf(":", slash_index + 1);
			this.validate.push({
				type: "regex",
				object: new RegExp(v.substr(1, slash_index - 1),
					colon_index === -1 ? v.substr(slash_index + 1) :
					v.substr(slash_index + 1, colon_index - slash_index - 1)),
				text: colon_index !== -1 ? v.substr(colon_index + 1).trim() :
					"Invalid input"
			});
			console.log(this.validate[this.validate.length - 1]);
			continue;
		}
		// Predefined types
		var v_type = v.match(/^[a-zA-Z-_]+/);
		var val = null;
		if (v_type == "min-length") {
			val = {
				"type": "min-length",
				"value": +v.substr(v.indexOf(":") + 1).trim()
			};
		} else if (v_type == "max-length") {
			val = {
				"type": "max-length",
				"value": +v.substr(v.indexOf(":") + 1).trim()
			};
		} else if (v_type == "email") {
			var colon_index = v.indexOf(":") + 1;
			val = {
				type: "regex",
				object: EMAIL_REGEX,
				text: colon_index ? v.substr(colon_index).trim() :
					"Invalid email address"
			};
		} else if (v_type == "equal-to") {
			val = {
				"type": "equal-to",
				"other": v.substr(v.indexOf(":") + 1)
			};
		}
		if (val) this.validate.push(val);
	}

	// Error box
	if (this.validate.length) {
		var errorText = document.createElement("div");
		errorText.addClass("error");
		errorText.innerHTML = "{ input.lastError }";
		elem.appendChild(errorText);
	}

	// Character counter
	if (this.counter) {
		var counter = document.createElement("div");
		counter.addClass("counter");
		counter.innerHTML = "{ input.value | length } / " + this.counter;
		elem.appendChild(counter);
	}

	elem.setAttribute("rv-class-error", "input.validationError < value");

	rivets.bind(this.element, {
		input: this,
		value: this.value,
		color: this.color,
		fontSize: this.fontSize,
		highlightRegex: this.highlightRegex,
		highlightClasses: this.highlightClasses
	});
}

PapyrusText.prototype.label = "";
PapyrusText.prototype.value = "";
PapyrusText.prototype.color = "";
PapyrusText.prototype.fontSize = "";
PapyrusText.prototype.lastError = "";
PapyrusText.prototype.multiline = false;
PapyrusText.prototype.floating = false;
PapyrusText.prototype.dark = false;
PapyrusText.prototype.disabled = false;

PapyrusText.prototype.style = function() {
	var str = "";
	if (this.color) {
		str += "color:" + this.color + ";";
	}
	if (this.fontSize) {
		str += "font-size:" + this.fontSize + ";";
	}
	return str;
}

PapyrusText.prototype.validationError = function() {
	// If this is empty, ignore errors
	if (!this.value.length) return false;
	// Check the counter if appropriate (max-length)
	if (this.counter && this.counterError()) return true;
	// Check each validation part
	this.lastError = "";
	for (var i = this.validate.length; i --; ) {
		var v = this.validate[i];
		if (v.type == "regex") {
			this.lastError = v.text;
			if (!v.object.test(this.value)) return true;
			continue;
		}
		if (v.type == "min-length") {
			this.lastError = "Must be at least " + v.value + " characters";
			if (this.value.length < v.value) return true;
		}
		if (v.type == "max-length") {
			this.lastError = "Must be less than " + (v.value + 1) + " characters";
			if (this.value.length > v.value) return true;
		}
		if (v.type == "equal-to") {
			var elem = document.querySelector(v.other);
			if (!elem) continue;
			elem = elem.object;
			if (!elem) continue;
			var label = elem.label.toLowerCase();
			this.lastError = label ? "Does not match " + label :
				"Fields do not match";
			if (elem.value != this.value) return true;
		}
	}
	this.lastError = "";
	return false;
}

PapyrusText.prototype.counterError = function() {
	return (this.value.length > this.counter);
}

rivets.formatters.length = function(value) {
	return value.length;
}

rivets.formatters.highlight = function(value, highlightRegex, highlightClasses) {
	var str = value.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Simple sanitization

	for (var i = highlightRegex.length; i --; ) {
		str = str.replace(highlightRegex[i], "<span class='highlight " + highlightClasses[i] + "'>$&</span>");
	}

	return str;
}

// Buttons
PapyrusButton = function(json) {
	var json = json || new Object();
	// Main element
	var elem = document.createElement("div");
	elem.className = "papyrus-button";
	// Icon?
	if (json.icon && !json.text) { // Icon Only
		elem.addClass("material-icons");
		elem.appendTextNode(json.icon);
	} else if (json.icon) { // Icon and Text
		elem.addClass("with-icon");
		var icon = document.createElement("i");
		icon.className = "material-icons";
		icon.appendTextNode(json.icon);
	}
	// Text Content
	if (json.text) {
		elem.appendTextNode(json.text);
	}
	// Ink?
	if (!json.noInk) {
		elem.addClass("ink");
		add_ink(elem);
	}
	// Action?
	if (json.action) {
		elem.addEventListener("mouseup", json.action);
	}
	return elem;
}

// Requests (AJAX)
PapyrusRequest = function(json) {
	var json = json || new Object();
	if (json.return_type) this.return_type = json.return_type;
	if (json.url) this.url = json.url;
	this.keys =  json.keys || new Object();
	this.onsuccess = (json.onsuccess || function(){});
	this.onerror = (json.onerror || function(){});
}

PapyrusRequest.prototype.return_type = "json";
PapyrusRequest.prototype.url = "";

PapyrusRequest.prototype.submit = function() {
	// Request
	var self = this;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", this.url, true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var form_str = "";
	for (var k in this.keys) {
		if (form_str.length > 0) {
			form_str += "&";
		}
		form_str += encodeURIComponent(k) + "=" + encodeURIComponent(this.keys[k]);
	}
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var success_argument = null;
			switch (self.return_type) {
				case "text": success_argument = xmlhttp.responseText; break;
				case "xml": success_argument = xmlhttp.responseXML; break;
				case "json": success_argument = eval('(' + xmlhttp.responseText + ')'); break;
				default: break;
			}
			self.onsuccess(success_argument);
		} else if (xmlhttp.readyState == 4 && /^(4|5)/.test(xmlhttp.status)) {
			self.onerror(self);
		}
	}
	xmlhttp.send(form_str);
	return true;
}

// Converts an array to keys for a SparkRequest
function array_to_request_keys(_array, key_prefix, other_keys) {
	if (key_prefix == null) {
		key_prefix = "item";
	}
	var _keys = (other_keys != null ? other_keys : {});
	for (var i = 0; i < _array.length; ++ i) {
		_keys[key_prefix + i] = _array[i];
	}
	_keys[key_prefix + "_length"] = _array.length;
	return _keys;
}

// Forms
PapyrusForm = function(json) {
	var _this = this;
	if (json instanceof Element) {
		var elem = json;
		json = new Object();
		this.url = elem.getAttribute("data-url") || "";
		this.return_type = elem.getAttribute("data-return-type") || "json";
		var onsuccess = elem.getAttribute("onsuccess") || "";
		// this.onsuccess_vars = new Array();
		// if (/\w+(?:\(.*\))?;?/.test()) { // Named function
		// 	this.onsuccess = window[onsuccess.replace(/\W.*$/, "")];
		// 	var left_par = onsuccess.indexOf("(");
		// 	var right_par = onsuccess.indexOf(")");
		// 	if (left_par !== -1 && right_par !== -1) {
		// 		this.onsuccess_vars = onsuccess.substr(left_par + 1, right_par - left_par - 1).split();
		// 	}
		// } else { // Anonymous function
			this.onsuccess = eval('(function(){' + onsuccess + '})');
		// }
		this.validate_objects = new Array();
		this.key_elements = new Array();
		function find_key_elements(_elem) {
			_elem.children.forEach(function(__this) {
				if (__this.getAttribute("data-validate")) {
					_this.validate_objects.push(__this.object);
				}
				if (__this.name) {
					if (__this.value !== 'undefined') {
						_this.key_elements.push(__this);
					}
				}
				find_key_elements(__this);
			});
		}
		find_key_elements(elem);
		this.element = elem;
	} else {
		// TODO

	}
	_this.element.addEventListener("submit", function(e) {
		e.preventDefault();
		_this.submit();
	});
}

PapyrusForm.prototype.url = "";
PapyrusForm.prototype.return_type = "json";

PapyrusForm.prototype.submit = function() {
	// Validate
	for (var i = this.validate_objects.length; i --; ) {
		var elem = this.validate_objects[i];
		if (!elem.value.length || elem.lastError.length) {
			return;
		}
	}
	// Prepare for request
	var keys = new Object();
	for (var i = this.key_elements.length; i --; ) {
		var elem = this.key_elements[i];
		keys[elem.name] = elem.value;
	}
	// Create request
	var _this = this;
	var request = new PapyrusRequest({
		return_type: this.return_type,
		url: this.url,
		keys: keys,
		onsuccess: function(json) {
			console.log(json);
			if (!json.success && json.success !== 'undefined') {
				// Something went wrong
				if (typeof json.error === 'object') {
					for (var i = _this.validate_objects.length; i --; ) {
						var obj = _this.validate_objects[i];
						obj.lastError = json.error[obj.name] || "";
						if (obj.lastError) obj.element.addClass("error");
					}
					// Dialog error
					if (json.error.dialog) {
						PapyrusDialog.show(json.error.dialog);
					}
				} else {
					PapyrusDialog.show(json.error || "Something went wrong");
				}
			} else {
				_this.onsuccess(json);
			}
		}
	});
	// Submit request
	request.submit();
}

PapyrusForm.prototype.onerror = function() {
	
}

// Dialogs
PapyrusDialog = function() {
	// Each button is a simple JSON object with two properties:
	// text (String), and action (Function or null)
	this.buttons = new Array();
	// Create the elements
	var wrapper = this.wrapper = document.createElement("div");
	wrapper.className = "papyrus-dialog-wrapper";
	wrapper.addEventListener("mouseup", function(event) {
		if (event.target == wrapper && this.canDismiss) PapyrusDialog.hide();
	});

	var elem = this.element = document.createElement("div");
	elem.className = "papyrus-dialog";
	elem.setAttribute("data-z", 4);
	wrapper.appendChild(elem);

	var title = document.createElement("div");
	title.className = "papyrus-dialog-title";
	title.setAttribute("rv-text", "dialog.title");
	elem.appendChild(title);

	var text = document.createElement("div");
	text.className = "papyrus-dialog-text-content";
	text.setAttribute("rv-text", "dialog.textContent");
	elem.appendChild(text);

	var rich = this.richContent = document.createElement("div");
	rich.className = "papyrus-dialog-rich-content";
	elem.appendChild(rich);

	var actions = this.actionsWrapper = document.createElement("div");
	actions.className = "papyrus-dialog-actions-wrapper";
	elem.appendChild(actions);

	// Bind the elements to this object's attributes
	rivets.bind(this.wrapper, {
		dialog: this
	});
}

PapyrusDialog.prototype.title = "";
PapyrusDialog.prototype.textContent = "";
PapyrusDialog.prototype.canDismiss = false;

PapyrusDialog.prototype.show = function(json) {
	var json = json || new Object();
	if (typeof json === 'string') {
		json = {
			content: json,
			action: {
				text: "okay"
			}
		};
	}
	if (json.canDismiss == null) json.canDismiss = true;
	this.canDismiss = json.canDismiss;
	this.title = json.title || "";
	if (typeof json.content === 'string') {
		this.textContent = json.content;
		this.richContent.empty();
	} else if (json.content != null) {
		this.textContent = "";
		this.richContent.empty();
		this.richContent.appendChild(json.content);
	}
	this.actions = json.actions || new Array();
	if (json.action != null) this.actions.push(json.action);
	this.actionsWrapper.empty();
	for (var i = this.actions.length; i --; ) {
		var action = this.actions[i];
		var action_element = new PapyrusButton({
			icon: action.icon || null,
			text: action.text || null,
			noInk: action.noInk || false,
			action: action.action || null
		});
		action_element.addEventListener("mouseup", this.hide);
		this.actionsWrapper.appendChild(action_element);
	}
	this.wrapper.addClass("visible");
}

PapyrusDialog.prototype.hide = function() {
	PapyrusDialog.wrapper.removeClass("visible");
}

PapyrusDialog = new PapyrusDialog();

// Ink functions / objects

function add_ink(wrapper, light) {
	var light = light || false;
	var elem = document.createElement("div");
	elem.addClass("papyrus-ripples");
	if (light) {
		elem.addClass("light");
	}
	wrapper.appendChild(elem);
	function calcOffsets(wrapper) {
		var parentOffsetX = 0;
		var parentOffsetY = 0;
		var ignoreScroll =
			(wrapper.getStyle("position") == "fixed");
		for (var par = wrapper.offsetParent; par != null; ) {
			// Add offsets
			parentOffsetX += par.offsetLeft;
			parentOffsetY += par.offsetTop;
			// Check fixed
			if (!ignoreScroll) {
				ignoreScroll =
					(par.getStyle("position") == "fixed");
			}
			// Next parent
			par = par.offsetParent;
			if (par == document.body) {
				break;
			}
		}
		if (!ignoreScroll) {
			var scrollX = (window.pageXOffset || doc.scrollLeft) -
				(doc.clientLeft || 0);
			var scrollY = (window.pageYOffset || doc.scrollTop) -
				(doc.clientTop || 0);
		} else {
			var scrollX = scrollY = 0;
		}
		return {
			x: scrollX - wrapper.offsetLeft -
				parentOffsetX,
			y: scrollY - wrapper.offsetTop -
				parentOffsetY
		};
	}
	var doc = document.documentElement;
	if (!IS_TOUCH_DEVICE) {
		wrapper.addEventListener("mousedown", function(event) {
			var offset = calcOffsets(this);
			elem.appendChild((new PapyrusRipple(
				event.clientX + offset.x,
				event.clientY + offset.y)).element);
			wrapper.addClass("held");
		}, false);
	} else {
		wrapper.addEventListener("touchstart", function(event) {
			var offset = calcOffsets(this);
			var i = 0;
			var touch = event.changedTouches[i];
			elem.appendChild((new PapyrusRipple(
				touch.clientX + offset.x,
				touch.clientY + offset.y)).element);
			wrapper.addClass("held");
		}, false);
	}
	var timeout = null;
	var event_type = !IS_TOUCH_DEVICE ? "mouseup" : "touchend";
	var listener = window.addEventListener(event_type, function() {
		if (event_type == "touchend" && event.touches.length) {
			return;
		}
		wrapper.removeClass("held");
		if (wrapper.children.length) {
			for (var i = wrapper.lastChild.children.length; i --; ) {
				var child = wrapper.lastChild.children[i];
				child.addClass("done");
				setTimeout(function() {
					child.remove();
				}, 750);
			}
		}
		window.removeEventListener(event_type, listener);
	});
}

PapyrusRipple = function(x, y) {
	var _this = this;
	var position = this.element = document.createElement("div");
	position.addClass("ripple-position");
	position.style.left = x + "px";
	position.style.top = y + "px";
	var ripple = document.createElement("div");
	ripple.addClass("ripple");
	position.appendChild(ripple);
	setTimeout(function() {
		if (_this.element.parentElement == null) {
			return;
		}
		if (_this.element.parentElement.children.length > 1) {
			_this.remove();
			return;
		}
		var ink = _this.element.parentElement.parentElement;
		if (!ink.hasClass("held")) {
			_this.element.addClass("done");
			setTimeout(function() {
				_this.remove();
			}, 750);
		}
	}, 750);
}

PapyrusRipple.prototype.remove = function() {
	this.element.remove();
}