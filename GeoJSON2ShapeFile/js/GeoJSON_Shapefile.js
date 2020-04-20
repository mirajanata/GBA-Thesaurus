"use strict"

var gjsEsri = {

    transform: function (jsonObject) {
        this.files = [];
        this.files["Point"] = new PointGen();
        this.files["LineString"] = new LineStringGen();
        this.files["Polygon"] = new PolygonGen();
        this.files["MultiPoint"] = new MultiPointGen();
        this.files["MultiLineString"] = new MultiLineStringGen();
        this.files["MultiPolygon"] = new MultiPolygonGen();

        jsonObject.features.forEach(function (item, index) {
            gjsEsri.files[item.geometry.type].process(item);
        });
    }
};

class ShapeFileGen {
    constructor(geometry, shape) {
        this.geometry = geometry;
        this.points = [];
        this.partIndices = [];
        this.partCount = 0;

        this.AFTER_BOX_INDEX = 36;

        this.shpHeader = new ArrayBuffer(100);
        this.shpHeaderView = new DataView(this.shpHeader);
        this.shxHeader = new ArrayBuffer(100);
        this.shxHeaderView = new DataView(this.shxHeader);

        this.shpHeaderView.setInt32(0, 9994, false); //big
        this.shxHeaderView.setInt32(0, 9994, false); //big

        this.shpHeaderView.setInt32(28, 1000, true); //little
        this.shxHeaderView.setInt32(28, 1000, true); //little
        this.shpHeaderView.setInt32(32, shape, true); //little
        this.shxHeaderView.setInt32(32, shape, true); //little

        this.X1 = 9999;
        this.X2 = -9999;
        this.Y1 = -9999;
        this.Y2 = 9999;
    }
    checkBounds(X, Y) {
        if (this.X1 > X) this.X1 = X;
        if (this.X2 < X) this.X2 = X;
        if (this.Y1 < Y) this.Y1 = X;
        if (this.Y2 > Y) this.Y2 = Y;
    }
    writeBox() {
        this.shpView.setFloat64(4, this.X1, true);
        this.shpView.setFloat64(12, this.Y1, true);
        this.shpView.setFloat64(20, this.X2, true);
        this.shpView.setFloat64(28, this.Y2, true);
    }
    process(item) {

    }
    write() {
    }
    _writePolygonGeometry() {
        var pc = this.points.length;
        if (pc == 0)
            return;

        var size = 44 + (4 * this.partCount) + (8 * pc);
        this.shp = new ArrayBuffer(size);
        this.shpView = new DataView(this.shp);

        this.shpView.setInt32(0, this.shape, true);
        this.writeBox();
        this.shpView.setInt32(36, this.partCount, true);
        this.shpView.setInt32(40, pc / 2, true);
        for (var i = 0; i < this.partCount; i++)
            this.shpView.setInt32(44 + (4 * i), this.partIndices[i], true);
        var ofs = 44 + (4 * this.partCount);
        for (var i = 0; i < pc; i++)
            this.shpView.setFloat64(ofs + (8 * i), this.points[i], true);
    }
}


class PointGen extends ShapeFileGen {
    constructor() {
        super("Point", 1);
    }
    process(item) {
        var g = item.geometry.coordinates;
        points.push(g[0], g[1]);
    }
    write() {
        if (this.points.length == 0)
            return;

        this.shp = new ArrayBuffer(20);
        this.shpView = new DataView(this.shp);

        this.shpView.setInt32(0, this.shape, true);
        this.shpView.setFloat64(4, this.points[0], true);
        this.shpView.setFloat64(12, this.points[1], true);
    }
}
class LineStringGen extends ShapeFileGen {
    constructor() {
        super("LineString", 3);
    }
    process(item) {
        var g = item.geometry.coordinates;
        this.partIndices[this.partCount++] = this.points.length / 2;
        g.forEach(function (item, index) {
            this.checkBounds(item[0], item[1]);
            points.push(item[0], item[1]);
        });
    }
    write() {
        this._writePolygonGeometry();
    }
}
class PolygonGen extends ShapeFileGen {
    constructor() {
        super("Polygon", 5);
    }
    process(item) {
        var g = item.geometry.coordinates;
        g.forEach(function (pg, index) {
            this.partIndices[this.partCount++] = this.points.length / 2;
            pg.forEach(function (item, index) {
                points.push(item[0], item[1]);
            });
        });
    }
    write() {
        this._writePolygonGeometry();
    }
}
class MultiPointGen extends ShapeFileGen {
    constructor() {
        super("MultiPoint", 8);
    }
    process(item) {
        var g = item.geometry.coordinates;
        g.forEach(function (item, index) {
            this.checkBounds(item[0], item[1]);
            points.push(item[0], item[1]);
        });
    }
    _writePolygonGeometry() {
        var pc = this.points.length;
        if (pc == 0)
            return;

        var size = 40 + (8 * pc);
        this.shp = new ArrayBuffer(size);
        this.shpView = new DataView(this.shp);

        this.shpView.setInt32(0, this.shape, true);
        this.writeBox();
        this.shpView.setInt32(36, pc / 2, true);
        for (var i = 0; i < pc; i++)
            this.shpView.setFloat64(40 + (8 * i), this.points[i], true);
    }
}
class MultiLineStringGen extends ShapeFileGen {
    constructor() {
        super("MultiLineString", 3);
    }
    process(item) {
        var g = item.geometry.coordinates;
        g.forEach(function (ls, index) {
            this.partIndices[this.partCount++] = this.points.length / 2;
            ls.forEach(function (item, index) {
                this.checkBounds(item[0], item[1]);
                points.push(item[0], item[1]);
            });
        });
    }
    write() {
        this._writePolygonGeometry();
    }
}
class MultiPolygonGen extends ShapeFileGen {
    constructor() {
        super("MultiPolygon", 5);
    }
    process(item) {
        var g = item.geometry.coordinates;
        g.forEach(function (mpg, index) {
            mpg.forEach(function (pg, index) {
                this.partIndices[this.partCount++] = this.points.length / 2;
                pg.forEach(function (item, index) {
                    this.checkBounds(item[0], item[1]);
                    points.push(item[0], item[1]);
                });
            });
        });
    }
    write() {
        this._writePolygonGeometry();
    }
}