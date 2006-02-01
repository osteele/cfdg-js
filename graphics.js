function Graphics() {}

Graphics.prototype = {
    drawPolygon: function (points) {},
	drawCircle: function (center, radius, transform) {},
	drawPath: function (points) {},
    setRGBA: function (rgba) {},
    setHSV: function (hsva) { this.setRGBA(hsv2rgb(hsva).concat([hsva[3]])); },
	setBackground: function (rgb) {},
	setBackgroundHSV: function (hsv) {
		hsv = [hsv.hue, hsv.sat, hsv.brightness];
		this.setBackground(hsv2rgb(hsv));
	}
};

function hsv2rgb(hsv) {
	var h = ((hsv[0] % 360) + 360) % 360;
	var s = Math.min(1, Math.max(0, hsv[1]));
	var v = Math.min(1, Math.max(0, hsv[2]));
	if (s == 0) return [v, v, v];
	h = h / 60.0; // sector 0 to 5
	var i = Math.floor(h);
	var f = h - i;
	var p = v * (1 - s);
	var q = v * (1 - s * f);
	var t = v * (1 - s * (1 - f));
	return rgb = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i % 6];
}

function makeQuadraticCircle() {
	var pts = [[1, 0]];
	var theta = Math.PI/4;
	var rctl = 1/Math.cos(theta/2);
	var angle = 0;
	for (var i = 0; i < 8; i++) {
		angle += theta/2;
		pts.push([rctl*Math.cos(angle), rctl*Math.sin(angle)]);
		angle += theta/2;
		pts.push([Math.cos(angle), Math.sin(angle)]);
	}
	return pts;
}

function makeCubicCircle() {
	// http://graphics.stanford.edu/courses/cs248-98-fall/Final/q1.html
	var a = .552;
	a = (Math.sqrt(2)-1)*4/3;
	return [[1,0],
			[1,a],[a,1],[0,1],
			[-a,1],[-1,a],[-1,0],
			[-1,-a],[-a,-1],[0,-1],
			[a,-1],[1,-a],[1,0]];
}

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
    
    determinant: function () {
        var m = this.m;
        return m[0][0]*m[1][1]-m[0][1]*m[1][0];
    },

	transformPoints: function (points) {
		var result = new Array(points.length);
		var mx = this.m[0];
		var my = this.m[1];
		for (var i = 0; i < points.length; i++) {
			var x = points[i][0];
			var y = points[i][1];
			result[i] = [x*mx[0]+y*mx[1]+mx[2],
                         x*my[0]+y*my[1]+my[2]]
		}
		return result;
	},
    
    prescale: function(sx, sy) {
        var t = new Transform;
        var m = t.m;
        m[0][0] = sx;
        m[1][1] = sy;
        this.premultiply(t);
        return this;
        /* Postmultiplies:
        var m = this.m;
		m[0][0] *= sx;
		m[1][0] *= sx;
		m[0][1] *= sy;
		m[1][1] *= sy;*/
	},
    
    pretranslate: function (dx, dy) {
        var t = new Transform;
        var m = t.m;
        m[0][2] = dx;
        m[1][2] = dy;
        this.premultiply(t);
        return;
        /*var m = this.m;
        m[0][2] += m[0][0]*dx+m[0][1]*dy;
        m[1][2] += m[1][0]*dx+m[1][1]*dy;*/
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
        for (var i = 0; i <= 2; i++) {
            for (var j = 0; j <= 2; j++) {
                var sum = mb[i][0]*ma[0][j];
                sum += mb[i][1]*ma[1][j];
                sum += mb[i][2]*ma[2][j];
                m[i][j] = sum;
            }
        }
    },
    floor: function () {
        for (var i = 0; i <= 2; i++)
            for (var j = 0; j <= 2; j++)
                if (Math.abs(this.m[i][j]) < .01)
                    this.m[i][j] = 0;
    }
};
