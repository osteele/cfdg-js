/*
Features:
- transformed circles

Corners:
- no rules
- invalid name
 */

// Also acts as a  facade for the matrix
var Context = function (model) {
	this.model = model;
	this.cache = {};
	this.m = [[1,0,0],[0,1,0]];
};

Context.prototype = {
	clone: function () {
		var clone = new Context(this.model);
		clone.cache = this.cache;
		clone.m = this.m;
		return clone;
	},
	invoke: function (name) {
		this.model.draw(context, name);
	},
	transform: function (points) {
		var result = [];
		var mx = this.m[0];
		var my = this.m[1];
		for (var i = 0; i < points.length; i++) {
			var x = points[i][0];
			var y = points[i][1];
			result.push([x*mx[0]+y*mx[1]+mx[2],
						 y*my[0]+y*my[1]+my[2]])
		}
		return result;
	},
	set_sx: function (sx) {
		var mx = this.m[0];
		mx[0] *= sx;
		mx[1] *= sx;
		mx[2] *= sx;
	},
	set_sy: function (sy) {
		var my = this.m[1];
		my[0] *= sy;
		my[1] *= sy;
		my[2] *= sy;
	},
	set_scale: function (s) {
		this.set_sx(s);
		this.set_sy(s);
	},
	set_r: function (r) {
		var m = this.m;
		
	}
};

Model.prototype.draw = function (context, name) {
	if (!name) name = this.startName;
	if (!name) for (name in this.rules); // choose the last rule
	var rules = this.rules[name];
	this.choose(rules).draw(context);
};

Model.prototype.choose = function (rules) {
	if (rules.length == 1) return rules[0];
	var sum = rules._sum;
	if (!sum) {
		sum = 0;
		for (var i in rules)
			sum += rules[i].weight;
		rules._sum = sum;
	}
	var r = Math.random() * sum;
	for (var i in rules)
		if ((r -= rules[i].weight) <= 0)
			return rules[i];
};

Rule.prototype.draw = function (context) {
	for (var i = 0; i < this.calls.length; i++)
		this.calls[i].draw(context);
};

Call.prototype.draw = function (context) {
	if (this.attributes.length)
		context = context.clone();
	for (var i = 0; i < this.attributes.length; i++)
		context['set_' + this.attributes[i][0]](this.attributes[i][1]);
	if (Shapes[this.name])
		Shapes[this.name](context);
	else
		context.invoke(this.name);
};

var Shapes = {
	CIRCLE: function (context) {
		var pts = context.transform([[0,0]]);
		var m = context.m;
		var r = Math.sqrt(Math.abs(m[0][0]*m[1][1]-m[0][1]*m[1][0]));
		print("CIRCLE: " + pts+', r='+r);
	},
	SQUARE: function (context) {
		var pts = context.transform([[-1,-1], [-1,1], [1,1], [1,-1]]);
		print("SQUARE: " + pts);
	},
	TRIANGLE: function (context) {
		var pts = context.transform([[-1,1], [-1,-1], [1, 0]]);
		print("TRIANGLE: " + pts);
	}
}