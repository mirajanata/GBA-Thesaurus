"use strict";

//**************************************************************************************
//*******definition of selected RDF properties******************************************   

const n = {
    skos: 'http://www.w3.org/2004/02/skos/core#',
    dcterms: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
    owl: 'http://www.w3.org/2002/07/owl#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    dbpo: 'http://dbpedia.org/ontology/'
};

const PREF_LABEL = [n.skos + 'prefLabel'];
const PICTURE = [n.foaf + 'depiction'];
const SYNONYMS = [n.skos + 'altLabel'];
const NOTATION = [n.skos + 'notation'];
const DESCRIPTION_1 = [n.skos + 'definition'];
const DESCRIPTION_2 = [n.skos + 'scopeNote', n.dcterms + 'description', n.dcterms + 'abstract'];
const CITATION = [n.dcterms + 'bibliographicCitation'];
const REF_LINKS = [n.dcterms + 'references'];
const RELATIONS_1 = [n.skos + 'broader', n.skos + 'narrower', n.skos + 'related'];
const RELATIONS_2 = [n.skos + 'exactMatch', n.skos + 'closeMatch', n.skos + 'relatedMatch', n.skos + 'broadMatch', n.skos + 'narrowMatch'];
const RELATIONS_3 = [n.rdfs + 'seeAlso', n.owl + 'sameAs', n.dcterms + 'relation', n.dcterms + 'hasPart', n.dcterms + 'isPartOf', n.dcterms + 'conformsTo'];
const DATA_LINKS = [n.dcterms + 'source', n.dcterms + 'isReferencedBy', n.dcterms + 'subject', n.dcterms + 'isRequiredBy', n.dcterms + 'identifier'];
const VISUALIZATION = [n.dbpo + 'colourHexCode'];
const LOCATION = [n.geo + 'lat', n.geo + 'long', n.geo + 'location', n.dcterms + 'spatial'];
const CREATOR = [n.dcterms + 'creator', n.dcterms + 'created', n.dcterms + 'modified', n.dcterms + 'contributor'];

const FRONT_LIST = {
    prefLabel: PREF_LABEL,
    picture: PICTURE,
    altLabel: [...PREF_LABEL, ...SYNONYMS],
    notation: NOTATION,
    abstract: DESCRIPTION_1,
    citation: CITATION,
    relatedConcepts: [...RELATIONS_1, ...RELATIONS_2]
};
const TECHNICAL_LIST = {
    descriptions: [...PREF_LABEL, ...SYNONYMS, ...DESCRIPTION_1, ...DESCRIPTION_2],
    scientificReferences: CITATION,
    semanticRelations: [...RELATIONS_1, ...RELATIONS_2, ...RELATIONS_3],
    dataLinks: DATA_LINKS,
    visualization: [...PICTURE, ...VISUALIZATION],
    location: LOCATION,
    creator: CREATOR
};


