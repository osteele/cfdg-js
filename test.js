load('parser.js');
load('model.js');
load('graphics.js');
load("drawing.js");
function info(msg) {print('Info: ' + msg)}
function error(msg) {print('Error: ' + msg)}
Graphics.prototype.drawPolygon = function (points) {
	print("polygon: " + points);
};
Graphics.prototype.drawCircle = function (center, radius, transform) {
	print("circle: " + transform.transformPoints(center));
};

function parse(string, mode) {
	var m = new Model;
	var err = lex(string, new Parser(new Builder(m)));
	if (err) {
        error("cfdg: syntax error at \'" + err.token + "\' on line " + err.lineno + ": " + err.message);
        return;
    }
	if (!mode) print(m.to_s());
	var cxt = new Context(m);
	if (mode=='draw') m.draw(cxt);
}

function draw(string) {
    return parse(string, 'draw')
}

draw("background {} rule R { SQUARE {s 2 * 2 1} }")
//draw("rule R { SQUARE {s 2 * 2 1} }")
