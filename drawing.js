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
	this.transform = new Transform;
    this.brightness = 1;
};

Context.prototype = {
	clone: function () {
		var clone = new Context(this.model);
		clone.cache = this.cache;
        clone.brightness = this.brightness;
        clone.transform = this.transform.clone();
		return clone;
	},
	invoke: function (name) {
		this.model.draw(this, name);
	},
    path: function (message, points) {
        if (message == 'CIRCLE') points = points[0]+'...';
        print(message, points);
    },
    transform: function (points) {return this.transform.transform(points)},
    set_x: function (dx) {this.transform.translate(dx, 0)},
    set_y: function (dy) {this.transform.translate(0, dy)},
	set_sx: function (sx) {this.transform.scale(sx, 0)},
    set_sy: function (sy) {this.transform.scale(0, sy)},
	set_size: function (s) {this.transform.scale(s, s)},
	set_rotate: function (r) {this.transform.rotate(r*Math.PI/180)},
    set_brightness: function (b) {
        this.brightness = b;
        this.setHsv(1, 0, b);
    },
    setHsv: function (h, s, v) {}
};

Transform = function () {
    this.m = [[1,0,0],[0,1,0],[0,0,1]];
};

Transform.prototype = {
    clone: function () {
        var clone = new Transform;
        var m = clone.m = [];
        for (var i = 0; i < this.m.length; i++)
            m.push([].concat(this.m[i]));
        return clone;
    },
    
	transform: function (points) {
        print(this.m);
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
    
    scale: function(sx, sy) {
		var m = this.m;
		m[0][0] *= sx;
		m[1][0] *= sx;
		m[0][1] *= sy;
		m[1][1] *= sy;
	},
    
    translate: function (dx, dy) {
        var m = this.m;
        m[0][2] += m[0][0]*dx+m[0][1]*dy;
        m[1][2] += m[1][0]*dx+m[1][1]*dy;
    },
    
    rotate: function (theta) {
        var cos = Math.cos(theta);
        var sin = Math.sin(theta);
        for (var i = 0; i < 2; i++) {
            var m = this.m[i];
            var a = m[0];
            var b = m[1];
            m[0] = sin*a + cos*b;
            m[1] = cos*a - sin*b;
            //print(m);
        }
	}
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
		var pts = [[.5, 0]];
        var theta = Math.PI/4;
        var rctl = 0.5/Math.cos(theta/2);
        var angle = 0;
        for (var i = 0; i < 8; i++) {
            angle += theta/2;
            pts.push([rctl*Math.cos(angle), rctl*Math.sin(angle)]);
            angle += theta/2;
            pts.push([Math.cos(angle)/2, Math.sin(angle)/2]);
        }
		context.path("CIRCLE", context.transform.transform(pts), true);
	},
	SQUARE: function (context) {
		var pts = context.transform.transform([[-.5,-.5], [-.5,.5], [.5,.5], [.5,-.5]]);
		context.path("SQUARE", pts);
	},
	TRIANGLE: function (context) {
		var pts = context.transform.transform([[-.5,.5], [.5,.5], [0, -.5]]);
		context.path("TRIANGLE", pts);
	}
}