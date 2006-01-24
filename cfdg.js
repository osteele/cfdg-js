//var interval_name = setInterval('draw()',100);
//clearInterval('animateShape()',500);

canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.save();
//ctx.translate(50, 50);
//ctx.scale(10, 10);

var State;

Shapes.UnitCircle = (new Transform().prescale(.5,.5)).
	transformPoints(makeCubicCircle());

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
	info("scale = " + scale);
	this.ctx.scale(scale, scale);
	this.ctx.translate(.5, .5);
};

Graphics.prototype.drawPolygon = function (pts) {
	this.drawPath(pts, false);
};

Graphics.prototype.drawCircle = function (center, radius, transform) {
	var pts = transform.transformPoints(Shapes.UnitCircle);
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
	if (mins[0] != State.xmin || mins[1] != State.ymin ||
		maxs[0] != State.xmax || maxs[1] != State.ymax) {
		State.xmin = mins[0]; State.ymin = mins[1];
		State.xmax = maxs[0]; State.ymax = maxs[1];
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
		cxt.graphics.viewport(State.xmin, State.ymin, State.xmax, State.ymax);
		cxt.queue = [];
		model.draw(cxt);
	}
	cxt.flush(100);
	if (cxt.queue.length)
		setTimeout('drawNext()', 10);
	else
		stopRendering();
}

function stopRendering() {
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
	cxt.graphics.setCanvas(document.getElementById("canvas"));
	var tm = cxt.transform.m;
	//tm[0][0] = tm[1][1] = 20;
	//tm[1][1] *= -1;
	//cxt.stats.cutoff *= Math.abs(tm[0][0] * tm[1][1]);
	cxt.stats.cutoff /= 100;
	State = {xmin: null, xmax: null, ymin: null, ymax: null};
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	model.draw(cxt);
	drawNext();
	document.getElementById('renderButton').style.display = 'none';
	document.getElementById('stopButton').style.display = 'inline';
}
