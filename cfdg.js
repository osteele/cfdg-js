//var interval_name = setInterval('draw()',100);
//clearInterval('animateShape()',500);

canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.save();
//ctx.translate(50, 50);
//ctx.scale(10, 10);

var Stats;
var State;

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
	this.ctx.translate(.5-(xmax+xmin)/2, .5-(ymin+ymax)/2);
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
	var mins = [State.xmin,State.ymin];
	var maxs = [State.xmax,State.ymax];
	if (State.xmin == null) {
		mins = [pts[0][0],pts[0][1]];
		maxs = [pts[0][0],pts[0][1]];
	}
	for (var dim in mins)
		for (var i = 0; i < pts.length; i++) {
			var x = pts[i][dim];
			mins[dim] = Math.min(mins[dim], x);
			maxs[dim] = Math.max(maxs[dim], x);
		}
	if (mins[0] < State.xmin || mins[1] < State.ymin ||
		maxs[0] > State.xmax || maxs[1] > State.ymax) {
		/*if (mins[0] < State.xmin) info('x ' + mins[0] + ' < ' + State.xmin);
		if (mins[1] < State.ymin) info('x ' + mins[1] + ' < ' + State.xmin);
		if (maxs[0] > State.xmax) info('x ' + maxs[0] + ' > ' + State.xmax);
		if (maxs[1] > State.ymax) info('x ' + maxs[1] + ' > ' + State.ymax);*/
		var xmin = mins[0], ymin = mins[1], xmax = maxs[0], ymax = maxs[1];
		var dx = xmax - xmin, dy = ymax - ymin;
		var firstTime = State.xmin == null;
		this.rescale = this.rescale || .33;
		var rs = this.rescale *= 1.1;
		if (firstTime || xmin < State.xmin) State.xmin = xmin - dx*rs;
		if (firstTime || ymin < State.ymin) State.ymin = ymin - dy*rs;
		if (firstTime || xmax > State.xmax) State.xmax = xmax + dx*rs;
		if (firstTime || ymax > State.ymax) State.ymax = ymax + dy*rs;
		if (State.xmin < State.xmax && State.ymin < State.ymax)
			rescaleFlag = true;
	}
};

Graphics.prototype.setRGB = function (rgb) {
	var s = '';
	for (var i in rgb)
		s += (s ? ',' : '') + Math.floor(255*rgb[i]);
	this.ctx.fillStyle = 'rgb(' + s + ')';
};

function drawNext() {
	if (rescaleFlag) {
		//info("scale to " + State.xmin + ", " + State.ymin + ", " + State.xmax + ", " + State.ymax);
		var s = .25*(State.xmax-State.xmin);
		//State.xmin -= s; State.xmax += s;
		var s = .25*(State.ymax-State.ymin);
		//State.ymin -= s; State.ymax += s;
		cxt.graphics.viewport(State.xmin, State.ymin, State.xmax, State.ymax);
		cxt.queue = [];
		model.randomGenerator.rewind();
		model.draw(cxt);
		Stats.shapeCount = 0;
		Stats.resetCount += 1;
		rescaleFlag = false;
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
	model.randomGenerator = new RepeatableRandom;
	cxt.graphics.setCanvas(document.getElementById("canvas"));
	var tm = cxt.transform.m;
	//tm[0][0] = tm[1][1] = 20;
	//tm[1][1] *= -1;
	//cxt.stats.cutoff *= Math.abs(tm[0][0] * tm[1][1]);
	//cxt.stats.cutoff /= 100;
	State = {xmin: null, xmax: null, ymin: null, ymax: null};
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
