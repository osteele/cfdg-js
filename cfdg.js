//var interval_name = setInterval('draw()',100);
//clearInterval('animateShape()',500);

canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.translate(50, 50);
ctx.scale(10, 10);

var State;

Shapes.CIRCLE = function (context) {
  // http://graphics.stanford.edu/courses/cs248-98-fall/Final/q1.html
  var a = .552;
  var pts = [
    [1,0],[1,a],[a,1],
    [0,1],[-a,1],[-1,a],
    [-1,0],[-1,-a],[-a,-1],
    [0,-1],[a,-1],[1,-a],[1,0]];
  // So that we can use 1's above, for readability:
  for (var i in pts) pts[i][0] /= 2;
  for (var i in pts) pts[i][1] /= 2;
  context.drawPath('CIRCLE', pts, 3);
}
Graphics.prototype.drawPath = function (msg, pts, curve) {
  canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++)
  if (curve) {
    ctx.bezierCurveTo(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1],
                      pts[i+2][0], pts[i+2][1]);
    i += 2;
  } else
     ctx.lineTo(pts[i][0], pts[i][1]);
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
}
function render() {
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
}
