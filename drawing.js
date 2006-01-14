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
	this.m = [[1,0,0],[0,-1,0]];
    this.brightness = 1;
};

Context.prototype = {
	clone: function () {
		var clone = new Context(this.model);
		clone.cache = this.cache;
        clone.brightness = this.brightness;
        clone.m = [];
        for (var i = 0; i < this.m.length; i++)
            clone.m.push([].concat(this.m[i]));
		return clone;
	},
	invoke: function (name) {
		this.model.draw(this, name);
	},
    path: function (message, points) {
        if (message == 'CIRCLE') points = points[0]+'...';
        print(message, points);
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
    set_x: function (dx) {this.m[0][2] += dx},
    set_y: function (dy) {this.m[1][2] += dy},
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
	set_size: function (s) {
		this.set_sx(s);
		this.set_sy(s);
	},
	set_rotate: function (r) {
		var m = this.m;
        
	},
    set_brightness: function (b) {this.brightness = b}
};

Model.prototype.draw = function (context, name) {
	if (!name) name = this.startName;
    this.choose(name).draw(context);
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
		var pts = [[1, 0]];
        var angle = 0;
        var theta = Math.PI/4;
        for (var i = 0; i < 8; i++) {
            angle += theta/2;
            pts.push([Math.cos(angle), Math.sin(angle)]);
            angle += theta/2;
            pts.push([Math.cos(angle), Math.sin(angle)]);
        }
		context.path("CIRCLE", context.transform(pts));
	},
	SQUARE: function (context) {
		var pts = context.transform([[-1,-1], [-1,1], [1,1], [1,-1]]);
		context.path("SQUARE", pts);
	},
	TRIANGLE: function (context) {
		var pts = context.transform([[-1,1], [-1,-1], [1, 0]]);
		context.path("TRIANGLE", pts);
	}
}