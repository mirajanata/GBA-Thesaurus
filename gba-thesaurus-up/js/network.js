﻿// visual network implementation
"use strict";
var visNet = {
    visData: {},
    edgesArr: [],
    nodesArr: [],
    layout: {},
    currentUri: null,

    init: function () {
        let urlParams = new URLSearchParams(window.location.search);
        let uri = urlParams.get('uri');
        let project = uri.split('/')[3];
        let lang = urlParams.get('lang');

        this.createNetwork(uri, lang, ws.endpoint, project);
    },
    createNetwork: function (uri, lang, endpoint, project) {
        let query = encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
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
                                                ORDER BY ?sL`);

        fetch(`${endpoint}${project}?query=${query}&format=application/json`)

            .then(res => res.json())
            .then(jsonData => {
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
                visNet.layout = {
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
                        hover: true
                    },
                    physics: {
                        enabled: true
                    }

                };

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
    extGraph: function (visID, extConcepts) {
        visNet.currentUri = visID;
        var cnt = visNet.nodesArr.length;
        for (var i of visNet.visData) {

            if (i.s.value == visID) {
                visNet.createNode(i.s.value, i.sLabel.value, i.sColor.value, extConcepts);
                visNet.createNode(i.o.value, i.oLabel.value, i.oColor.value, extConcepts);
            }
            if (i.o.value == visID) {
                visNet.createNode(i.s.value, i.sLabel.value, i.sColor.value, extConcepts);
                visNet.createNode(i.o.value, i.oLabel.value, i.oColor.value, extConcepts);
            }

        }
        document.getElementById("itopic").src = "index.html?noright=1&uri=" + visID;

        return visNet.nodesArr.length != cnt;
    },
    createNode: function (id, nodeText, color, extConcepts) {
        if (!visNet.nodesArr.some(a => a.id === id)) {
            let Label = nodeText;
            let font = {
                face: 'Open Sans'
            };
            let widthConstraint = {
                maximum: 150
            };
            let abbrev = {
                INSPIRE: 'http://inspire.ec.europa.eu/codelist/',
                CGI: 'http://resource.geosciml.org/classifier/cgi/',
                ICS: 'http://resource.geosciml.org/classifier/ics/',
                DBpedia: 'http://dbpedia.org/resource/',
                BGS: 'http://data.bgs.ac.uk/id/EarthMaterialClass/',
                WIKIDATA: 'http://www.wikidata.org/entity/',
                GEMET: 'http://www.eionet.europa.eu/gemet/',
                GBA: 'resource.geolba.ac.at'
            };


            if (Label.includes('//')) {
                for (let i in abbrev) {
                    if (Label.search(abbrev[i]) != -1) {
                        Label = nodeText.split('/').pop() + ' (' + i + ')';
                    }
                }
                Label = (Label.charAt(0).toUpperCase() + Label.slice(1)).replace(/_/g, ' ');
                color = 'lightgrey';
                font = {
                    size: 12,
                    background: 'lightgrey'
                };

            } else if (color == '') {
                color = {
                    border: '#406897',
                    background: '#6AAFFF'
                };

            }

            visNet.nodesArr.push({
                id: id,
                label: Label,
                color: color,
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
    drawNetwork: function (extConcepts) {
        // create array with nodes and edges

        visNet.nodesArr.forEach((n1) => {
            n1.shadow = visNet.edgesArr.some(e => e.from == n1.id && !visNet.nodesArr.some(n2 => n2.id == e.to));
        });


        let nodes = new vis.DataSet(visNet.nodesArr);
        let edges = new vis.DataSet(visNet.edgesArr);

        // create a network
        let container = document.getElementById('mynetwork');
        let data = {
            nodes: nodes,
            edges: edges
        };
        let options = visNet.layout;

        let network = new vis.Network(container, data, options);

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
                if (visNet.extGraph(params.nodes[0], extConcepts))
                    visNet.drawNetwork(extConcepts);
            }
        });
        network.on("hold", function (params) {
            //console.log('hold Event:', params);
            if (params.nodes[0].indexOf('resource.geolba') == -1) {
                window.location.href = params.nodes;
            } else {
                window.location.href = 'index.html?uri=' + params.nodes;
            }
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
                visNet.drawAll();
            }
        });

        network.selectNodes([visNet.currentUri]);
    },
    drawAll: function () {
        visNet.layout = {
            nodes: {
                shape: 'box',
                margin: 0,
                widthConstraint: {
                    maximum: 200
                }
            },
            layout: {
                hierarchical: {
                    direction: 'LR',
                    sortMethod: "directed"
                }
            },
            interaction: {
                dragNodes: false
            },
            physics: {
                enabled: false
            },
            configure: {
                filter: function (option, path) {
                    if (path.indexOf('hierarchical') !== -1) {
                        return true;
                    }
                    return false;
                },
                showButton: false
            }
        };
        console.log(visNet.nodesArr);

        visNet.nodesArr = visNet.nodesArr.filter((value, index, arr) => value.id.indexOf('geoba') < 0);

        visNet.drawNetwork(false);

    }
};