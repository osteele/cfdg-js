load('parser.js');
load("drawing.js");
//parse("startrule line rule line {\nTRIANGLE {s 2 3}\n}");
//parse("rule line {\nTRIANGLE [s 1 3]\nTRIANGLE [s 1 2 r 180]\n}");
//draw('rule r0 {TRIANGLE{}} rule r0 {SQUARE{}}')

/*draw('rule r0 {TRIANGLE{}}')
draw('rule r0 {TRIANGLE {s 2}}')
draw('rule r0 {TRIANGLE {sy 2}}')*/

draw('rule r0 10 { SQUARE {sx 1} } rule r0 { TRIANGLE {sx 1} }')
