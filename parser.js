/*
Implement notes:
- OL has a bug where local "rule" hides global "Rule" from new.
- "for (var i in ar)" traverses backwards in Flash

Tests:
- blank lines

Corners:
- tabs
- EOF
- invalid attribute name
- "s 1 s 2 3"
- "line{TRIANGLE{s"
 */

var EOF = -1;
var PUNCTUATION = "()[]{};";

// Flash can't split on regular expressions, or we could split on /\n|\r/
function splitSplit(text, a, b) {
	var lines = text.split(a);
    for (var i = 0; i < lines.length; i++)
        lines.splice.apply(lines, [i, 1].concat(lines[i].split(b)));
    return lines;
}

// Same with whitespace

function lex(text, parser) {
	var lines = splitSplit(text, "\r", "\n");
	for (var i = 0; i < lines.length; i++) {
		var words = splitSplit(lines[i], " ", "\t");
		while (words.length && !words[0]) words.shift();
        if (!words.length) continue;
		if (words[0].charAt(0)=='#') continue;
		if (words[0].slice(0,2)=='//') continue;
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
	this.set_initial_state();
};

Parser.prototype = {
	receive: function (word) {
		//print(word);
		var fn = this.transitions[word];
		if (!fn && word != EOF) {
			var c0 = word.charAt(0).toLowerCase();
			if (('a' <= c0 && c0 <= 'z') || c0 == '_')
				fn = this.transitions[typeof word];
			if (('0' <= c0 && c0 <= '9') || ".-".indexOf(c0) >= 0) {
				fn = this.transitions['number'];
                if (fn) word = Number(word);
            }
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
	
	expect: function () {
		this.transitions = {};
		for (var i = 0; i < arguments.length; i += 2)
			this.transitions[arguments[i]] = arguments[i+1];
	},
	
	set_initial_state: function () {
		this.expect('rule', this.rule,
					'startrule', function () {
						this.expect('string', function (name) {
										this.builder.startshape(name);
										this.set_initial_state();
									})
							});
	},
	
	rule: function () {
		this.expect(
			'string', function (name) {
				this.builder.start_rule(name);
				this.expect('{', this.rule_body_transitions,
                            'number', function (weight) {
                                this.builder.add_weight(weight);
                                this.expect('{', this.rule_body_transitions);
                            });
			})
	},
	
	rule_body: function (name) {
		this.builder.start_child(name);
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
		'}': function () {this.set_initial_state()},
		'string': function (s) {this.rule_body(s)}
	}
	
};

var Builder = function (model) {
	this.model = model;
    var names = [].concat(ATTRIBUTE_NAMES);
    for (var name in ATTRIBUTE_NAME_SYNONYMS)
        names.push(name);
    this.attribute_names = name;
};

Builder.prototype = {
	startshape: function (name) {
		//print('builder: startshape ' + name);
		this.model.startName = name;
	},
	
	start_rule: function (name) {
		//print('builder: rule ' + name);
		this.rule = this.model.makeRule(name);
	},
	
    add_weight: function (weight) {
        this.rule.weight = weight;
    },
    
	start_child: function (name) {
		//print('builder: child ' + name);
		this.call = this.rule.addCall(name);
	},
	
	start_attribute_set: function () {
		//print('builder: attribute set');
		this.attributeSet = {};
		this.set_attribute_handlers(this.attribute_handlers.set);
	},
	
	start_attribute_list: function () {
		//print('builder: attribute list');
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
		//print('builder: add attribute ' + name + ", " + value);
		if (ATTRIBUTE_NAME_SYNONYMS[name])
			name = ATTRIBUTE_NAME_SYNONYMS[name];
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

function parse(string, mode) {
	var m = new Model;
	var msg = lex(string, new Parser(new Builder(m)));
	if (msg) print(msg);
	if (!mode) print(m.to_s());
	var cxt = new Context(m);
	if (mode=='draw') m.draw(cxt);
    return msg;
}

function draw(string) {
    return parse(string, 'draw')
}
