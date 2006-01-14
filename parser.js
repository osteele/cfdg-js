/*
TODO:
- tabs
- EOF
- invalid attribute name
- "s 1 s 2 3"
 */

var EOF = -1;
var PUNCTUATION = "()[]{};.";

function lex(text, parser) {
	var lines = text.split("\n");
	for (var i = 0; i < lines.length; i++) {
		var words = lines[i].split(" ");
		while (words.length && !words[0]) words.shift();
		if (words.length && words[0].charAt(0)=='#') continue;
		while (words.length) {
			var word = words.shift();
			if (!word.length) continue;
			if (word.length == 1) {
			} else if (PUNCTUATION.indexOf(word.charAt(0)) >= 0) {
				if (word.length > 1) words.unshift(word.slice(1));
				word = word.charAt(0);
			} else while (PUNCTUATION.indexOf(word.charAt(word.length-1)) >= 0) {
				words.unshift(word.charAt(word.length-1));
				word = word.slice(0, word.length-1);
			}
			var value = parser.receive(word);
			if (value) return "cfdg: syntax error at \'" + word + "\' on line " + (i+1) + ": " + value;
		}
	}
	parser.receive(EOF);
}

var Parser = function (builder) {
	this.builder = builder;
	this.initialize();
};

Parser.prototype = {
	receive: function (word) {
		//print(word);
		var fn = this.transitions[word];
		if (!fn && word != EOF) {
			var c0 = word.charAt(0).toLowerCase();
			if (('a' <= c0 && c0 <= 'z') || c0 == '_')
				fn = this.transitions[typeof word];
			if (('0' <= c0 && c0 <= '9'))
				fn = this.transitions['number'];
		}
		if (!fn) {
			//for (var p in this.transitions)
			//	print("" + p + " -> " + this.transitions[p]);
			var msg = "Expected one of: ";
			var sep = '';
			for (var key in this.transitions) {
				msg += sep + key;
				sep = ', ';
			}
			return msg;
		}
		if (typeof fn == 'function') {
			this._fn = fn;
			this._fn(word);
		} else {
			this.transitions = fn;
		}
	},
	
	initialize: function () {
		this.expect('rule', this.rule);
	},
	
	expect: function () {
		this.transitions = {};
		for (var i = 0; i < arguments.length; i += 2)
			this.transitions[arguments[i]] = arguments[i+1];
	},
	
	rule: function () {
		this.expect(
			'string', function (s) {
				this.builder.start_rule(s);
				this.expect('{', this.rule_body_transitions);
			})
	},
	
	rule_body: function (s) {
		this.builder.start_child(s);
		for (var i in this.builder.attribute_names)
			attributes[this.builder.attribute_names[i]] = this.handle_attr_name;
		this.expect('{', function () {
						this.builder.start_attribute_set();
						this.end_punctuation = '}';
						this.expect_attribute_name();
					},
					'[', function () {
						this.builder.start_attribute_list();
						this.end_punctuation = ']';
						this.expect_attribute_name()});
	},
	
	expect_attribute_name: function () {
		this.expect('string', this.attribute_name,
					this.end_punctuation, function () {
						this.builder.end_attributes();
						this.transitions = this.rule_body_transitions;
					});
	},
	
	attribute_name: function (name) {
		this.expect('number', function (value) {
						this.expect_attribute_name();
						this.transitions['number'] = function (value) {
							this.builder.add_attribute_value(value);
							this.expect_attribute_name();
						};
						return this.builder.add_attribute(name, value);
					});
	},

	rule_body_transitions: {
		'}': function () {this.initialize()},
		'string': function (s) {this.rule_body(s)}
	}
	
};

var Builder = function (model) {
	this.model = model;
};

Builder.prototype = {
	start_rule: function (name) {
		print('builder: set rule name = ' + name);
		this.rule = this.model.makeRule(name);
	},
	
	start_child: function (name) {
		print('builder: start child = ' + name);
		this.call = this.rule.addCall(name);
	},
	
	start_attribute_set: function () {
		print('builder: start attribute set');
		this.attributeSet = {};
		this.set_attribute_handlers(this.attribute_handlers.set);
	},
	
	start_attribute_list: function () {
		print('builder: start attribute list');
		this.attributeList = [];
		this.set_attribute_handlers(this.attribute_handlers.list);
	},
	
	set_attribute_handlers: function (table) {
		for (var key in table)
			this[key] = table[key];
	},
	
	attribute_handlers: {
		set: {
			add_attribute_helper: function (name, value) {
				this.lastAttributeName = name;
				this.attributeSet[name] = value;
			},
			
			pop_attribute_value: function (name) {
				var value = this.attributeSet[name];
				delete this.attributeSet[name];
				return value;
			},
			
			end_attributes: function () {
				this.call.setAttributeSet(this.attributeSet);
			}
		},
		
		list: {
			add_attribute_helper: function (name, value) {
				this.lastAttributeName = name;
				this.attributeList.push([name, value]);
			},
			
			pop_attribute_value: function (name) {
				return this.attributeList.pop();
			},
			
			end_attributes: function () {
				this.call.setAttributeList(this.attributeList);
			}
		}
	},
	
	add_attribute: function (name, value) {
		print('builder: add attribute ' + name + ", " + value);
		if (this.call.ATTRIBUTE_SYNONYMS[name])
			name = this.call.ATTRIBUTE_SYNONYMS[name];
		for (var i = this.call.ATTRIBUTE_NAMES.length;
			 this.call.ATTRIBUTE_NAMES[--i] != name; )
			if (i < 0)
				return "invalid attribute name";
		this.add_attribute_helper(name, value);
	},
	
	add_attribute_value: function (value) {
		var name = this.lastAttributeName;
		if (name != 'scale' && name != 'skew')
			return "The \'" + name + "\' attribute can only have one value";
		var firstValue = this.pop_attribute_value(name);
		this.add_attribute('sx', firstValue);
		this.add_attribute('sy', value);
	}	
};

var Model = function () {
	this.startName = null;
	this.rules = {};
};

Model.prototype = {
	makeRule: function (name) {
		var rules = this.rules[name];
		if (!rules)
			rules = this.rules[name] = [];
		var rule = new Rule(name);
		rules.push(rule);
		return rule;
	},
	to_s: function (name) {
		var s = '';
		for (var name in this.rules)
			for (var i = 0; i < this.rules[name].length; i++) {
				if (s) s += "\n";
				s += this.rules[name][i].to_s();
			}
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
		var call = new Call(name);
		this.calls.push(call);
		return call;
	},
	to_s: function () {
		var s = this.name + " {";
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
}

function parse(string) {
	var model = new Model;
	var msg = lex(string, new Parser(new Builder(model)));
	if (msg) print(msg);
	print(model.to_s());
}

parse("rule line {\nTRIANGLE {s 2 3}\n}");
//parse("rule line {\nTRIANGLE [s 1 3]\nTRIANGLE [s 1 2 r 180]\n}");
