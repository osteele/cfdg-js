/* Copyright 2006 Oliver Steele.  All rights reserved. */

//var interval_name = setInterval('draw()',100);
//clearInterval('animateShape()',500);

canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.save();

var Stats;
var NewBounds;

function Bounds(xmin, ymin, xmax, ymax) {
    this.xmin = xmin;
    this.ymin = ymin;
    this.xmax = xmax;
    this.ymax = ymax;
}

Bounds.prototype.equals = function(bounds) {
    return this.xmin == bounds.xmin &&
    this.ymin == bounds.ymin &&
    this.xmax == bounds.xmax &&
    this.ymax == bounds.ymax;
}

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

Graphics.prototype.reset = function () {
    this.setRGBA([0,0,0,1]);
}

Graphics.prototype.clear = function () {
	this.ctx.clearRect(0, 0, canvas.width, canvas.height);
};

Graphics.prototype.setViewport = function (bounds) {
	var canvas = this.canvas;
    var xmin = bounds.xmin, ymin = bounds.ymin;
    var xmax = bounds.xmax, ymax = bounds.ymax;
	this.ctx.restore();
	this.clear();
	this.ctx.save();
	var scale = Math.min(canvas.width / (xmax - xmin),
						 canvas.height / (ymax - ymin));
	//info('scale = ' + scale);

	this.ctx.scale(scale, scale);
	this.ctx.translate(-xmin, -ymin);
    this.viewport = bounds;
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
    var xmin = this.bounds.xmin, ymin = this.bounds.ymin;
    var xmax = this.bounds.xmax, ymax = this.bounds.ymax;
    for (var i = 0; i < pts.length; i++) {
        var x = pts[i][0];
        var y = pts[i][1];
        xmin = Math.min(xmin, x);
        ymin = Math.min(ymin, y);
        xmax = Math.max(xmax, x);
        ymax = Math.max(ymax, y);
    }
    this.bounds = new Bounds(xmin, ymin, xmax, ymax);
};

Graphics.prototype.setRGBA = function (rgba) {
	var s = '';
	for (var i = 0; i < 3; i++)
		s += (s ? ',' : '') + Math.floor(255*rgba[i]);
	this.ctx.fillStyle = 'rgb(' + s + ')';
	this.ctx.globalAlpha = rgba[3];
};

function doRender() {
	model = new Model;
	var sourceText = document.getElementById("sourceField").value;
	var err = lex(sourceText, new Parser(new Builder(model)));
	if (err) {
		var msg = "syntax error at \'" + err.token + "\' on line " + err.lineno + ": " + err.message;
		alert(msg);
		return;
	}
	drawingContext = new Context(model); // global
	drawingContext.transform.m[1][1] *= -1;
	model.randomGenerator = new RepeatableRandom;
    var graphics = drawingContext.graphics;
	graphics.setCanvas(document.getElementById("canvas"));
    graphics.reset();
    graphics.rescale = 0.25;
	var tm = drawingContext.transform.m;
	//tm[0][0] = tm[1][1] = 20;
	//tm[1][1] *= -1;
	//drawingContext.stats.cutoff *= Math.abs(tm[0][0] * tm[1][1]);
	//drawingContext.stats.cutoff /= 100;
    bounds = new Bounds(0, 0, 0, 0);
	drawingContext.graphics.setViewport(bounds);
	drawingContext.graphics.bounds = bounds;
	Stats = {
        startTime: (new Date).getTime(),
        shapeCount: 0,
        resetCount: 0
    };
	model.draw(drawingContext);
	drawNext();
	document.getElementById('renderButton').style.display = 'none';
	document.getElementById('stopButton').style.display = 'inline';
}

function drawNext() {
    if (drawingContext == null) return; // if stopRendering has been called
    var graphics = drawingContext.graphics;
    var oldBounds = graphics.viewport;
    var newBounds = graphics.bounds;
	if (!newBounds.equals(oldBounds)) {
        var w = newBounds.xmax - newBounds.xmin;
        var h = newBounds.ymax - newBounds.ymin;
        var rescale = graphics.rescale;
        graphics.rescale += 0.05;
        if (newBounds.xmin < oldBounds.xmin) newBounds.xmin -= rescale * w;
        if (newBounds.ymin < oldBounds.ymin) newBounds.ymin -= rescale * h;
        if (newBounds.xmax > oldBounds.xmax) newBounds.xmax += rescale * w;
        if (newBounds.ymax > oldBounds.ymax) newBounds.ymax += rescale * h;
		//info("scale to " + Bounds.xmin + ", " + Bounds.ymin + ", " + Bounds.xmax + ", " + Bounds.ymax);
        w = newBounds.xmax - newBounds.xmin;
        h = newBounds.xmax - newBounds.xmin;
        var ar = w / h;
        var car = graphics.canvas.width / graphics.canvas.height;
        //if (ar > car) 
		graphics.setViewport(newBounds);
        graphics.bounds = newBounds;
		drawingContext.queue = [];
		model.randomGenerator.rewind();
		Stats.shapeCount = 0;
		Stats.resetCount += 1;
		model.draw(drawingContext);
	}
	drawingContext.flush(100);
	
	var t0 = Stats.startTime;
    var t1 = (new Date).getTime();
    var msg = "Rendered " + Stats.shapeCount + " shapes in " + Math.round((t1-t0)/1000) + "s.";
    if (drawingContext.queue.length)
		msg += "  " + drawingContext.queue.length + " expansions remaining.";
	if (Stats.resetCount) msg += " (Reset bounds " + Stats.resetCount + " time"+(Stats.resetCount==1?'':'s')+".)";
	statusField.innerHTML = msg;
	
	if (drawingContext.queue.length)
		setTimeout('drawNext()', 10);
	else
		stopRendering();
}

function stopRendering() {
	if (drawingContext.queue.length)
		statusField.innerHTML = "<font color='#ff0000'>Stopped rendering</font> at " + Stats.shapeCount + " shapes after " + Math.round(((new Date).getTime() - Stats.startTime)/1000) + "s, with " + drawingContext.queue.length + " expansions remaining.";
	
	drawingContext.queue = [];
    drawingContext = null;
	document.getElementById('renderButton').style.display = '';
	document.getElementById('stopButton').style.display = 'none';
}
