"use strict"

var gjsEsri = {

    transform: function (jsonObject, resultZipFile) {
        this.files = [];
        this.files["Point"] = new PointGen();
        this.files["LineString"] = new LineStringGen();
        this.files["Polygon"] = new PolygonGen();
        this.files["MultiPoint"] = new MultiPointGen();
        this.files["MultiLineString"] = new MultiLineStringGen();
        this.files["MultiPolygon"] = new MultiPolygonGen();

        jsonObject.features.forEach(function (item, index) {
            gjsEsri.files[item.geometry.type].process(item);
        }, this);

        var zip = new JSZip();
        for (var f in this.files) {
            if (f.records.length > 0) {
                f.writeShp();
                zip.file(f.getShpName(), f.shp);
            }
        }

        if (!resultZipFile)
            resultZipFile = "result.zip";
        zip.generateAsync({ type: "blob" }).then(function (blob) { // 1) generate the zip file
            saveAs(blob, resultZipFile);                          // 2) trigger the download
        }, function (err) {
            jQuery("#blob").text(err);
        });
    },


    _recWriteBox: function (rec, shpView, offset) {
        var ofs = 8 + offset;
        shpView.setFloat64(4 + ofs, rec.X1, true);
        shpView.setFloat64(12 + ofs, rec.Y1, true);
        shpView.setFloat64(20 + ofs, rec.X2, true);
        shpView.setFloat64(28 + ofs, rec.Y2, true);
    },
    _recGetPointContentLength(rec) {
        return 20;
    },
    _recGetMultiPointContentLength(rec) {
        return 40 + (8 * rec.points.length);
    },
    _recGetPolygonContentLength(rec) {
        return 44 + (4 * rec.partCount) + (8 * rec.points.length);
    },
    _recWritePointGeometry(rec, shpView, offset, id) {
        if (rec.points.length == 0)
            return;
        // record header
        shpView.setInt32(0 + offset, id, false); //big record id
        shpView.setInt32(4 + offset, (rec._recGetPointContentLength(rec)) / 2, false); //big record len
        //record content
        var ofs = 8 + offset;
        shpView.setInt32(0 + ofs, rec.shape, true);
        shpView.setFloat64(4 + ofs, rec.points[0], true);
        shpView.setFloat64(12 + ofs, rec.points[1], true);
    },
    _recWritePolygonGeometry(rec, shpView, offset, id) {
        var pc = rec.points.length;
        if (pc == 0)
            return;

        // record header
        shpView.setInt32(0 + offset, id, false); //big record id
        shpView.setInt32(4 + offset, (this._recGetPolygonContentLength(rec)) / 2, false); //big record len
        //record content
        var ofs = 8 + offset;
        shpView.setInt32(0 + ofs, rec.shape, true);
        this._recWriteBox(shpView, offset);
        shpView.setInt32(36 + ofs, rec.partCount, true);
        shpView.setInt32(40 + ofs, pc / 2, true);
        ofs = 8 + 44 + offset;
        for (var i = 0; i < rec.partCount; i++)
            shpView.setInt32(ofs + (4 * i), rec.partIndices[i], true);
        ofs = 8 + 44 + offset + (4 * rec.partCount);
        for (var i = 0; i < pc; i++)
            shpView.setFloat64(ofs + (8 * i), rec.points[i], true);
    },
    _writeMultiPointGeometry(rec, shpView, offset) {
        var pc = rec.points.length;
        if (pc == 0)
            return;

        // record header
        shpView.setInt32(0 + offset, id, false); //big record id
        shpView.setInt32(4 + offset, (this._recGetMultiPointContentLength(rec)) / 2, false); //big record len
        //record content
        var ofs = 8 + offset;
        shpView.setInt32(0 + ofs, rec.shape, true);
        this._recWriteBox(shpView, offset);
        shpView.setInt32(36 + ofs, pc / 2, true);
        ofs = 8 + 40 + offset;
        for (var i = 0; i < pc; i++)
            shpView.setFloat64(ofs + (8 * i), rec.points[i], true);
    }
};

