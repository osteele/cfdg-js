load('parser.js');
load('model.js');
load('graphics.js');
load("drawing.js");
Debug = {write: function(a) {print(a)}};

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

//draw("rule R { SQUARE {} R {s .5} }")

lex('rule EITHER {BL{flip 90}}')