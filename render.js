var shapeCount;

var HalfUnitCircle = (new Transform()).prescale(.5,.5).
	transformPoints(makeQuadraticCircle());

Graphics.prototype.drawPolygon = function (pts) {
	shapeCount += 1;
	dv.drawPath(pts);
};

Graphics.prototype.drawCircle = function (center, radius, transform) {
	shapeCount += 1;
	var pts = transform.transformPoints(HalfUnitCircle);
	dv.drawCurve(pts)
};

Graphics.prototype.setRGB = function (rgb) {
	var r = Math.floor(255*rgb[0]);
	var g = Math.floor(255*rgb[1]);
	var b = Math.floor(255*rgb[2]);
	dv.fillStyle = (r<<16)+(g<<8)+b;
};

var currentContext = null;
function startRendering() {
	dv.reset();
	shapeCount = 0;
	var t0 = (new Date).getTime();
	var m = new Model;
	var err = lex(sourceField.getText(), new Parser(new Builder(m)));
	if (err) {
        var msg = "syntax error at \'" + err.token + "\' on line " + err.lineno + ": " + err.message;
        statusField.setText(msg);
        return;
	}
	var cxt = new Context(m);
	var tm = cxt.transform.m;
	tm[0][0] = tm[1][1] = 20;
	tm[1][1] *= -1;
	cxt.stats.cutoff *= Math.abs(tm[0][0] * tm[1][1])/5;
	//Debug.write((new Date).getTime()-t0);
	t0 = (new Date).getTime();
	m.draw(cxt);
	dv.resetBounds();      
	dv.endFrame();
	var t1 = (new Date).getTime();
	appstate.setAttribute('rendering', {context: cxt, startTime: t0, lastBlit: t0});
}

function renderIdle() {
    var currentContext = appstate.rendering;
    var cxt = currentContext.context;
    cxt.stats.countdown = 10;
    cxt.flush(50);
    var t0 = currentContext.startTime;
    var t1 = (new Date).getTime();
    if (t1-currentContext.lastBlit > 10000) {
		dv.endFrame();
		currentContext.lastBlit = t1;
    }
    dv.resetBounds();
    var msg = "Rendered " + shapeCount + " shapes in " + Math.round((t1-t0)/1000) + "s.";
    if (cxt.queue.length)
		msg += "  " + cxt.queue.length + " expansions remaining."
			statusField.setText(msg);
    if (!cxt.queue.length) stopRendering(true);
}

function stopRendering(done) {
	if (!appstate.rendering) return;
	var currentContext = appstate.rendering;
	dv.endFrame();
	if (!done)
        statusField.setText("<font color='#ff0000'>Stopped rendering</font> at " + shapeCount + " shapes after " + Math.round(((new Date).getTime() - currentContext.startTime)/1000) + "s, with " + currentContext.context.queue.length + " expansions remaining.");
	appstate.setAttribute('rendering', false);
}
