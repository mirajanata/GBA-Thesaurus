"use strict"
/**
 * The singleton gjsEsri provides public transform() method for conversion of GeoJSON to zipped shapefile(s).
 * The shapefile can contain only the records of same type of geometry, so the transform() method generates standalon shapefile
 * 
 * Usage: gjsEsri.transformAndDownload(parsedGeoJSONObject, "zippedShapeFile.zip");
 * 
 * */
var gjsEsri = {

    /**
     * @param {any} jsonObject - input GeoJSON object
     * @param {any} resultZipFile - desired filename of output zip file
     */
    transformAndDownload: function (jsonObject, resultZipFile) {
        this.files = [];
        this.files["Point"] = new PointFileGen();
        this.files["LineString"] = new LineStringFileGen();
        this.files["Polygon"] = new PolygonFileGen();
        this.files["MultiPoint"] = new MultiPointFileGen();
        this.files["MultiLineString"] = new MultiLineStringFileGen();
        this.files["MultiPolygon"] = new MultiPolygonFileGen();

        jsonObject.features.forEach(function (item, index) {
            this.files[item.geometry.type].process(item);
        }, this);

        var zip = new JSZip();
        for (var fname in this.files) {
            var f = this.files[fname];
            if (f.records.length > 0) {
                f.writeShp();
                zip.file(f.getShpName(), f.shp);
                f.writeShx();
                zip.file(f.getShxName(), f.shx);
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
    /**
     * Low level record writer - bounding box
     */
    _recWriteBox: function (rec, shpView, offset) {
        var ofs = 8 + offset;
        shpView.setFloat64(4 + ofs, rec.X1, true);
        shpView.setFloat64(12 + ofs, rec.Y1, true);
        shpView.setFloat64(20 + ofs, rec.X2, true);
        shpView.setFloat64(28 + ofs, rec.Y2, true);
    },
    /**
     * Low level record writers - record length calculators
     */
    _recGetPointContentLength(rec) {
        return 20;
    },
    _recGetMultiPointContentLength(rec) {
        return 40 + (8 * rec.points.length);
    },
    _recGetPolygonContentLength(rec) {
        return 44 + (4 * rec.partCount) + (8 * rec.points.length);
    },
    /**
     * Low level record writers - geometries
     */
    _recWritePointGeometry(rec, shpView, offset, id) {
        if (rec.points.length == 0)
            return;
        // record header
        shpView.setInt32(0 + offset, id, false); //big record id
        shpView.setInt32(4 + offset, (gjsEsri._recGetPointContentLength(rec)) / 2, false); //big record len
        //record content
        var ofs = 8 + offset;
        shpView.setInt32(0 + ofs, rec.fileGen.shape, true);
        shpView.setFloat64(4 + ofs, rec.points[0], true);
        shpView.setFloat64(12 + ofs, rec.points[1], true);
    },
    _recWritePolygonGeometry(rec, shpView, offset, id) {
        var pc = rec.points.length;
        if (pc == 0)
            return;

        // record header
        shpView.setInt32(0 + offset, id, false); //big record id
        shpView.setInt32(4 + offset, (gjsEsri._recGetPolygonContentLength(rec)) / 2, false); //big record len
        //record content
        var ofs = 8 + offset;
        shpView.setInt32(0 + ofs, rec.fileGen.shape, true);
        gjsEsri._recWriteBox(rec, shpView, offset);
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
        shpView.setInt32(4 + offset, (gjsEsri._recGetMultiPointContentLength(rec)) / 2, false); //big record len
        //record content
        var ofs = 8 + offset;
        shpView.setInt32(0 + ofs, rec.fileGen.shape, true);
        gjsEsri._recWriteBox(rec, shpView, offset);
        shpView.setInt32(36 + ofs, pc / 2, true);
        ofs = 8 + 40 + offset;
        for (var i = 0; i < pc; i++)
            shpView.setFloat64(ofs + (8 * i), rec.points[i], true);
    }
};

/**
 * Shapefile record class
 *
 * */
class ShapeRecord {
    constructor(fileGen, item) {
        this.fileGen = fileGen;
        this.points = [];
        this.partIndices = [];
        this.partCount = 0;

        this.X1 = 9999;
        this.X2 = -9999;
        this.Y1 = -9999;
        this.Y2 = 9999;

        fileGen.records.push(this);

        this.properties = [];
        if (item.properties) {
            for (var pname in item.properties) {
                fileGen.propertyNames[pname] = pname;
                var val = this.toUTF8Array(item.properties[pname]);
                this.properties[pname] = val;
                var len = val ? val.length : 0;
                if (len > 250)
                    fileGen.useCSV = true;
                if (!fileGen.propertyLengths[pname] || fileGen.propertyLengths[pname] < len)
                    fileGen.propertyLengths[pname] = len;
            }
        }
    }
    checkBounds(X, Y) {
        if (this.X1 > X) this.X1 = X;
        if (this.X2 < X) this.X2 = X;
        if (this.Y1 < Y) this.Y1 = Y;
        if (this.Y2 > Y) this.Y2 = Y;
    }
    toUTF8Array(str) {
        if (!str) return null;
        switch (typeof str) {
            case "number": return str.toString();
            case "boolean": return str ? "1" : "0";
            case "object": return str.toString();
        }
        var utf8 = [];
        for (var i = 0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6),
                    0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                // UTF-16 encodes 0x10000-0x10FFFF by
                // subtracting 0x10000 and splitting the
                // 20 bits of 0x0-0xFFFFF into two halves
                charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                    | (str.charCodeAt(i) & 0x3ff));
                utf8.push(0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            }
        }
        return utf8;
    }
}


/**
 * Shapefile generator base class
 * 
 * */
class ESRIFileGen {
    constructor(geometry, shape) {
        this.geometry = geometry;
        this.shape = shape;
        this.records = [];

        this.X1 = 9999;
        this.X2 = -9999;
        this.Y1 = -9999;
        this.Y2 = 9999;

        this.propertyNames = [];
        this.propertyLengths = [];
        this.useCSV = false;
    }
    checkBounds(X, Y) {
        if (this.X1 > X) this.X1 = X;
        if (this.X2 < X) this.X2 = X;
        if (this.Y1 < Y) this.Y1 = Y;
        if (this.Y2 > Y) this.Y2 = Y;
    }

    process(item) {
    }


    getShpName() {
        return this.geometry + ".shp";
    }
    getShxName() {
        return this.geometry + ".shx";
    }
    getShxSize() {
        var s = 100 + (8 * this.records.length);
        return s;
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
            this.checkBounds(item.X1, item.Y1);
            this.checkBounds(item.X2, item.Y2);
            this._writeGeometry(item, this.shpView, offset, id);
            offset += (8 + this._getContentLength(item));
            id++;
        }, this);

        this._writeShpxHeader(this.shpView, size);
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

        this._writeShpxHeader(this.shxView, size);
    }
    _writeShpxHeader(dataView, size) {
        dataView.setInt32(0, 9994, false); //big
        dataView.setInt32(24, size / 2, false); //filesize - big
        dataView.setInt32(28, 1000, true); //little
        dataView.setInt32(32, this.shape, true); //little
        dataView.setFloat64(36, this.X1, true);
        dataView.setFloat64(44, this.Y2, true);
        dataView.setFloat64(52, this.X2, true);
        dataView.setFloat64(60, this.Y1, true);
    }

    _writeDBF() {

    }
    _writeCSV() {

    }
}

