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
        print('scale', sx, sy);
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
