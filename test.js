load('parser.js');
load('model.js');
load('graphics.js');
load("drawing.js");

Debug = {write: function(a) {print(a)}};

//draw("rule R { SQUARE {} R {s .5} }")

//draw("rule R { SQUARE {} }");
//draw("rule R { SQUARE {flip 0} }");
//parse("rule R { SQUARE {flip 0} }")
parse("rule WELCOME {\n	VINEL { sat 1 hue 120\n		x 3 y -55\n		r 0 b 0.5 s 10\n	}\n}\n\n\nrule VINEL {\n	STEML { }\n	STEML { x 1 r 5 flip 0 }\n}\n\n\nrule STEML {\n	GOL { r 20 s 0.1 }\n	CIRCLE { s 0.2 r 120 hue 150\n		x 1.3 y -0.6 b -0.3}\n}\n\nrule GOL {\n	CIRCLE { }\n	GOL { x 0.3 r -1 s 0.985 }\n}")