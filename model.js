// translate rotate scale skew reflect
var ATTRIBUTE_NAMES = 'x y rotate size sx sy skew brightness'.split(' ');
var ATTRIBUTE_NAME_SYNONYMS = {s: 'size', r: 'rotate', b: 'brightness'};

var Model = function () {
	this.startName = null;
	this.rules = {};
};

Model.prototype = {
	makeRule: function (name) {
        if (!this.startName) this.startName = name;
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
	},

    choose: function (name) {
        rules = this.rules[name];
        if (rules.length == 1) return rules[0];
        var sum = rules._sum;
        if (!sum) {
            sum = 0;
            for (var i = 0; i < rules.length; i++)
                sum += rules[i].weight;
            rules._sum = sum;
        }
        var r = Math.random() * sum;
        for (var i = 0; i < rules.length; i++)
            if ((r -= rules[i].weight) <= 0)
                return rules[i];
        print('no choice from ' + rules.length + ' with weight ' + sum);
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
