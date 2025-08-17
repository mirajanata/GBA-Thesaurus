// configuration
"use strict";
var config = {
    lang: 'en',
    defaultLang: 'en',
    projectConfiguration: {
        geolunit: {
            from: 'FROM <https://resource.geosphere.at/thes/geolunit>',
            image: 'profil.png',
            diagram: 'tree'
        },
        lith: {
            from: 'FROM <https://resource.geosphere.at/thes/lith>',
            image: 'granit.png',
            diagram: 'circle'
        },
        time: {
            from: 'FROM <https://resource.geosphere.at/thes/time>',
            image: 'time.png',
            diagram: 'sunburst'
        },
        tect: {
            from: 'FROM <https://resource.geosphere.at/thes/tect>',
            image: 'tektonik.png',
            diagram: 'tree'
        },
        fault: {
            from: 'FROM <https://resource.geosphere.at/thes/fault>',
            image: 'gold.png',
            diagram: 'tree'
        },
        struct: {
            from: 'FROM <https://resource.geosphere.at/thes/struct>',
            image: 'falte.png',
            diagram: 'tree'
        },
        geomorph: {
            from: 'FROM <https://resource.geosphere.at/thes/geomorph>',
            image: 'quarz.png',
            diagram: 'tree'
        },
        mineral: {
            from: 'FROM <https://resource.geosphere.at/thes/mineral>',
            image: 'quarz.png',
            diagram: 'tree'
        },
        minres: {
            from: 'FROM <https://resource.geosphere.at/thes/minres>',
            image: 'gold.png',
            diagram: 'tree'
        },
        desc_inspire: {
            id: 'inspire',
            image: 'INSPIRE.png',
            name: 'INSPIRE',
            desc: 'Mit der Erstellung von semantischen und technisch interoperablen Geodaten setzt die Geologische Bundesanstalt die gesetzlichen Verpflichtungen der EU-Direktive 2007/2/EC <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a> bzw. des Geodateninfrastrukturgesetzes 2010 <a href="http://www.parlament.gv.at/PAKT/VHG/XXIV/ME/ME_00055/index.shtml" title="Geodateninfrastrukturgesetz GeoDIG" target="_blank">GeoDIG</a> um. Die Daten der GBA werden hierbei mit Thesaurus-Konzepten attributiert, w&auml;hrend der Thesaurus gleichzeitig mit INSPIRE-Codes und weiteren international standardisierten Vokabularen verlinkt wird. Datens&auml;tze, die bereits nach INSPIRE harmonisiert wurden, k&ouml;nnen mit dem DataViewer (ein Erweiterungsmodul des GBA Thesaurus, dzt. im Testbetrieb) durchsucht werden.'
        },
        desc_linkeddata: {
            id: 'linkedData',
            image: 'linkedData.png',
            name: 'Linked Data',
            desc: 'Alle Begriffe sind als SKOS Konzepte formatiert (Begriffe, einschlie&szlig;lich Synonyme), mit eigenen Web-Adressen &#8594; <a href="http://de.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URI\'s</a>, sowie durch polyhierarchische Beziehungen als &uuml;ber-, untergeordnete, und verwandte Konzepte innerhalb eines Themenbereichs definiert , mit Beschreibungen und Quellenangabe &#8594; Literaturverzeichnis<br>Als <a href="http://de.wikipedia.org/wiki/Linked_Open_Data" title="Linked Data" target="_blank">Linked Data</a> Resource ist sie semantisch mit anderen Resourcen im Web verlinkt &#8594; <a href="http://dbpedia.org/" title="DBpedia Knowledge Base" target="_blank">DBpedia</a>, <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>, <a href="http://resource.geosciml.org/" title="Resources for Geosciences XML" target="_blank">GeoSciML</a> maschinenlesbar &uuml;ber Webservices (Endpoints) gem&auml;&szlig; den <a href="http://www.w3.org/2013/data/" title="The World Wide Web Consortium" target="_blank">W3C</a> Standards ver&ouml;ffentlicht &#8594 <a href="http://www.w3.org/RDF/" title="Resource Description Framework (RDF)" target="_blank">RDF</a>, <a href="http://www.w3.org/TR/rdf-sparql-query/" title="SPARQL Query Language for RDF" target="_blank">SparQL</a><br>zur Verwendung in Linked Data Webapplikationen, als Hyperlinks, oder als Kodierung f&uuml;r Geodaten &#8594; Datenharmonisierung, DataViewer'
        }
    },

    projects: [],

    uriReplacements: {
        'GeologicUnit': 'thes/geolunit',
        'resource.geolba.ac.at': 'resource.geosphere.at'
    },

    init: function (readMetadata, langID) {
        config.lang = langID || config.defaultLang;
        config.projects = [];

        const projectQuery = `
PREFIX dcterms:<http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT DISTINCT ?s ?t ?d
WHERE {
    ?s a <http://rdfs.org/ns/void#Dataset>; dcterms:title ?t; dcterms:description ?d
    . FILTER(lang(?t)="${config.lang}"). FILTER(lang(?d)="${config.lang}")
}`;

        for (const [projectId, project] of Object.entries(config.projectConfiguration)) {
            config.projects.push(project);
            if (!project.from) {
                let p = lang["projects"][langID];
                if (p && p[projectId]) {
                    let desc = p[projectId].desc;
                    if (desc) {
                        project.desc = desc;
                    }
                }
            }
        }
        return readMetadata ? ws.json(null, projectQuery, null, jsonData => {
            let d = jsonData.results.bindings;
            for (let i of d) {
                let projectId = config.getProject(i.s.value);
                let project = config.projectConfiguration[projectId];
                if (project) {
                    project.id = projectId;
                    project.name = i.t.value;
                    project.desc = i.d.value;
                    project.uri = i.s.value;
                }
            }
        }) : null;
    },
    getProject: function (uri) {
        let p = uri.split('/')[4];
        p = p.split('-')[0];
        return p;
    },
    checkUri: function (uri) {
        if (!uri) return uri;
        for (let [key, value] of Object.entries(config.uriReplacements)) {
            uri = uri.replace(key, value);
        }
        return uri;
    }
}
