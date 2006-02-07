/* Copyright 2006 Oliver Steele.  All rights reserved. */

//var interval_name = setInterval('draw()',100);
//clearInterval('animateShape()',500);

canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.save();

var Stats;
var Bounds;

HalfUnitCircle = new Transform().prescale(.5,.5).
	transformPoints(makeCubicCircle());

var RepeatableRandom = function () {
	self.store = [];
	self.index = 0;
};

RepeatableRandom.prototype = {
	random: function () {
		if (self.index < self.store.length) return self.store[self.index++];
		return self.store[self.index++] = Math.random();
	},
	rewind: function () {
		self.index = 0;
	}
};

Graphics.prototype.setCanvas = function (canvas) {
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
};

Graphics.prototype.clear = function () {
	this.ctx.clearRect(0, 0, canvas.width, canvas.height);
};

Graphics.prototype.viewport = function (xmin, ymin, xmax, ymax) {
	var canvas = this.canvas;
	this.ctx.restore();
	this.clear();
	this.ctx.save();
	var scale = Math.min(canvas.width / (xmax - xmin),
						 canvas.height / (ymax - ymin));
	//info('scale = ' + scale);

	this.ctx.scale(scale, scale);
	this.ctx.translate(-xmin, -ymin);
	//this.ctx.translate(.5-(xmax+xmin)/2, .5-(ymin+ymax)/2);
};

Graphics.prototype.drawPolygon = function (pts) {
	Stats.shapeCount += 1;
	this.drawPath(pts, false);
};

Graphics.prototype.drawCircle = function (center, radius, transform) {
	Stats.shapeCount += 1;
	var pts = transform.transformPoints(HalfUnitCircle);
	this.drawPath(pts, true);
};

Graphics.prototype.drawPath = function (pts, isCubic) {
	var ctx = this.ctx;
	ctx.beginPath();
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (var i = 1; i < pts.length; i++) {
		var x = pts[i][0];
		var y = pts[i][1];
		if (isCubic) {
			var p1 = pts[++i];
			var p2 = pts[++i];
			ctx.bezierCurveTo(x, y, p1[0], p1[1], p2[0], p2[1]);
		} else
			ctx.lineTo(x, y);
	}
	ctx.fill();
	var mins = [Bounds.xmin,Bounds.ymin];
	var maxs = [Bounds.xmax,Bounds.ymax];
	if (Bounds.xmin == null) {
		mins = [pts[0][0],pts[0][1]];
		maxs = [pts[0][0],pts[0][1]];
	}
	for (var d in mins)
		for (var i = 0; i < pts.length; i++) {
			var x = pts[i][d];
			mins[d] = Math.min(mins[d], x);
			maxs[d] = Math.max(maxs[d], x);
		}
    expandBounds(mins[0], mins[1], maxs[0], maxs[1]);
};

function expandBounds(x0_, y0_, x1_, y1_) {
    var x0 = Bounds.xmin, y0 = Bounds.ymin, x1 = Bounds.xmax, y1 = Bounds.ymax;
    x0 = Math.min(x0, x0_);
    y0 = Math.min(y0, y0_);
    x1 = Math.max(x1, x1_);
    y1 = Math.max(y1, y1_);
    if (x0 != Bounds.xmin || y0 != Bounds.ymin ||
        x1 != Bounds.xmax || y1 != Bounds.ymax) {
        var rescale = .10; //this.rescale = this.rescale || .33;
        if (x0 < Bounds.xmin)
            x0 -= rescale * (Bounds.xmax - Bounds.xmin);
        if (Bounds.xmax < x1)
            x1 += rescale * (Bounds.xmax - Bounds.xmin);
        if (y0 < Bounds.xmin)
            y0 -= rescale * (Bounds.ymax - Bounds.ymin);
        if (Bounds.xmax < y1)
            y1 += rescale * (Bounds.ymax - Bounds.ymin);
        Bounds = {xmin: x0, ymin: y0, xmax: x1, ymax: y1, rescale: true};
    }
};

Graphics.prototype.setRGBA = function (rgba) {
	var s = '';
	for (var i = 0; i < 3; i++)
		s += (s ? ',' : '') + Math.floor(255*rgb[i]);
	this.ctx.fillStyle = 'rgb(' + s + ')';
	this.ctx.globalAlpha = rgba[3];
};

function drawNext() {
	if (Bounds.rescale) {
		//info("scale to " + Bounds.xmin + ", " + Bounds.ymin + ", " + Bounds.xmax + ", " + Bounds.ymax);
		cxt.graphics.viewport(Bounds.xmin, Bounds.ymin, Bounds.xmax, Bounds.ymax);
		cxt.queue = [];
		model.randomGenerator.rewind();
		model.draw(cxt);
		Stats.shapeCount = 0;
		Stats.resetCount += 1;
		Bounds.rescale = false;
	}
	cxt.flush(100);
	
	var t0 = Stats.startTime;
    var t1 = (new Date).getTime();
    var msg = "Rendered " + Stats.shapeCount + " shapes in " + Math.round((t1-t0)/1000) + "s.";
    if (cxt.queue.length)
		msg += "  " + cxt.queue.length + " expansions remaining.";
	if (Stats.resetCount) msg += " (Reset bounds " + Stats.resetCount + " times.)";
	statusField.innerHTML = msg;
	
	if (cxt.queue.length)
		setTimeout('drawNext()', 10);
	else
		stopRendering();
}

function stopRendering() {
	if (cxt.queue.length)
		statusField.innerHTML = "<font color='#ff0000'>Stopped rendering</font> at " + Stats.shapeCount + " shapes after " + Math.round(((new Date).getTime() - Stats.startTime)/1000) + "s, with " + cxt.queue.length + " expansions remaining.";
	
	cxt.queue = [];
	document.getElementById('renderButton').style.display = '';
	document.getElementById('stopButton').style.display = 'none';
}

function doRender() {
	model = new Model;
	var sourceText = document.getElementById("sourceField").value;
	var err = lex(sourceText, new Parser(new Builder(model)));
	if (err) {
		var msg = "syntax error at \'" + err.token + "\' on line " + err.lineno + ": " + err.message;
		alert(msg);
		return;
	}
	cxt = new Context(model);
	cxt.transform.m[1][1] *= -1;
	model.randomGenerator = new RepeatableRandom;
	cxt.graphics.setCanvas(document.getElementById("canvas"));
	var tm = cxt.transform.m;
	//tm[0][0] = tm[1][1] = 20;
	//tm[1][1] *= -1;
	//cxt.stats.cutoff *= Math.abs(tm[0][0] * tm[1][1]);
	//cxt.stats.cutoff /= 100;
	Bounds = {xmin: null, xmax: null, ymin: null, ymax: null};
	Stats = {startTime: (new Date).getTime(),
			 shapeCount: 0, resetCount: 0};
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	rescaleFlag = false;
	model.draw(cxt);
	drawNext();
	document.getElementById('renderButton').style.display = 'none';
	document.getElementById('stopButton').style.display = 'inline';
}
