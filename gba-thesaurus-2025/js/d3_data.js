// visual network implementation
"use strict";
var d3data = {
    visData: {},
    _uri: null,
    _lang: null,
    _itopic: false,

    init: function (afterRead) {
        let urlParams = new URLSearchParams(window.location.search);
        let uri = urlParams.get('uri');
        let project = uri.split('/')[3];
        let lang = urlParams.get('lang');

        d3data._uri = uri;
        d3data._lang = lang;
        d3data._itopic = document.getElementById("itopic");




        this.createNetwork(uri, lang, ws.endpoint, project, afterRead);
    },
    createNetwork: function (uri, lang, endpoint, project, afterRead) {
        let query = `PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                                PREFIX dbpo:<http://dbpedia.org/ontology/>
                                                SELECT DISTINCT (COALESCE(?sC, '') AS ?sColor) (COALESCE(?sL, ?s) AS ?sLabel) ?s ?x ?o
                                                (COALESCE(?oL, ?o) AS ?oLabel) (COALESCE(?oC, '') AS ?oColor)
                                                WHERE {
                                                VALUES ?p1 {skos:narrower skos:related skos:exactMatch skos:closeMatch skos:narrowMatch}
                                                VALUES ?p2 {skos:broadMatch}
                                                {?s ?p1 ?o BIND (?p1 AS ?x)}
                                                UNION
                                                {?o ?p2 ?s BIND (skos:narrowMatch AS ?x)}
                                                OPTIONAL {?s skos:prefLabel ?sL . FILTER(lang(?sL)='${lang}')}
                                                OPTIONAL {?o skos:prefLabel ?oL . FILTER(lang(?oL)='${lang}')}
                                                OPTIONAL {?s dbpo:colourHexCode ?sC}
                                                OPTIONAL {?o dbpo:colourHexCode ?oC}
                                                }
                                                ORDER BY ?sL`;

        ws.projectJson(project, query, function (jsonData) {
            d3data.visData = jsonData.results.bindings;
            //console.log(d3data.visData);

            d3data.createHierarchy(uri);

            if (afterRead) {
                afterRead(d3data.hRoot);
            } else {
                d3data.drawNetwork();
            }
        });
    },

    createHierarchy: function (uri) {
        d3data.hRoot = null;
        d3data.hIndex = [];
        if (d3data.visData.length == 0) {
            return;
        }
        d3data.visData.forEach((i) => {
            let from = d3data.hIndex[i.s.value];
            let to = d3data.hIndex[i.o.value];
            if (!from) {
                let s = d3data.getLabel(i.sLabel.value);
                from = {
                    label: s, name: s, color: i.sColor.value, title: i.s.value, c: [], r: [], value: 1
                };
                d3data.hIndex[i.s.value] = from;
            }
            if (!to) {
                let s = d3data.getLabel(i.oLabel.value);
                to = { label: s, name: s, color: i.oColor.value, title: i.o.value, c: [], r: [], value: 1 };
                d3data.hIndex[i.o.value] = to;
                to.parent = from;
            }
            if (from.parent != to) {
                from.c.push(to);
                from.r.push(i.x.value.split('#')[1]);
            } else {
                // do nothing
                from = from;
            }
        });
        d3data.hRoot = d3data.hIndex[uri];
        d3data.expandHierarchy(d3data.hRoot, 2);
    },
    expandHierarchy: function (node, levels) {
        node.children = node.c;
        levels--;
        if (levels > 0) {
            node.children.forEach((c) => {
                d3data.expandHierarchy(c, levels);
            });
        }
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

    abbrev: {
        INSPIRE: 'https://inspire.ec.europa.eu/codelist/',
        CGI: 'http://resource.geosciml.org/classifier/cgi/',
        ICS: 'http://resource.geosciml.org/classifier/ics/',
        DBpedia: 'dbpedia.org/resource/',
        BGS: 'http://data.bgs.ac.uk/id/EarthMaterialClass/',
        WIKIDATA: 'https://www.wikidata.org/entity/',
        GEMET: 'https://www.eionet.europa.eu/gemet/',
        GBA: 'https://resource.geolba.ac.at',
        GBA2: 'http://resource.geolba.ac.at'
    }
};
