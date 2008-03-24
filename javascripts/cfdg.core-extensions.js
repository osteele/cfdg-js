/* Copyright 2006 Oliver Steele.  All rights reserved. */

Array.prototype.include = function(item) {
	for (var i = this.length; --i >= 0; )
		if (this[i] == item)
			return true;
	return false;
};

// Flash can't split on regular expressions, or we could split on /\n|\r/
String.prototype.split2 = function(a, b) {
	var lines = this.split(a);
    for (var i = 0; i < lines.length; i++)
        lines.splice.apply(lines, [i, 1].concat(lines[i].split(b)));
    return lines;
};

String.prototype.lines = function() {return this.split2('\r', '\n');};
String.prototype.words = function() {return this.split2(' ', '\t');};
