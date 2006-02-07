/* Copyright 2005-2006 Oliver Steele.  All rights reserved. */

var Context = function (model) {
	this.model = model;
	this.transform = new Transform;
    this.graphics = new Graphics;
    this.color = [0,0,0, 1];
	this.queue = [];
    this.stats = {rules: 0, cutoff: .0005};
};

Context.prototype = {
	clone: function () {
		var clone = new Context(this.model);
        clone.transform = this.transform.clone();
        clone.graphics = this.graphics;
        clone.color = [].concat(this.color);
		clone.queue = this.queue;
        clone.stats = this.stats;
		return clone;
	},
	invoke: function (name) {
        if (Math.abs(this.transform.determinant()) < this.stats.cutoff) return;
		//this.model.draw(this, name);
        this.queue[this.queue.length] = [this, name];
	},
    flush: function () {
        while (this.queue.length && --this.stats.countdown > 0) {
            var item = this.queue.shift();
            item[0].model.draw(item[0], item[1]);
            this.stats.rules += 1;
        }
    },
	setBackground: function (hsv) {
		this.graphics.setBackgroundHSV(hsv);
	},
    drawPolygon: function (points) {
        var points = this.transform.transformPoints(points);
        this.graphics.setHSVA(this.color);
		this.graphics.drawPolygon(points);
    },
	drawCircle: function (center, radius) {
        this.graphics.setHSVA(this.color);
		this.graphics.drawCircle(center, radius, this.transform);
	},
    transform: function (points) {return this.transform.transform(points)},
    set_x: function (dx) {this.transform.pretranslate(dx, 0)},
    set_y: function (dy) {this.transform.pretranslate(0, dy)},
	set_size: function (size) {this.transform.prescale(size[0], size[1])},
	set_rotate: function (r) {this.transform.prerotate(r*Math.PI/180);},
	set_skew: function (skew) {
		t = new Transform;
		t.m[0][1] = Math.tan(skew[0]*Math.PI/180);
		t.m[1][0] = Math.tan(skew[1]*Math.PI/180);
		this.transform.premultiply(t);
	},
    set_flip: function (r) {
        r *= Math.PI/180;
        this.transform.prerotate(-r);
        this.transform.prescale(1, -1);
        this.transform.prerotate(r);
    },
    set_hue: function (h) { this.color[0] += h; },
    set_sat: function (s) { this.color[1] = s; },
    set_brightness: function (b) { 
        this.color[2] += (1-this.color[2])*b;
    },
    set_alpha: function (a) { this.color[3] += this.color[3]*a; }
};

Model.prototype.draw = function (context, name) {
	context.setBackground(this.background);
	if (!name) name = this.startName;
    var rule = this.choose(name);
    rule && rule.draw(context);
    context.flush();
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
		return Shapes[this.name](context);
    context.invoke(this.name);
};

var Sqrt3 = Math.sqrt(3);

var Shapes = {
	CIRCLE: function (context) {
		if (Math.abs(context.transform.determinant()) < context.stats.cutoff*2)
            return this.SQUARE(context);
		context.drawCircle([0,0],0.5);
	},
	SQUARE: function (context) {
		var pts = [[-.5,-.5], [-.5,.5], [.5,.5], [.5,-.5]];
		context.drawPolygon(pts);
	},
	TRIANGLE: function (context) {
        var y = -0.5/Sqrt3;
		var pts = [[-.5,y], [.5,y], [0, y+Sqrt3/2]];
		context.drawPolygon(pts);
	}
}