/**
 * Shapefile generators implementing all GeoJSON geometries
 *
 * */

class PointFileGen extends ESRIFileGen {
    constructor() {
        super("Point", 1);

        this._writeGeometry = gjsEsri._recWritePointGeometry;
        this._getContentLength = gjsEsri._recGetPointContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;

        this.checkBounds(item[0], item[1]);
        var rec = new ShapeRecord(this, item);
        rec.checkBounds(item[0], item[1]);
        rec.points.push(g[0], g[1]);
    }
}
class LineStringFileGen extends ESRIFileGen {
    constructor() {
        super("LineString", 3);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord(this, item);
        rec.partIndices[rec.partCount++] = rec.points.length / 2;
        g.forEach(function (item, index) {
            rec.checkBounds(item[0], item[1]);
            rec.points.push(item[0], item[1]);
        }, this);
    }
}
class PolygonFileGen extends ESRIFileGen {
    constructor() {
        super("Polygon", 5);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord(this, item);
        g.forEach(function (pg, index) {
            rec.partIndices[rec.partCount++] = rec.points.length / 2;
            pg.forEach(function (item, index) {
                rec.checkBounds(item[0], item[1]);
                rec.points.push(item[0], item[1]);
            }, this);
        }, this);
    }
}
class MultiPointFileGen extends ESRIFileGen {
    constructor() {
        super("MultiPoint", 8);
        this._writeGeometry = gjsEsri._recWriteMultiPointGeometry;
        this._getContentLength = gjsEsri._recGetMultiPointContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord(this, item);
        g.forEach(function (item, index) {
            rec.checkBounds(item[0], item[1]);
            rec.points.push(item[0], item[1]);
        }, this);
    }
}
class MultiLineStringFileGen extends ESRIFileGen {
    constructor() {
        super("MultiLineString", 3);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord(this, item);
        g.forEach(function (ls, index) {
            rec.partIndices[rec.partCount++] = rec.points.length / 2;
            ls.forEach(function (item, index) {
                rec.checkBounds(item[0], item[1]);
                rec.points.push(item[0], item[1]);
            }, this);
        });
    }
}
class MultiPolygonFileGen extends ESRIFileGen {
    constructor() {
        super("MultiPolygon", 5);
        this._writeGeometry = gjsEsri._recWritePolygonGeometry;
        this._getContentLength = gjsEsri._recGetPolygonContentLength;
    }
    process(item) {
        var g = item.geometry.coordinates;
        var rec = new ShapeRecord(this, item);
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