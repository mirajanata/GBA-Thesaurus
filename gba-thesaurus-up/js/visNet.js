﻿// visual network implementation
"use strict";
var visNet = {
    visData: {},
    edgesArr: [],
    nodesArr: [],
    layout: {},
    currentUri: null,
    _extConcepts: true,
    _isHierarchy: false,
    _isColorize: false,
    _uri: null,
    _lang: null,

    init: function () {
        let urlParams = new URLSearchParams(window.location.search);
        let uri = urlParams.get('uri');
        let project = uri.split('/')[3];
        let lang = urlParams.get('lang');

        visNet._uri = uri;
        visNet._lang = lang;

        visNet.h_layout =
            {
                edges: {
                    font: {
                        size: 12
                    },
                    widthConstraint: {
                        maximum: 90
                    }
                },
                nodes: {
                    shape: 'box',
                    margin: 10,
                    widthConstraint: {
                        maximum: 200
                    }
                },
                layout: {
                    hierarchical: {
                        enabled: true,
                        direction: 'LR',
                        sortMethod: "directed"
                    }
                },
                interaction: {
                    dragNodes: false
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 100,
                        updateInterval: 10
                    }
                }
            };
        visNet.g_layout =
            {
                edges: {
                    font: {
                        size: 12
                    },
                    widthConstraint: {
                        maximum: 90
                    }
                },
                nodes: {
                    shape: 'box',
                    margin: 10,
                    widthConstraint: {
                        maximum: 200
                    }
                },
                interaction: {
                    dragNodes: false,
                    hover: true
                },
                physics: {
                    enabled: true,
                }

            };


        this.createNetwork(uri, lang, ws.endpoint, project);
    },
    createNetwork: function (uri, lang, endpoint, project) {
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
            visNet.visData = jsonData.results.bindings;
            //console.log(visNet.visData);


            visNet.visData.forEach((i) => {
                if (!visNet.edgesArr.some(n => n.from + n.to === i.s.value + i.o.value) && !visNet.edgesArr.some(n => n.to + n.from === i.s.value + i.o.value)) {
                    switch (i.x.value.split('#')[1]) {
                        case 'exactMatch':
                            visNet.edgesArr.push(visNet.createEdge(i.s.value, i.o.value, 'none', false, 'grey'));
                            break;
                        case 'closeMatch':
                            visNet.edgesArr.push(visNet.createEdge(i.s.value, i.o.value, 'none', true, 'grey'));
                            break;
                        case 'narrowMatch':
                            visNet.edgesArr.push(visNet.createEdge(i.s.value, i.o.value, 'to', false, 'grey'));
                            break;
                        case 'broadMatch':
                            visNet.edgesArr.push(visNet.createEdge(i.s.value, i.o.value, 'to', false, 'grey'));
                            break;
                        case 'related':
                            visNet.edgesArr.push(visNet.createEdge(i.s.value, i.o.value, 'none', true));
                            break;
                        default:
                            visNet.edgesArr.push(visNet.createEdge(i.s.value, i.o.value, 'to', false));
                    }
                }
            });
            visNet.extGraph(uri, true);
            visNet.drawNetwork();
        });
    },

    createEdge: function (from, to, arrows, dashes, color) {
        return {
            from: from,
            to: to,
            arrows: arrows,
            dashes: dashes,
            color: {
                color: color
            }
        }
    },
    extGraph: function (visID) {
        visNet.currentUri = visID;
        var cnt = visNet.nodesArr.length;
        for (var i of visNet.visData) {

            if (i.s.value == visID) {
                visNet.createNode(i.s.value, i.sLabel.value, i.sColor.value);
                visNet.createNode(i.o.value, i.oLabel.value, i.oColor.value);
            }
            if (i.o.value == visID) {
                visNet.createNode(i.s.value, i.sLabel.value, i.sColor.value);
                visNet.createNode(i.o.value, i.oLabel.value, i.oColor.value);
            }

        }
        if (visID) {
            $('#itopic').hide();
            if (visNet.isExternalTab(visID)) {
                $("#externalUri").val(visID);
                document.getElementById("itopic").src = "network_desc.html";
            } else {
                var src = visNet.isExternal(visID) ? visID : "index.html?embedded=1&uri=" + visID;
                document.getElementById("itopic").src = src;
            }
        }

        return visNet.nodesArr.length != cnt;
    },
    abbrev: {
        INSPIRE: 'http://inspire.ec.europa.eu/codelist/',
        CGI: 'http://resource.geosciml.org/classifier/cgi/',
        ICS: 'http://resource.geosciml.org/classifier/ics/',
        DBpedia: 'dbpedia.org/resource/',
        BGS: 'http://data.bgs.ac.uk/id/EarthMaterialClass/',
        WIKIDATA: 'http://www.wikidata.org/entity/',
        GEMET: 'http://www.eionet.europa.eu/gemet/',
        GBA: 'resource.geolba.ac.at'
    },
    isExternal: function (uri) {
        return !uri.includes(visNet.abbrev.GBA);
    },
    isExternalTab: function (uri) {
        // resolve X-Frame-Options: SAMEORIGIN security
        return uri.includes(visNet.abbrev.INSPIRE) || uri.includes(visNet.abbrev.GEMET);
    },
    createNode: function (id, nodeText, color) {
        if (!visNet.nodesArr.some(a => a.id === id)) {
            let Label = nodeText;
            let Extern = false;

            let f = "#000000";
            if (color != null) {
                let co = color;
                if (co.indexOf('#') == 0)
                    co = co.substr(1, 6);
                let m = co.match(/^([0-9a-f]{6})$/i);
                let r = 255, g = 255, b = 255;
                if (m) {
                    m = m[0];
                    r = parseInt(m.substr(0, 2), 16);
                    g = parseInt(m.substr(2, 2), 16);
                    b = parseInt(m.substr(4, 2), 16);
                    if (0.28 * r + 0.5 * g + 0.11 * b <= 128)
                        f = "#ffffff";
                }
            }

            let font = {
                face: 'Open Sans',
                size: 13,
                color: f
            };
            let widthConstraint = {
                maximum: 150
            };

            if (Label.includes('//')) {
                for (let i in visNet.abbrev) {
                    if (Label.includes(visNet.abbrev[i])) {
                        Label = nodeText.split('/').pop() + ' (' + i + ')';
                        Label = (Label.charAt(0).toUpperCase() + Label.slice(1)).replace(/_/g, ' ');
                    }
                }
                color = 'lightgrey';
                font = {
                    size: 13,
                    color: 'black'
                };
                Extern = true;
            } else if (color == '') {
                color = {
                    border: '#406897',
                    background: '#6AAFFF'
                };

            }

            visNet.nodesArr.push({
                id: id,
                extern: Extern,
                label: Label,
                color: color,
                _c: color,
                font: font,
                /*shadow: true,*/
                widthConstraint: widthConstraint,
                margin: {
                    top: 5,
                    right: 5,
                    bottom: 5,
                    left: 5
                },
                x: -150,
                y: -150
            });
        }
    },
    __colSetNode: function (n) {
        n.color = n._c;
    },
    __colUnsetNode: function (n) {
        n.color = '#6AAFFF';
    },
    drawNetwork: function () {
        // create array with nodes and edges

        visNet.nodesArr.forEach((n1) => {
            n1.shadow = visNet.edgesArr.some(e => e.from == n1.id && !visNet.nodesArr.some(n2 => n2.id == e.to));
        });

        var notExt = visNet.nodesArr.filter(e => !e.extern);

        if (visNet._isColorize)
            notExt.forEach(visNet.__colSetNode);
        else
            notExt.forEach(visNet.__colUnsetNode);

        let ns = visNet._extConcepts ? visNet.nodesArr : notExt;
        let nodes = new vis.DataSet(ns);
        let edges = new vis.DataSet(visNet.edgesArr.filter(e => ns.some(n1 => n1.id == e.from) || ns.some(n2 => n2.id == e.to)));

        // create a network
        let container = document.getElementById('mynetwork');
        let data = {
            nodes: nodes,
            edges: edges
        };




        let network = new vis.Network(container, data, visNet._isHierarchy ? visNet.h_layout : visNet.g_layout);
        visNet.network = network;
        network.on("stabilizationProgress", function (params) {
            var progress = 100 * params.iterations / params.total;
            var ec = document.getElementById('mynetworkProgressCont');
            var e = document.getElementById('mynetworkProgress');
            e.setAttribute("aria-valuenow", progress);
            e.style.width = progress + "%";
            ec.style.visibility = "visible";
        });
        network.once("stabilizationIterationsDone", function () {
            var e = document.getElementById('mynetworkProgress');
            var ec = document.getElementById('mynetworkProgressCont');

            var progress = 100;
            e.setAttribute("aria-valuenow", progress);
            e.style.width = progress + "%";

            setTimeout(function () { ec.style.visibility = "hidden"; e.style.width = "0%"; e.setAttribute("aria-valuenow", "0"); }, 500);
        });

        /*network.on("doubleClick", function (params) {
            //console.log('doubleClick Event:', params);
            if (params.nodes[0].indexOf('resource.geolba') == -1) {
                window.location.href = params.nodes;
            } else {
                window.location.href = 'index.html?uri=' + params.nodes;
            }
        });*/
        network.on("click", function (params) {
            //console.log('doubleClick Event:', params);
            var uri = params.nodes[0];
            if (visNet.currentUri != uri) {
                //visNet.nodesArr = [];
                if (visNet.extGraph(params.nodes[0]))
                    visNet.drawNetwork();
            }
        });
        network.on("hold", function (params) {
            //console.log('hold Event:', params);
            /*if (params.nodes[0].indexOf('resource.geolba') == -1) {
                window.location.href = params.nodes;
            } else {
                window.location.href = 'index.html?uri=' + params.nodes;
            }*/
        });
        network.on("doubleClick", function (params) {
            if (params.nodes[0].indexOf('resource.geolba') == -1) {
                window.location.href = params.nodes;
            } else {
                window.location.href = 'index.html?uri=' + params.nodes;
            }
        });

        document.body.addEventListener('keydown', function (e) {

            if (e.key == 'x') {
                visNet.clickHierarchy();
            }
        });

        network.selectNodes([visNet.currentUri]);
    },
    toggleButton: function (btn, toggle) {
        if (toggle) {
            btn.removeClass("btn-outline-warning");
            btn.addClass("btn-warning");
        } else {
            btn.removeClass("btn-warning");
            btn.addClass("btn-outline-warning");
        }
        visNet.drawNetwork();
    },
    clickHierarchy: function () {
        visNet._isHierarchy = !visNet._isHierarchy;
        var btn = $("#btnHierarchy");
        visNet.toggleButton(btn, visNet._isHierarchy);
    },
    clickExtConcepts: function () {
        visNet._extConcepts = !visNet._extConcepts;
        var btn = $("#btnExtConcepts");
        visNet.toggleButton(btn, visNet._extConcepts);
    },
    clickColorize: function () {
        visNet._isColorize = !visNet._isColorize;
        var btn = $("#btnColorize");
        visNet.toggleButton(btn, visNet._isColorize);
    },
    onResize: function () {
        var h = $('#mynetworkContainer').height();
        var dh = $('#mynetworkToolbar').height();
        $('#mynetwork').height(h - dh - 60);
    },
    openThesaurus: function () {
        var s = "index.html?uri=" + encodeURIComponent(visNet.currentUri ? visNet.currentUri : visNet._uri);
        if (visNet._lang)
            s += "&lang=" + visNet._lang;
        window.open(s, "_blank");
    }
};