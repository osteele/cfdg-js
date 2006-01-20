var Context = function (model) {
	this.model = model;
	this.transform = new Transform;
    this.graphics = new Graphics;
    this.color = [0,1,0];
	this.queue = [];
    this.stats = {rules: 0, countdown: 0};
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
        if (Math.abs(this.transform.determinant()) < .001) return;
		//this.model.draw(this, name);
        this.queue.push([this, name]);
	},
    flush: function () {
        while (this.queue.length && --this.stats.countdown > 0) {
            var item = this.queue.shift();
            item[0].model.draw(item[0], item[1]);
            this.stats.rules += 1;
        }
    },
    drawPath: function (name, points, isCurve) {
        var points = this.transform.transformPoints(points);
        this.graphics.setHsv.apply(this.graphics, this.color);
		this.graphics.drawPath(name, points, isCurve);
    },
    transform: function (points) {return this.transform.transform(points)},
    set_x: function (dx) {this.transform.pretranslate(dx, 0)},
    set_y: function (dy) {this.transform.pretranslate(0, dy)},
	set_size: function (size) {this.transform.prescale(size[0], size[1])},
	set_rotate: function (r) {this.transform.prerotate(r*Math.PI/180);},
    set_flip: function (r) {
        r *= Math.PI/180;
        this.transform.prerotate(-r);
        this.transform.prescale(1, -1);
        this.transform.prerotate(r);
    },
    set_hue: function (h) {
        this.color[0] += h;
        //this.graphics.setHsv.apply(this, this.color);
    },
    set_sat: function (b) {
        this.color[1] = b;
        //this.graphics.setHsv.apply(this, this.color);
    },
    set_brightness: function (b) {
        this.color[2] = b;
        //this.graphics.setHsv.apply(this, this.color);
    }
};

Model.prototype.draw = function (context, name) {
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
    //for (var i = this.attributes.length; --i >= 0; )
    for (var i = 0; i < this.attributes.length; i++)
		context['set_' + this.attributes[i][0]](this.attributes[i][1]);
	if (Shapes[this.name])
		return Shapes[this.name](context);
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
		context.drawPath("CIRCLE", pts, true);
	},
	SQUARE: function (context) {
		var pts = [[-.5,-.5], [-.5,.5], [.5,.5], [.5,-.5]];
		context.drawPath("SQUARE", pts);
	},
	TRIANGLE: function (context) {
        var y = -0.5/Math.sqrt(3);
		var pts = [[-.5,y], [.5,y], [0, y+Math.sqrt(3)/2]];
		context.drawPath("TRIANGLE", pts);
	}
}