function Graphics() {}

Graphics.prototype = {
    drawPath: function (message, points) {
        if (message == 'CIRCLE') points = points[0]+'...';
        print(message, points);
    },
    setRGB: function (rgb) {},
    setHSV: function (hsv) {
		var h = ((hsv[0] % 360) + 360) % 360;
		var s = Math.min(1, Math.max(0, hsv[1]));
		var v = Math.min(1, Math.max(0, hsv[2]));
		if (s == 0) return this.setRGB([v, v, v]);
		h = h / 60.0; // sector 0 to 5
		var i = Math.floor(h);
		var f = h - i;
		var p = v * (1 - s);
		var q = v * (1 - s * f);
		var t = v * (1 - s * (1 - f));
		var rgb = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i % 6];
		this.setRGB(rgb);
    }
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
        return;
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
