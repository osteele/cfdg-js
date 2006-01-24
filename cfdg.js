//var interval_name = setInterval('draw()',100);
//clearInterval('animateShape()',500);

canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.translate(50, 50);
ctx.scale(10, 10);
info('canvas = ' + canvas);

var State;

Shapes.UnitCircle = (new Transform().prescale(.5,.5)).
	transformPoints(makeCubicCircle());

Graphics.prototype.drawPolygon = function (pts) {
	this.drawPath(pts, false);
}

Graphics.prototype.drawPath = function (pts, isCubic) {
	alert('drawPath');
	canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
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
	if (State.xmin == null) {
		State.xmin = State.xmax = pts[0][0];
		State.ymin = State.ymax = pts[0][1];
	}
	for (var i = 0; i < pts.length; i++) {
		State.xmin = Math.min(State.xmin, pts[i][0]);
		State.xmax = Math.max(State.xmax, pts[i][0]);
		State.ymin = Math.min(State.ymin, pts[i][1]);
		State.ymax = Math.max(State.ymax, pts[i][1]);
	}
};

Graphics.prototype.setRGB = function (rgb) {
  canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var s = '';
  for (var i in rgb)
    s += (s ? ',' : '') + Math.floor(255*rgb[i]);
  ctx.fillStyle = 'rgb(' + s + ')';
};

function drawNext() {
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
  var m = new Model;
  var sourceText = document.getElementById("sourceField").value;
  var err = lex(sourceText, new Parser(new Builder(m)));
  if (err) {
    var msg = "syntax error at \'" + err.token + "\' on line " + err.lineno + ": " + err.message;
    alert(msg);
    return;
  }
  cxt = new Context(m);
  var tm = cxt.transform.m;
  //tm[0][0] = tm[1][1] = 20;
  //tm[1][1] *= -1;
  //cxt.stats.cutoff *= Math.abs(tm[0][0] * tm[1][1]);
  cxt.stats.cutoff /= 100;
  State = {xmin: null, xmax: null, ymin: null, ymax: null};
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  m.draw(cxt);
  drawNext();
  document.getElementById('renderButton').style.display = 'none';
  document.getElementById('stopButton').style.display = 'inline';
}
