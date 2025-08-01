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
        struct: {
            from: 'FROM <https://resource.geosphere.at/thes/struct>',
            image: 'falte.png',
            diagram: 'tree'
        },
        time: {
            from: 'FROM <https://resource.geosphere.at/thes/time>',
            image: 'time.png',
            diagram: 'sunburst'
        },
        lith: {
            from: 'FROM <https://resource.geosphere.at/thes/lith>',
            image: 'granit.png',
            diagram: 'circle'
        },
        tect: {
            from: 'FROM <https://resource.geosphere.at/thes/tect>',
            image: 'tektonik.png',
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
        }
    },

    projects: [],

    topicImages: {
        'inspire': 'INSPIRE.png',
        'linkedData': 'linkedData.png'
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
    }
}
