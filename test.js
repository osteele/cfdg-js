load('parser.js');
load('model.js');
load('graphics.js');
load("drawing.js");
//parse("startrule line rule line {\nTRIANGLE {s 2 3}\n}");
//parse("rule line {\nTRIANGLE [s 1 3]\nTRIANGLE [s 1 2 r 180]\n}");
//draw('rule r0 {TRIANGLE{}} rule r0 {SQUARE{}}')

/*draw('rule r0 {TRIANGLE{}}')
draw('rule r0 {TRIANGLE {s 2}}')
draw('rule r0 {TRIANGLE {sy 2}}')*/

//draw('rule r0 { CIRCLE {} } ')

//draw('rule SHAPES {\n\tSQUARE {}\n\tCIRCLE {b 0.3}\n\tTRIANGLE {b 0.5}\n\tTRIANGLE {r 60 b 0.7}\n}')

//draw("rule CHAPTER1 { SQUARE { x 2 y 5 size 3 } CIRCLE { x 6 y 5 size 3 } TRIANGLE { x 4 y 2 size 3 } SHAPES { y 1 size 3 }} rule SHAPES { SQUARE {} CIRCLE {b 0.3} TRIANGLE {b 0.5} TRIANGLE {r 60 b 0.7}}")

parse("rule s { TRIANGLE [ s 1 30 y 0.26 ] }")
//draw("rule s { TRIANGLE { s 1 30 y 0.26 } }")
