/* Copyright 2008 by Oliver Steele.  All rights reserved. */

$(function() {
    setup($("#canvas")[0]);
    var rendering = false;
    $('#renderButton').click(doRender);
    $('#stopButton').click(stopRendering);
});
