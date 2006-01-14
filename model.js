var Model = function () {
	this.startName = null;
	this.rules = {};
};

Model.prototype = {
	makeRule: function (name) {
		var rules = this.rules[name];
		if (!rules) {
			rules = this.rules[name] = [];
            rules._sum = null;
        }
		var r = new Rule(name);
		rules.push(r);
		return r;
	},
	to_s: function (name) {
		var s = '';
		for (var name in this.rules)
			for (var i = 0; i < this.rules[name].length; i++) {
				if (s) s += "\n";
				s += this.rules[name][i].to_s();
			}
		if (this.startName)
			s = "startshape " + this.startName + "\n" + s;
		return s;
	}
};

var Rule = function (name) {
	this.name = name;
	this.weight = 1.0;
	this.calls = [];
};

Rule.prototype = {
	addCall: function (name) {
		var c = new Call(name);
		this.calls.push(c);
		return c;
	},
    
	to_s: function () {
		var s = this.name;
        if (this.weight != 1.0) s += ' ' + this.weight;
        s += " {";
		for (var i = 0; i < this.calls.length; i++) {
			s += "\n  " + this.calls[i].to_s();
		}
		if (this.calls.length) s+= "\n";
		return s + "}";
	}
};

// translate rotate scale skew reflect
var ATTRIBUTE_NAMES = 'x y r scale sx sy skew skx sky'.split(' ');
var ATTRIBUTE_NAME_SYNONYMS = {s: 'scale'};

var Call = function (name) {
	this.name = name;
	this.attributes = [];
};

Call.prototype = {
	setAttributeList: function (attrs) {
		this.attributes = attrs
	},
	
	setAttributeSet: function (attrs) {
		var names = this.ATTRIBUTE_NAMES;
		var list = [];
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			if (attrs[name])
				list.push([name, attrs[name]]);
		}
		this.attributes = list;
	},
	to_s: function () {
		if (!this.attributes.length) return this.name + " {}";
		var s = this.name + " [";
		for (var i = 0; i < this.attributes.length; i++) {
			if (i > 0) s += ' ';
			s += this.attributes[i][0] + ' ' + this.attributes[i][1];
		}
		return s + "]";
	}
};

Call.prototype = {
	// translate rotate scale skew reflect
	ATTRIBUTE_NAMES: 'x y r scale sx sy skew skx sky'.split(' '),
	ATTRIBUTE_SYNONYMS: {s: 'scale'},
	
	setAttributeList: function (attrs) {
		this.attributes = attrs
	},
	
	setAttributeSet: function (attrs) {
		var names = this.ATTRIBUTE_NAMES;
		var list = [];
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			if (attrs[name])
				list.push([name, attrs[name]]);
		}
		this.attributes = list;
	},
	to_s: function () {
		if (!this.attributes.length) return this.name + " {}";
		var s = this.name + " [";
		for (var i = 0; i < this.attributes.length; i++) {
			if (i > 0) s += ' ';
			s += this.attributes[i][0] + ' ' + this.attributes[i][1];
		}
		return s + "]";
	}
};

Call.prototype = {
	setAttributeList: function (attrs) {
		this.attributes = attrs
	},
	
	setAttributeSet: function (attrs) {
		var names = ATTRIBUTE_NAMES;
		var list = [];
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			if (attrs[name])
				list.push([name, attrs[name]]);
		}
		this.attributes = list;
	},
    
	to_s: function () {
		if (!this.attributes.length) return this.name + " {}";
		var s = this.name + " [";
		for (var i = 0; i < this.attributes.length; i++) {
			if (i > 0) s += ' ';
			s += this.attributes[i][0] + ' ' + this.attributes[i][1];
		}
		return s + "]";
	}
};
