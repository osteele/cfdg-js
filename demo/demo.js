/* Copyright 2008 by Oliver Steele.  All rights reserved. */

$(function() {
    CFDG.Driver.setup({
        canvas: $("#canvas")[0],
        onstart: function() { $('body').addClass('rendering') },
        onstop: function() { $('body').removeClass('rendering') },
        onstatus: function(msg) {
	        $('#statusField').html(msg);
        },
        onerror: function(msg) {
            alert(msg);
        }
    });
    var rendering = false;
    $('#renderButton').click(function() {
        CFDG.Driver.start($('#sourceField')[0].value);
    });
    $('#stopButton').click(function() {
        CFDG.Driver.stop();
    });
});