var pv = {

    init: function () {
        pv.USER_LANG = (navigator.language || navigator.language).substring(0, 2);
        pv.BASE = location.protocol + '//' + location.host + location.pathname;

        let vocProjects = new Map(); //key of vocProjects is identical with URI path!
        pv.addVocProj(vocProjects); //-> var assigned in projects.js
        let urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('lang')) {
            pv.USER_LANG = urlParams.get('lang');
        }

        pv.insertSearchCard('search_widget'); //inserts search widget only                

        if (urlParams.has('search')) { //need lang parameter only for sparql requests
            pv.search(decodeURI(urlParams.get('search')), vocProjects);

        } else if (urlParams.has('uri')) {
            let uri = decodeURI(urlParams.get('uri').replace(/["';><]/gi, '')); //avoid injection
            $('#pageContent').empty();
            pv.details('pageContent', uri);
            pv.insertProjCards('proj_links', vocProjects, uri.split('\/')[3]);

        } else {
            pv.insertPageDesc(); //general intro
            pv.insertVocDesc(vocProjects, 'proj_desc');
            pv.insertProjCards('proj_links', vocProjects);
        }

        pv.initSearch(); //provides js for fuse search 
    },

    addVocProj: function (vocProjects) {
        vocProjects.set('hike', {
            acronym: 'HIKE',
            title: 'Hazard and Impact Knowledge for Europe',
            description: 'The HIKE project aims to support research and assessments of induced hazards and impacts that are related to the exploitation of subsurface resources and capacities throughout Europe. This will be achieved through development, demonstration and implementation of harmonized subsurface data sets and methodologies, investigation of applied use cases, and facilitation of knowledge shared between geological surveys and stakeholders. WP-2 focuses on the development of a European fault database covering a comprehensive set of static and dynamic geological and physical characteristics needed for the assessment of seismic hazards, ground movements, leakage and fluid migration, sealing capacities, fluid flow and other types of dynamic behaviour. This database will be developed, populated and tested in conjunction with several other GeoERA projects and external stakeholder involvement. WP-3 establishes novel hazard and impact research methods and investigates the added value of the established fault information in several case studies and geological settings across Europe. WP-4 concludes the research activities with future recommendations and the establishment of a share point for information, knowledge and preferred practices related to hazard and impact research. This share point is intended to provide a collaboration and knowledge exchange platform for future research by geological surveys and other stakeholders. WP-5 governs the embedding of the results into the GeoERA Information Platform.',
            image: 'falte.png',
            project_page: 'http://geoera.eu/projects/hike/',
            rdf_download: 'https://egdi.geology.cz/records/123'
        });

        vocProjects.set('structure', {
            acronym: 'HIKE-GBA',
            title: 'Fault systems from Maps of the Geological Survey of Austria',
            description: 'The Theme Geologic Structures includes linear and planar predominantly deformation structures in geologic maps. Shear sense indicators and fold structures are also covered by this theme.',
            image: 'HIKE.png',
            project_page: 'http://resource.geolba.ac.at/structure.html',
            rdf_download: 'http://resource.geolba.ac.at/structure/export/structure.rdf'
        });

        vocProjects.set('geoconnect3d', {
            acronym: 'GeoConnect�d',
            title: 'Cross-border, cross-thematic multiscale framework for combining geological models and data for resource appraisal and policy support',
            description: 'The GeoConnect�d project develops and tests a new methodological approach to prepare and disclose geological information for policy support and subsurface management. The improved approach uses two regional case studies � the Roer-to-Rhine region and the Pannonian Basin. These regional, cross-border case studies are chosen to be complementary and sufficiently different in geological setting and degree of implementation of subsurface exploitation and management, in order to maximize their pan-European relevance. A novel bottom-up approach introduces two concepts that increase the geological understanding of an area and are aimed at providing a coherent geological context for evaluating subsurface applications and resolving subsurface management issues. The first new concept is the structural framework as a means of joining existing models of different scale and resolution to clarify the importance of planar structures in a way that makes the geology understandable to stakeholders involved in subsurface management. The second concept is that of geomanifestations. These specific expressions of geological processes are important sources of information for improving geological understanding. The structural framework models annotated with geomanifestations allow the integration and evaluation of complex cross-thematic research. The two bottom-up regional case studies form the study material for a top-down, more generic evaluation of potentially interacting subsurface activities that allows revisiting and refining state-of-the-art methods. Valorisation of regional results at pan-European level is ensured by testing the methodologies in two smaller pilot areas in Germany and Ireland.',
            image: 'profil.png',
            project_page: 'http://geoera.eu/projects/geoconnect3d/',
            rdf_download: 'https://egdi.geology.cz/records/123'
        });

        vocProjects.set('keywords', {
            acronym: 'GIP-P keywords',
            title: 'Compilation of a keyword thesaurus',
            description: 'GIP-P WP4 introduces Linked Data technology to GeoERA projects is to enable a Semantic Text Search. Search for data is the basic task for all data infrastructures. It needs to put all keywords used to tag datasets into a single hierarchy like a thesaurus. Data queries then can use this kind of a word net also to get search results for similar keywords within a semantic radius. For metadata descriptions, the clarification of the meaning of textual attributes applies mainly to keywords and the implementation of a semantic search within a metadata catalog. Here WP4 strives for a compilation (SKOS thesaurus) of keywords with URIs suitable for tagging metadata (-> use case: Multilingual Semantic Text Search).',
            image: 'falte.png',
            project_page: 'http://geoera.eu/gip-p/',
            rdf_download: 'http://resource.geolba.ac.at/structure/export/keywords.rdf'
        });
    },

    //********set the title of PV homepage********************************************************************

    insertPageDesc: function () {
        let desc = $('#page_desc');
        desc.append('<br><h1 id="title">Project Vocabularies</h1>');
        desc.append('<h3>project vocabularies - subtitle</h3>');
        desc.append('<p>..description of project vocabularies: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>');
    },

    //*********************descriptions insert of vocabularies for the start page******************************       

    insertVocDesc: function (vocProjects, divID) {
        ws.json(`PREFIX dcterms:<http://purl.org/dc/terms/> 
                                    PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                    SELECT ?cs ?Title ?Desc (COUNT(?c) AS ?count) (GROUP_CONCAT(DISTINCT ?L; separator = "|") as ?topConcepts) ?modified
                                    WHERE { 
                                    ?cs a skos:ConceptScheme; dcterms:title ?cslEN; dcterms:description ?csdEN; dcterms:modified ?modified . FILTER(lang(?cslEN)="en") . FILTER(lang(?csdEN)="en") .
                                    ?cs skos:hasTopConcept ?tc . ?tc skos:prefLabel ?tclEN . FILTER(lang(?tclEN)="en") . ?c skos:broader* ?tc
                                    OPTIONAL {?cs dcterms:title ?csl . FILTER(lang(?csl)="${pv.USER_LANG}")} 
                                    OPTIONAL {?cs dcterms:description ?csd . FILTER(lang(?csd)="${pv.USER_LANG}")} 
                                    OPTIONAL {?tc skos:prefLabel ?tcl . FILTER(lang(?tcl)="${pv.USER_LANG}")} 
                                    BIND(CONCAT(STR(?tc),"$",STR(COALESCE(?tcl, ?tclEN))) AS ?L)
                                    BIND(COALESCE(?csl, ?cslEN) AS ?Title)
                                    BIND(COALESCE(?csd, ?csdEN) AS ?Desc)
                                    } 
                                    GROUP BY ?cs ?Title ?Desc ?modified`, jsonData => {
            for (let [key, value] of vocProjects.entries()) {
                let uri_path = new RegExp(key);
                jsonData.results.bindings.filter(item => uri_path.test(item.cs.value)).forEach(function (item) {
                    let uris = item.topConcepts.value.split('$').join(`&lang=${pv.USER_LANG}">`).split('|').join(`</a>, <a href="${pv.BASE}?uri=`);
                    let topConcepts = `<a href="${pv.BASE}?uri=${uris}</a>`;
                    $('#' + divID).append(`
                                <div class="media mb-4">
                                    <img class="d-flex mr-3 rounded-circle" src="img/${value.image}">
                                        <div id="" class="media-body">
                                        <h4 class="mt-0">
                                            ${item.Title.value} (${value.acronym})
                                        </h4>
                                        ${item.Desc.value}
                                        <br><br>
                                        <p class="text-muted">
                                            <strong>Top concepts:</strong> ${topConcepts}
                                            <br><strong>Published:</strong> ${item.modified.value.split('T')[0]}
                                            <br><strong>Concepts:</strong> <span class="badge badge-success badge-pill">${item.count.value}</span>
                                            <br><strong>Download:</strong> <a href="">RDF/XML</a>
                                        </p>
                                    </div>
                                </div>`);
                });
            }
        });
    },

    //***************************************************************************************************
    //***********************set the input box for concept search****************************************         
    insertSearchCard: function (widgetID) {
        $('#searchInput').keydown(function (e) {
            switch (e.which) {
                case 13:
                    pv.openSearchList('search=' + encodeURI($('#searchInput').val()));
                    $('#dropdown').empty();
                    break;
                case 38: // up
                    pv.__selectSearchLink(1);
                    break;
                case 40: // down
                    pv.__selectSearchLink(0);
                    break;
            }
        });

        $('#searchBtn').click(function (e) { //provide search results 
            pv.openSearchList('search=' + encodeURI($('#searchInput').val()));
            $('#dropdown').empty();
        });

        $('#searchInput').focusout(function () {
            $('#dropdown').delay(300).hide(0, function () {
                $('#dropdown').empty();
            });
        });

        let timer;
        $('#searchInput').on('input', function () {
            clearTimeout(timer);
            $('#dropdown').empty();
            timer = setTimeout(function () {
                if ($('#searchInput').val().length > 0) {
                    $('#dropdown').show();
                    let autoSuggest = window.fuse.search($('#searchInput').val());
                    let c = [];
                    $.each(autoSuggest.slice(0, 10), function (index, value) {
                        c.push(value.L.value)
                    });
                    $.each(autoSuggest.slice(0, 10), function (index, value) {
                        let entry = value.L.value;
                        if (c.indexOf(entry) !== c.lastIndexOf(entry)) {
                            entry = entry + ' <span class="addVoc">(' + value.s.value.split('\/')[3] + ')</span>';
                        }
                        $('#dropdown').append('<tr><td class="searchLink dropdown-item" onclick="document.location.href = \'' + pv.BASE + '?uri=' + value.s.value + '&lang=' + pv.USER_LANG + '\';">' + entry + '</td></tr>');
                    });
                }
            }, 200);
        });
    },

    //**********************the initial sparql query to build the fuse (trie) object - stored in window*****************************         
    initSearch: function () {
        ws.json(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                    SELECT ?s ?L 
                                    WHERE { 
                                    VALUES ?p {skos:prefLabel skos:altLabel} 
                                    ?s a skos:Concept; ?p ?lEN . FILTER(lang(?lEN)="en")
                                    OPTIONAL{?s ?p ?l . FILTER(lang(?l)="${pv.USER_LANG}")}
                                    BIND(COALESCE(?l, ?lEN) AS ?L)
                                    } 
                                    ORDER BY STRLEN(STR(?L)) ?L`, jsonData => {
            const options = {
                shouldSort: true,
                tokenize: true,
                keys: ['L.value']
            };
            window.fuse = new Fuse(jsonData.results.bindings, options);
        });
    },

    //********************set the page for search results************************************************
    openSearchList: function (queryString) { //zB 'info=disclaimer'
        window.open(pv.BASE + '?' + queryString + '&lang=' + pv.USER_LANG, '_self', '', 'false');
    },

    //************************perform the search for a term typed in the inputbox************************         
    search: function (searchText, vocProjects) {
        let HITS_SEARCHRESULTS = '0 results for ';
        $('#pageContent').empty();
        $('#pageContent').append('<br><h1>Search results</h1><p id="hits" class="lead">' + HITS_SEARCHRESULTS +
            '\"' + searchText + '\"</p><hr><ul id="searchresults" class="searchresults"></ul>');
        $('#searchresults').bind("DOMSubtreeModified", function () {
            $('#hits').html(HITS_SEARCHRESULTS.replace('0', $('#searchresults li').length) + '\"' + searchText + '\"');
        });

        //NEU*******************************
        ws.json(`PREFIX dcterms:<http://purl.org/dc/terms/>
                                    PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                    SELECT DISTINCT ?s ?title ?text 
                                    WHERE { 
                                    VALUES ?n {"${searchText.toLowerCase()}"} 
                                    VALUES ?p {skos:prefLabel skos:altLabel skos:definition skos:scopeNote dcterms:description}
                                    ?s a skos:Concept; ?p ?lEN . FILTER((lang(?lEN)="en"))
                                    OPTIONAL{?s ?p ?l . FILTER(lang(?l)="${pv.USER_LANG}")}
                                    BIND(COALESCE(?l, ?lEN) AS ?L) . FILTER(regex(?L,?n,"i")) 
                                    ?s skos:prefLabel ?plEN . FILTER((lang(?plEN)="en"))
                                    OPTIONAL{?s skos:prefLabel ?pl . FILTER(lang(?pl)="${pv.USER_LANG}")}
                                    BIND(COALESCE(?pl, ?plEN) AS ?title)
                                    BIND(CONCAT(STR(?p),"|",STR(?L)) AS ?text)
                                    BIND(IF(?p=skos:prefLabel,1,2) AS ?sort)
                                    } 
                                    ORDER BY ?sort 
                                    LIMIT 100`, jsonData => {
            jsonData.results.bindings.forEach(function (a) {
                $('#searchresults').append(`
                                        <li>
                                        <a href="${pv.BASE}?uri=${a.s.value}&lang=${pv.USER_LANG}">
                                            <strong>${a.title.value}</strong> (project)
                                        </a>
                                        <br>
                                        <span class="searchPropTyp">URI: </span>
                                        <span class="searchResultURI text-success">
                                            ${a.s.value}
                                        </span>
                                        <br>
                                        <p class="searchResultText">
                                            ${pv.createSearchResultsText(a.text.value, searchText)}
                                        </p>
                                        </li>`);
                if ($('#searchresults li').length > 99) {
                    $('#hits').prepend('>');
                }
            });

        });
    },

    //***************************prepare the character string what is actually used to search***************************          
    createSearchResultsText: function (sparqlText, searchText) {
        let searchText1 = searchText.toLowerCase();
        var regex1 = new RegExp(searchText1, "g");
        let searchText2 = searchText.charAt(0).toUpperCase() + searchText.slice(1);
        var regex2 = new RegExp(searchText2, "g");
        let resultText = '';

        for (let propPart of sparqlText.split('\$')) {
            resultText += propPart.split('|')[0].replace('http:\/\/www.w3.org\/2004\/02\/skos\/core#', '<span class="searchPropTyp">skos:').replace('http://purl.org/dc/terms/', '<span class="searchPropTyp">dcterms:') + '</span> - ';
            let textArr = propPart.split('|')[1].split('\. ');
            for (let i of textArr) {
                if (i.search(new RegExp(searchText, "i")) > -1) {
                    resultText += i.replace(regex1, '<strong>' + searchText1 + '</strong>').replace(regex2, '<strong>' + searchText2 + '</strong>') + ' .. ';
                }
            }
            resultText += '<br>';
        }
        return resultText;
    },

    //************set the "details page" to view a single concept ***********************************************************************   
    details: function (divID, uri) { //build the web page content

        ws.json(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                    SELECT DISTINCT ?p ?o (GROUP_CONCAT(DISTINCT CONCAT(STR(?L), "@", lang(?L)) ; separator="|") AS ?Label) 
                    WHERE { 
                    VALUES ?s {<${uri}>} ?s ?p ?o . 
                    OPTIONAL {?o skos:prefLabel ?L}
                    } 
                    GROUP BY ?p ?o`, jsonData => {
            for (let key in FRONT_LIST)
                pv.createFrontPart(divID, uri, jsonData, Array.from(FRONT_LIST[key].values()), key);

            $('#' + divID).append(`<hr>
                                <div style="cursor: pointer; color: #777;" id="detailsBtn" 
                                    onclick="javascript: toggleRead(\'detailsBtn\', \'detailsToggle\', \'read more\');"> &#9654; <em>read more ..</em>
                                </div>
                                <div style="display:none;" id="detailsToggle">
                                <br>
                                    <table id="details"></table>
                                </div>
                                `);

            for (let key in TECHNICAL_LIST)
                pv.createTechnicalPart('details', jsonData, Array.from(TECHNICAL_LIST[key].values()), key);
            $('#' + divID).append('');

            pv.insertConceptBrowser(divID, uri, 50);
        });
    },

    //************************toggle the hidden details / because HTML5 is not fully supported by MS Edge**************        
    toggleRead: function (divBtn, divTxt, text) {
        let txt = $('#' + divTxt).is(':visible') ? '&#9654; <em>' + text + ' ..</em>' : '&#9660; <em>' + text + ' ..</em>';
        $('#' + divBtn).html(txt);
        $('#' + divTxt).slideToggle();
    },

    //*************create the upper part of details page - always visible *********************************************************************   
    createFrontPart: function (divID, uri, data, props, key) {

        let html = '';
        props.forEach((i) => {
            let ul = pv.getObj(data, i);
            if (ul.size > 0) {
                switch (key) {
                    case 'prefLabel':
                        let pL = pv.setUserLang(Array.from(ul).join('|').replace(/  <span class="lang">/g, '@').replace(/<\/span>/g, ''));
                        html += '<h1 class="mt-4">' + pL + '</h1>';
                        html += `   <p class="lead">URI: 
                                    <span id="uri" class="">${uri}</span>
                                        &nbsp;&nbsp;&nbsp;&#8658;
                                    <a href="#"> RDF download</a>
                                </p>
                                <hr>`;
                        break;
                    case 'altLabel':
                        html += '<ul class="' + key + '"><li>' + Array.from(ul).join('</li><li>') + '</li></ul>';
                        break;
                    case 'notation':
                        $('#' + divID).append('<hr><span>Notation: </span>');
                        html += '<ul class="' + key + '"><li>' + Array.from(ul).join('</li><li>') + '</li></ul>';
                        break;
                    case 'abstract':
                        html += '<hr><div class="' + key + '">' + pv.setUserLang(Array.from(ul).join('|').replace(/  <span class="lang">/g, '@').replace(/<\/span>/g, '')) + '</div>';
                        break;
                    case 'citation':
                        let a = [];
                        for (let i of ul) {
                            a.push(i.replace('\:', ':<cite title="Source Title">') + '</cite>');
                        }
                        html += '<br><footer class="blockquote-footer">' + Array.from(a).join('</footer><footer class="blockquote-footer">') + '</footer>';
                        break;
                    case 'relatedConcepts':
                        if (html.search('<h4') == -1) {
                            html += '<hr><h4 style="margin-bottom: 1rem;">Concept relations</h4>';
                        }
                        html += '<table><tr><td class="skosRel' + i.search('Match') + ' skosRel">' + i.replace(n.skos, '') + '</td><td class="skosRelUl"><ul><li>' +
                            pv.shortenText(Array.from(ul).join('</li><li>')) + '</li></ul></td></tr></table>';

                        break;
                }
            }
        });
        $('#' + divID).append(html);
    },

    //*******************replace long URIs by acronyms************************************************************************
    shortenText: function (text) {
        let shorten = {
            INSPIRE: 'http://inspire.ec.europa.eu/codelist/',
            CGI: 'http://resource.geosciml.org/classifier/cgi/',
            ICS: 'http://resource.geosciml.org/classifier/ics/',
            DBpedia: 'http://dbpedia.org/resource/',
            BGS: 'http://data.bgs.ac.uk/id/EarthMaterialClass/',
            WIKIDATA: 'http://www.wikidata.org/entity/'
        };

        for (let i in shorten) {
            if (text.search(shorten[i]) != -1) {
                text = text.split('>' + shorten[i])[0] + '>' + text.split('>' + shorten[i])[1].replace('<', ' (' + i + ')<');
            }
        }
        return text;

    },

    //******************create the hidden part of concept descriptions ***********************************************************************    
    createTechnicalPart: function (divID, data, props, key) { //loop all single properties
        let html = '';
        let geoPath = 'http://www.w3.org/2003/01/geo/wgs84_pos#';
        let coord = {};

        props.forEach((i) => {
            let ul = pv.getObj(data, i);
            if (ul.size > 0) {
                html += '<tr><td class="propTech">' + pv.createHref(i) + '</td><td><ul><li>' + Array.from(ul).join('</li><li>') + '</li></ul></td></tr>';

                if (i == geoPath + 'lat') {
                    coord.lat = Number(ul.values().next().value);
                }
                if (i == geoPath + 'long') {
                    coord.long = Number(ul.values().next().value);
                }
            }
        });

        if (html.length > 0) {
            $('#' + divID).append(`
                    <tr id="${key}">
                        <th></th>
                        <th>
                            ${key}
                        </th>
                    </tr>
                    <tr>
                        ${html}
                    </tr>`);
        }
    },

    //******************transform the sparql json query result into a set of HTML elements like <a> *************************************   
    getObj: function (data, i) {
        return new Set($.map(data.results.bindings.filter(item => item.p.value === i), (a => (a.Label.value !== '' ? '<a href="' + pv.BASE +
            '?uri=' + a.o.value + '&lang=' + pv.USER_LANG + '">' + pv.setUserLang(a.Label.value) + '</a> ' : pv.createHref(a.o.value) + ' ' +
            pv.createDTLink(a.o.datatype) + ' ' + pv.langTag(a.o['xml:lang'])))));
    },

    //*******************prepare HTML links for browsing the vocabulary***************************************************
    createHref: function (x) {
        if (x.substring(0, 4) == 'http') {
            let a = x;
            for (const [key, value] of Object.entries(n)) a = a.replace(value, key + ':');
            x = '<a href="' + x + '">' + a.replace(/_/g, ' ') + '</a>';
        }
        return x;
    },

    //*******************create beautiful language tags*******************************************************************           
    langTag: function (x) {
        if (typeof x !== 'undefined') {
            x = '<span class="lang">' + x + '</span>';
        } else {
            x = '';
        }
        return x;
    },

    //********************create beautiful xsd data format tags******************************************************************************           
    createDTLink: function (x) {
        if (typeof x !== 'undefined') {
            if (x.indexOf('XMLSchema') > 0) {
                x = '<a class="datatype" href="' + x + '">' + x.replace('http://www.w3.org/2001/XMLSchema#', 'xsd:') + '</a>';
            }
        } else {
            x = '';
        }
        return x;
    },

    //********************select the adequate language *********************************************************************  
    setUserLang: function (x) {
        if (x.indexOf('@' + pv.USER_LANG) > 0) {
            return x.substr(0, x.indexOf('@' + pv.USER_LANG)).split('|').slice(-1).pop();
        } else if (x.indexOf('@en') > 0) {
            return x.substr(0, x.indexOf('@en')).split('|').slice(-1).pop();
        } else if (x.indexOf('@') > 0) {
            return x.substr(0, x.indexOf('@')).split('|').slice(-1).pop();
        } else {
            return x.split('|')[0];
        }
    },

    //********************************************************************************************************
    //************************insert the corresponding vocabulary description*********************************         
    insertProjCards: function (divID, projects, p) {
        if (projects.has(p)) {
            pv.iPC(projects.get(p), divID);
        } else {
            for (let project of projects.values()) {
                pv.iPC(project, divID);
            }
        }
    },

    //***************************get the corresponding vocabulary description********************************      
    iPC: function (project, divID) {
        $('#' + divID).append(`
                <div class="card my-4">
                    <h5 class="card-header">
                        <strong>${project.acronym}</strong> - ${project.title}
                    </h5>
                    <div class="card-body">
                        ${project.description.slice(0, 180)}..<br>
                        Project: <a href="${project.project_page}">${project.project_page}</a><br>
                        RDF: <a href="${project.rdf_download}">${project.rdf_download}</a>
                    </div>
                </div>`);
    },

    //*******************************************************************************************************
    //***************create a bootstrap card with all concept links within a concept scheme****************** 
    insertConceptBrowser: function (divID, uri, offset) {

        $('#' + divID).append(`
        <hr>
        <div class="card my-4">
            <ul id="coBr" class="pagination mb-4 cardHeaderRight">
                <li>
                    <button type="button" id="leftBtn" class="btn btn-outline-secondary btn-sm" onclick="provideAll('allConcepts', '${uri}', Number(this.value)-50)">
                        &#9664;
                    </button>
                </li>
                <li>
                    <button type="button" id="rightBtn" class="btn btn-outline-secondary btn-sm" onclick="provideAll('allConcepts', '${uri}', Number(this.value)+50)">
                        &#9654;
                    </button>
                </li>
            </ul>
            <h5 id="allConceptsHeader" class="card-header"></h5>
            <div id="allConcepts" class="card-body"></div>
        </div>
                           `);
        pv.provideAll('allConcepts', uri, 0);
    },

    //*******************the query to provide all concept links within a concept scheme****************************************************
    provideAll: function (divID, uri, offset) { //provide all available concepts for navigation

        ws.json(`PREFIX dcterms:<http://purl.org/dc/terms/> 
                                    PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                    SELECT DISTINCT ?c (COALESCE(?l, ?lEN) AS ?Label) (COALESCE(?csl, ?cslEN) AS ?Title)
                                    (COALESCE(?csd, ?csdEN, "") AS ?Desc) (EXISTS{?cs skos:hasTopConcept ?c} AS ?isTopConcept)
                                    WHERE {
                                    ?cs a skos:ConceptScheme; skos:hasTopConcept ?tc; dcterms:title ?cslEN . FILTER(lang(?cslEN)="en") .
                                    <${uri}> skos:broader* ?tc . ?cs skos:hasTopConcept ?tc2 .
                                    ?c skos:broader* ?tc2; skos:prefLabel ?lEN . FILTER(lang(?lEN)="en")
                                    OPTIONAL {?c skos:prefLabel ?l . FILTER(lang(?l)="${pv.USER_LANG}")}
                                    OPTIONAL {?cs dcterms:title ?csl . FILTER(lang(?csl)="${pv.USER_LANG}")}
                                    OPTIONAL {?cs dcterms:description ?csd . FILTER(lang(?csd)="${pv.USER_LANG}")}
                                    OPTIONAL {?cs dcterms:description ?csdEN . FILTER(lang(?csdEN)="en")}
                                    }
                                    ORDER BY ?Label
                                    LIMIT 50
                                    OFFSET ${offset}`, jsonData => {
            let a = [];
            $('#' + divID).append('');
            $('#allConceptsHeader').html(jsonData.results.bindings[0].Title.value + ' (' + Number(offset + 1) + ' .. ' + Number(offset + jsonData.results.bindings.length) + ')');
            $('#allConcepts').empty();
            $('#allConcepts').append('<div>' + jsonData.results.bindings[0].Desc.value.slice(0, 400) + '.. </div><br>');

            jsonData.results.bindings.forEach((i) => {
                if (i.isTopConcept.value == 'true') {
                    a.push('<a href="' + pv.BASE + '?uri=' + i.c.value + '&lang=' + pv.USER_LANG + '"><strong>' + i.Label.value + '</strong></a> (top concept)');
                } else {
                    a.push('<a href="' + pv.BASE + '?uri=' + i.c.value + '&lang=' + pv.USER_LANG + '">' + i.Label.value + '</a>');
                }
            });
            if (offset !== 0) {
                $('#allConcepts').append('.. ');
            }
            $('#allConcepts').append(a.join(', '));

            document.getElementById("leftBtn").value = offset;
            document.getElementById("rightBtn").value = offset;
            if (document.getElementById("leftBtn").value == "0") {
                $('#leftBtn').prop('disabled', true);
                if (Object.keys(jsonData.results.bindings).length < 50) {
                    $("#coBr").hide();
                }
            } else {
                $('#leftBtn').prop('disabled', false);
            }
            if (Object.keys(jsonData.results.bindings).length < 50) {
                $('#rightBtn').prop('disabled', true);
            } else {
                $('#rightBtn').prop('disabled', false);
                $('#allConcepts').append(' ...');
            }
        });
    },
    __selectSearchLink: function (up, click) {
        var options = $(".searchLink");
        if (options.length == 0)
            return;
        for (var c = 0; c < options.length; c++) {
            if ($(options[c]).hasClass("selected"))
                break;
        }
        if (click) {
            return c >= options.length ? null : $(options[c]);
        }
        if (c >= options.length)
            c = -1;
        if (up)
            c = c < 1 ? options.length - 1 : c - 1;
        else
            c = c == -1 || c == options.length - 1 ? 0 : c + 1;
        options.removeClass("active");
        options.removeClass("selected");
        if (c >= 0) {
            var o = $(options[c]);
            o.addClass("selected");
            o.addClass("active");
            var searchInput = $('#searchInput');
            searchInput.val(o.text().trim());
        }
    }
};

//***********************************************************************************************************      
//********************************END************************************************************************
