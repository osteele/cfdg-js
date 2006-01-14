/* TODO:
- tabs
 */

PUNCTUATION = "()[]{}";

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
			if (value) return "Syntax error at \'" + word + "\' on line " + (i+1) + ": " + value;
		}
	}
	parser.receive(-1);
}

var Parser = function (builder) {
	this.builder = builder;
	this.initialize();
};

Parser.prototype = {
	receive: function (word) {
		//print(word);
		var fn = this.state[word];
		if (!fn) fn = this.state[typeof word];
		if (!fn) {
			//for (var p in this.state)
			//	print("" + p + " -> " + this.state[p]);
			var msg = "Expected one of: ";
			var sep = '';
			for (var key in this.state) {
				msg += sep + key;
				sep = ', ';
			}
			return msg;
		}
		if (typeof fn == 'function') {
			this._fn = fn;
			this._fn(word);
		} else {
			this.state = fn;
		}
	},
	
	initialize: function () {
		this.expect('rule', this.rule);
	},
	
	expect: function () {
		this.state = {};
		for (var i = 0; i < arguments.length; i += 2)
			this.state[arguments[i]] = arguments[i+1];
	},
	
	rule: function () {
		this.builder.start_rule();
		this.expect(
			'string', function (s) {
				this.builder.set_rule_name(s);
				this.expect('{', this.rule_children_state);
			})
	},
	
	handle_child: function (s) {
		this.builder.start_child(s);
		var attributes = {'}': this.rule_children_state};
		for (var i in this.builder.attribute_names)
			attributes[this.builder.attribute_names[i]] = this.handle_attr_name;
		this.expect('{', function () {this.builder.start_set();
						this.state = attributes},
					'[', function () {this.builder.start_list();
						this.state = attributes});
	},
	
	handle_attr_name: function (name) {
		this.expect('string', function (value) {
						this.builder.set_attribute(name, value);
						this.state = rule_children_state;
					});
	},

	rule_children_state: {
		'}': function () {this.initialize()},
		'string': function (s) {this.handle_child(s)}
	}
	
};

var Builder = function () {
	this.rules = [];
};

Builder.prototype = {
	start_rule: function () {
		print('builder: start rule');
		this.rule = {children: []};
		this.rules.push(this.rule);
	},
	
	set_rule_name: function (name) {
		print('builder: set rule name = ' + name);
		this.rule.name = name;
	},
	
	start_child: function (name) {
		print('builder: start child = ' + name);
		this.child = {name: name};
		this.rule.children.push(this.child);
	},
	
	start_set: function () {
		print('builder: start attribute set');
		this.child.attrs = {};
	},
	
	start_list: function () {
		print('builder: start attribute list');
		this.child.attrs = [];
	}
};

//print(lex("abc({ }]def]", receiver));
var builder = new Builder;
//print(lex("rule section {\n# TRIANGLE\n  line {}\n}", new Parser(builder)));
print(lex("rule line {\nTRIANGLE [s 1 3]\nTRIANGLE [s 1 2 r 180]\n}", new Parser(builder)))
print(builder.rules[0]);
