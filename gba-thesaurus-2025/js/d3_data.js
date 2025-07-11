// visual network implementation
"use strict";
var d3data = {
    visData: null,
    _uri: null,
    _lang: null,
    _itopic: false,

    init: function (afterInit, expandTo) {
        let urlParams = new URLSearchParams(window.location.search);
        let uri = urlParams.get('uri');
        let project = uri.split('/')[3];
        let lang = urlParams.get('lang');

        d3data._uri = uri;
        d3data._lang = lang;
        d3data._itopic = document.getElementById("itopic");

        this.prepareData(uri, lang, ws.endpoint, project, afterInit, expandTo);
    },
    setVisData: function (data) {
        d3data.visData = data;
    },
    prepareData: function (uri, lang, endpoint, project, afterInit, expandTo) {
        let query = `PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                                PREFIX dbpo:<http://dbpedia.org/ontology/>
                                                PREFIX so:<https://schema.org/>
                                                SELECT DISTINCT (COALESCE(?sC, '') AS ?sColor) (COALESCE(?sL, ?s) AS ?sLabel) ?s ?x ?o
                                                (COALESCE(?oL, ?o) AS ?oLabel) (COALESCE(?oC, '') AS ?oColor) ?sQ ?oQ
                                                @@from
                                                WHERE {
                                                ?s a skos:Concept
                                                VALUES ?p1 {skos:narrower skos:related skos:exactMatch skos:closeMatch skos:narrowMatch}
                                                VALUES ?p2 {skos:broadMatch}
                                                {?s ?p1 ?o BIND (?p1 AS ?x)}
                                                UNION
                                                {?o ?p2 ?s BIND (skos:narrowMatch AS ?x)}
                                                OPTIONAL {?s skos:prefLabel ?sL . FILTER(lang(?sL)='${lang}')}
                                                OPTIONAL {?o skos:prefLabel ?oL . FILTER(lang(?oL)='${lang}')}
                                                OPTIONAL {?s dbpo:colourHexCode ?sC}
                                                OPTIONAL {?o dbpo:colourHexCode ?oC}
                                                OPTIONAL {?s so:Quantity ?sQ}
                                                OPTIONAL {?o so:Quantity ?oQ}
                                                OPTIONAL {?s skos:notation ?sN}
                                                @@filter
                                                }
                                                ORDER BY ?sN`;
        if (!d3data.visData) {
            ws.projectJson(project, query, "s", function (jsonData) {
                d3data.visData = jsonData.results.bindings;
                //console.log(d3data.visData);

                d3data.createHierarchy(uri, expandTo);

                if (afterInit) {
                    afterInit(d3data.hRoot);
                }
            });
        } else {
            d3data.createHierarchy(uri, expandTo);

            if (afterInit) {
                afterInit(d3data.hRoot, d3data.fRoot);
            }
        }
    },

    createHierarchy: function (uri, expandTo) {
        d3data.hRoot = null;
        d3data.hIndex = [];
        d3data.fRoot = null;
        d3data.fIndex = [];
        if (d3data.visData.length == 0) {
            return;
        }
        let Id = 0;
        for (let i of d3data.visData) {
            let subject = i.s;
            let object = i.o;
            let o_color = i.oColor.value;
            let o_label = i.oLabel.value;
            let rel = i.x.value.split('#')[1];

            for (let pass = 0; pass < 2; pass++) {
                if (pass == 1 && !d3data.isLocalItem(object.value)) {
                    continue;
                }
                let index = pass === 0 ? d3data.hIndex : d3data.fIndex;
                let from = index[subject.value];
                let to = index[object.value];

                if (!from) {
                    let s = d3data.getLabel(i.sLabel.value);
                    let s_quantity = i.sQ ? Math.floor(i.sQ.value) : "1";
                    from = {
                        id: (++Id), label: s, itemStyle: { color: i.sColor.value }, name: s, color: i.sColor.value, title: subject.value, c: [], r: [], value: d3data.getQuantityValue(s_quantity), quantity: s_quantity
                    };
                    index[subject.value] = from;
                }
                if (!to) {
                    let s = d3data.getLabel(o_label);
                    let o_quantity = i.oQ ? Math.floor(i.oQ.value) : "1";
                    to = { id: (++Id), label: s, name: s, itemStyle: { color: o_color }, color: o_color, title: object.value, c: [], r: [], value: d3data.getQuantityValue(o_quantity), quantity: o_quantity };
                    index[object.value] = to;
                }
                if (!d3data.checkLoop(from, to)) {
                    from.c.push(to);
                    from.r.push(rel);
                }
                else {
                    let s = d3data.getLabel(o_label);
                    let o_quantity = i.oQ ? Math.floor(i.oQ.value) : "1";
                    to = { id: (++Id), label: s, name: s, itemStyle: { color: o_color }, color: o_color, title: object.value, c: [], r: [], value: d3data.getQuantityValue(o_quantity), quantity: o_quantity };
                    index[object.value] = to;
                    from.c.push(to);
                    from.r.push(rel);
                }
            }
        }
        d3data.hRoot = d3data.hIndex[uri];
        d3data.fRoot = d3data.fIndex[uri];
        if (!expandTo)
            expandTo = 2;
        d3data.expandHierarchy(d3data.hRoot, expandTo);
        d3data.expandHierarchy(d3data.fRoot, expandTo);
    },
    checkLoop: function (from, to) {
        if (to.c.length == 0) {
            return false;
        }
        for (let c of to.c) {
            if (c == from || d3data.checkLoop(from, c)) {
                return true;
            }
        }
        return false;
    },
    expandHierarchy: function (node, levels) {
        levels--;
        if (levels <= 0) {
            delete node.c;
            return;
        }
        if (node.c) {
            node.children = node.c;
            for (let c of node.children) {
                d3data.expandHierarchy(c, levels);
            };
            if (node.c.length > 0) {
                delete node.value;
            }
        }
    },
    getQuantityValue: function (quantity) {
        if (quantity > 1) {
            return quantity;
        }
        return 1;
    },
    getLabel: function (uri) {
        let Label = uri;
        let nodeText = uri;
        if (Label.includes('//')) {
            for (let i in d3data.abbrev) {
                if (Label.includes(d3data.abbrev[i])) {
                    Label = nodeText.split('/').pop() + ' (' + i + ')';
                    Label = (Label.charAt(0).toUpperCase() + Label.slice(1)).replace(/_/g, ' ');
                }
            }
        }
        return Label;
    },
    isLocalItem: function (uri) {
        return !uri.startsWith('http') || uri.indexOf("//resource.geo") >= 0;
    },

    abbrev: {
        INSPIRE: 'https://inspire.ec.europa.eu/codelist/',
        CGI: 'http://resource.geosciml.org/classifier/cgi/',
        ICS: 'http://resource.geosciml.org/classifier/ics/',
        DBpedia: 'dbpedia.org/resource/',
        BGS: 'http://data.bgs.ac.uk/id/EarthMaterialClass/',
        WIKIDATA: 'https://www.wikidata.org/entity/',
        GEMET: 'https://www.eionet.europa.eu/gemet/',
        GBA: 'https://resource.geolba.ac.at',
        GBA2: 'http://resource.geolba.at',
    }
};
