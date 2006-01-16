var Context = function (model) {
	this.model = model;
	this.transform = new Transform;
    this.graphics = new Graphics;
    this.brightness = 1;
	this.cache = {};
};

Context.prototype = {
	clone: function () {
		var clone = new Context(this.model);
        clone.transform = this.transform.clone();
        clone.graphics = this.graphics;
        clone.brightness = this.brightness;
		clone.cache = this.cache;
		return clone;
	},
	invoke: function (name) {
		this.model.draw(this, name);
	},
    drawPath: function (name, points, isCurve) {
        var points = this.transform.transformPoints(points);
		this.graphics.drawPath(name, points, isCurve);
    },
    transform: function (points) {return this.transform.transform(points)},
    set_x: function (dx) {this.transform.pretranslate(dx, 0)},
    set_y: function (dy) {this.transform.pretranslate(0, dy)},
	set_sx: function (sx) {this.transform.prescale(sx, 0)},
    set_sy: function (sy) {this.transform.prescale(0, sy)},
	set_size: function (s) {this.transform.prescale(s, s)},
	set_rotate: function (r) {this.transform.prerotate(r*Math.PI/180);},
    set_brightness: function (b) {
        this.brightness = b;
        this.graphics.setHsv(1, 0, b);
    }
};

function Graphics() {}

Graphics.prototype = {
    drawPath: function (message, points) {
        if (message == 'CIRCLE') points = points[0]+'...';
        print(message, points);
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
    
	transformPoints: function (points) {
		var result = [];
		var mx = this.m[0];
		var my = this.m[1];
		for (var i = 0; i < points.length; i++) {
			var x = points[i][0];
			var y = points[i][1];
			result.push([x*mx[0]+y*mx[1]+mx[2],
						 x*my[0]+y*my[1]+my[2]])
		}
        /*print('points');
        print(this.m);
        print(points);
        print(result);*/
		return result;
	},
    
    prescale: function(sx, sy) {
		var m = this.m;
		m[0][0] *= sx;
		m[1][0] *= sx;
		m[0][1] *= sy;
		m[1][1] *= sy;
	},
    
    pretranslate: function (dx, dy) {
        var m = this.m;
        m[0][2] += m[0][0]*dx+m[0][1]*dy;
        m[1][2] += m[1][0]*dx+m[1][1]*dy;
    },
    
    prerotate: function (theta) {
        var t = new Transform;
        var m = t.m;
        m[0][0] = m[1][1] = Math.cos(theta);
        m[0][1] = -(m[1][0] = Math.sin(theta));
        this.premultiply(t);
    },
    
    premultiply: function (a) {
        var b = this.clone();
        var ma = a.m;
        var mb = b.m;
        var m = this.m;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                var sum = ma[i][0]*mb[0][j];
                sum += ma[i][1]*mb[1][j];
                sum += ma[i][2]*mb[2][j];
                m[i][j] = sum;
            }
        }
        //print('*');
        //print 
    }
};

Model.prototype.draw = function (context, name) {
	if (!name) name = this.startName;
    var rule = this.choose(name);
    rule && rule.draw(context);
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
		context.drawPath("CIRCLE", pts, true);
	},
	SQUARE: function (context) {
		var pts = [[-.5,-.5], [-.5,.5], [.5,.5], [.5,-.5]];
		context.drawPath("SQUARE", pts);
	},
	TRIANGLE: function (context) {
        var dy = -0.5/Math.sqrt(3);
		var pts = [[-.5,.5+dy], [.5,.5+dy], [0, -.5+dy]];
		context.drawPath("TRIANGLE", pts);
	}
}