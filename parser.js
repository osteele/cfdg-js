var EOF = -1;
var PUNCTUATION = "()[]{}|;";

// Flash can't split on regular expressions, or we could split on /\n|\r/
String.prototype.split2 = function (a, b) {
	var lines = this.split(a);
    for (var i = 0; i < lines.length; i++)
        lines.splice.apply(lines, [i, 1].concat(lines[i].split(b)));
    return lines;
};

String.prototype.lines = function () {return this.split2('\r', '\n');};
String.prototype.words = function () {return this.split2(' ', '\t');};

function lex(text, parser) {
    parser = parser || {receive: function (type, token) {print(type, ": '" + token + "'")}};
	var lines = text.lines();
	for (var i = 0; i < lines.length; i++) {
		var words = lines[i].words();
		while (words.length && !words[0]) words.shift();
		while (words.length) {
			var word = words.shift();
			if (!word) continue;
			if (word.charAt(0)=='#') break;
			if (word.slice(0,2)=='//') break;
			if (word.length > 1) {
				for (var pi = PUNCTUATION.length; --pi >= 0; ) {
					var pindex = word.indexOf(PUNCTUATION.charAt(pi));
					if (pindex == 0) {
						words.unshift(word.slice(1));
						word = word.slice(0, 1);
					} else if (pindex >= 0) {
						words.unshift(word.slice(pindex));
						word = word.slice(0, pindex);
					}
				}
			}
            var type = null;
            var token = word;
			var c0 = word.charAt(0).toLowerCase();
			if (('a' <= c0 && c0 <= 'z') || c0 == '_')
				type = '<string>';
			if (('0' <= c0 && c0 <= '9') || ".-".indexOf(c0) >= 0) {
				type = '<number>';
                token = Number(word);
            }
			var msg = parser.receive(type, token);
			if (msg) return {message: msg, lineno: i+1, token: token}
		}
	}
	var msg = parser.receive('<eof>', null);
    if (msg) return {message: msg, lineno: i, token: 'end of document'};
}

var Parser = function (builder) {
	this.builder = builder;
	this.set_initial_state();
};

Parser.prototype = {
	receive: function (type, token) {
		var fn = this.transitions[token] || this.transitions[type];
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
			return this._fn(token);
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
					'startshape', function () {
						this.expect('<string>', function (name) {
										this.builder.startshape(name);
										this.set_initial_state();
									})
							});
	},
	
	rule: function () {
		this.expect(
			'<string>', function (name) {
				this.builder.start_rule(name);
				this.expect('{', this.rule_body_transitions,
                            '<number>', function (weight) {
                                this.builder.add_weight(weight);
                                this.expect('{', this.rule_body_transitions);
                            });
			})
	},
	
	rule_body: function (name) {
		this.builder.start_child(name);
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
		this.expect('<string>', this.attribute_name,
					this.end_punctuation, function () {
						this.builder.end_attributes();
						this.transitions = this.rule_body_transitions;
					});
	},
	
	attribute_name: function (name) {
		this.expect('<number>', function (value) {
						this.expect_attribute_name();
						this.transitions['<number>'] = function (value) {
							this.expect_attribute_name();
							return this.builder.add_attribute_value(value);
						};
						this.transitions['|'] = function () {
							this.expect_attribute_name();
							return this.builder.pipe();
						}
						return this.builder.add_attribute(name, value);
					});
	},

	rule_body_transitions: {
		'}': function () {this.expect('rule', this.rule,
                                      '<eof>', {})},
		'<string>': function (s) {this.rule_body(s)}
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
				return this.attributeList.pop()[1];
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
        if (ATTRIBUTE_ARITY[name] == 2)
            value = [value, value];
        var found = false;
        for (var i = 0; i < ATTRIBUTE_NAMES.length; i++)
            if (ATTRIBUTE_NAMES[i] == name) found = true;
        if (!found) return "Invalid attribute name: " + name;
		this.add_attribute_helper(name, value);
	},
	
	add_attribute_value: function (value) {
		var name = this.lastAttributeName;
		if (ATTRIBUTE_ARITY[name] != 2)
			return "The \'" + name + "\' attribute can only have one value";
		var vector = this.pop_attribute_value(name);
		vector[1] = value;
        this.add_attribute_helper(name, vector);
	},
	
	pipe: function () {
		var name = this.lastAttributeName;
		if (name == 'hue') {
			this.pop_attribute_value(name);
			this.add_attribute_helper(name, 0);
		}
	}
};

function parse(string, mode) {
	var m = new Model;
	var err = lex(string, new Parser(new Builder(m)));
	if (err) {
        print("cfdg: syntax error at \'" + err.token + "\' on line " + err.lineno + ": " + err.message);
        return;
    }
	if (!mode) print(m.to_s());
	var cxt = new Context(m);
	if (mode=='draw') m.draw(cxt);
}

function draw(string) {
    return parse(string, 'draw')
}
