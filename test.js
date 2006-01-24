load('parser.js');
load('model.js');
load('graphics.js');
load("drawing.js");

Debug = {write: function(a) {print(a)}};

//draw("rule R { SQUARE {} R {s .5} }")

draw('rule R {SQUARE {skew 0 45 sat 1 b 1}}')