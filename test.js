load('parser.js');
load('model.js');
load('graphics.js');
load("drawing.js");

Debug = {write: function(a) {print(a)}};

//draw("rule R { SQUARE {} R {s .5} }")

parse("rule R { SQUARE {flip 90} }")
