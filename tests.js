function test() {
    function report(msg) {
        var pts0 = [[1,0],[0,1]];
        var pts = t.transformPoints(pts0);
        msg += ": ";
        for (var i = 0; i < pts.length; i++) {
            if (i) msg += ", ";
            msg += pts0[i] + "->" + pts[i];
        }
        print(msg);
    }
    var t = new Transform;
    t.prerotate(Math.PI/2);
    t.prescale(30,10);
    t.floor();
    report("s 30 10 r 90")
    t = new Transform;
    t.prescale(30,10);
    t.prerotate(Math.PI/2);
    t.floor();
    report("r 90 s 30 10");
}