class ESRIFileGen {
    constructor(geometry, shape) {
        this.geometry = geometry;
        this.records = [];

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
    getShpName() {
        return this.geometry + ".shp";
    }
    getShxName() {
        return this.geometry + ".shx";
    }
    getShxSize() {
        var s = 100 * this.records.length;
        return s;
    }

    process(item) {
    }
    getShpSize() {
        var s = 100;
        this.records.forEach(function (item, index) {
            s += 8 + this._getContentLength(item);
        }, this);
        return s;
    }
    writeShp() {
        if (this.records.length == 0)
            return;

        var size = this.getShpSize();
        this.shp = new ArrayBuffer(size);
        this.shpView = new DataView(this.shp);

        var offset = 100;
        var id = 1;
        this.records.forEach(function (item, index) {
            this._writeGeometry(item, this.shpView, offset, id);
            offset += (8 + this._getContentLength(item));
            id++;
        }, this);

        this._writeHeader(this.shpView, size);
    }
    writeShx() {
        if (this.records.length == 0)
            return;

        var size = this.getShxSize();
        this.shx = new ArrayBuffer(size);
        this.shxView = new DataView(this.shx);

        var offset = 100;
        var ioffset = 100;
        var id = 1;
        this.records.forEach(function (item, index) {
            this.shxView.setInt32(0 + offset, ioffset / 2, false); //big record id
            var size = this._getContentLength(item);
            this.shxView.setInt32(4 + offset, size / 2, false); //big record id
            ioffset += 8 + size;
            offset += 8;
            id++;
        }, this);

        this._writeHeader(this.shxView, size);
    }


    _writeHeader(dataView, size) {
        dataView.setInt32(0, 9994, false); //big
        dataView.setInt32(24, 100 + size, false); //filesize - big
        dataView.setInt32(28, 1000, true); //little
        dataView.setInt32(32, shape, true); //little
        dataView.setFloat64(36, this.X1, true);
        dataView.setFloat64(44, this.Y2, true);
        dataView.setFloat64(52, this.X2, true);
        dataView.setFloat64(60, this.Y1, true);
    }
}

class ShapeRecord {
    constructor() {
        this.points = [];
        this.partIndices = [];
        this.partCount = 0;

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
}

class PointGen extends ESRIFileGen {
    constructor() {
        super("Point", 1);

        this._writeGeometry = gjsEsri._recWritePointGeometry;
        this._getContentLength = gjsEsri._recGetPointContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;

        this.checkBounds(item[0], item[1]);
        var rec = new ShapeRecord();
        this.records.push(rec);
        rec.checkBounds(item[0], item[1]);
        rec.points.push(g[0], g[1]);
    }
}
class LineStringGen extends ESRIFileGen {
    constructor() {
        super("LineString", 3);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord();
        this.records.push(rec);
        rec.partIndices[rec.partCount++] = rec.points.length / 2;
        g.forEach(function (item, index) {
            rec.checkBounds(item[0], item[1]);
            rec.points.push(item[0], item[1]);
        }, this);
    }
}
class PolygonGen extends ESRIFileGen {
    constructor() {
        super("Polygon", 5);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord();
        this.records.push(rec);
        g.forEach(function (pg, index) {
            rec.partIndices[rec.partCount++] = rec.points.length / 2;
            pg.forEach(function (item, index) {
                rec.checkBounds(item[0], item[1]);
                rec.points.push(item[0], item[1]);
            }, this);
        }, this);
    }
}
class MultiPointGen extends ESRIFileGen {
    constructor() {
        super("MultiPoint", 8);
        this._writeGeometry = gjsEsri._recWriteMultiPointGeometry;
        this._getContentLength = gjsEsri._recGetMultiPointContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord();
        this.records.push(rec);
        g.forEach(function (item, index) {
            rec.checkBounds(item[0], item[1]);
            rec.points.push(item[0], item[1]);
        }, this);
    }
}
class MultiLineStringGen extends ESRIFileGen {
    constructor() {
        super("MultiLineString", 3);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord();
        this.records.push(rec);
        g.forEach(function (ls, index) {
            rec.partIndices[rec.partCount++] = rec.points.length / 2;
            ls.forEach(function (item, index) {
                rec.checkBounds(item[0], item[1]);
                rec.points.push(item[0], item[1]);
            }, this);
        });
    }
}
class MultiPolygonGen extends ESRIFileGen {
    constructor() {
        super("MultiPolygon", 5);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord();
        this.records.push(rec);
        g.forEach(function (mpg, index) {
            mpg.forEach(function (pg, index) {
                rec.partIndices[rec.partCount++] = rec.points.length / 2;
                pg.forEach(function (item, index) {
                    rec.checkBounds(item[0], item[1]);
                    rec.points.push(item[0], item[1]);
                }, this);
            }, this);
        }, this);
    }
}