const n = {
    skos: 'http://www.w3.org/2004/02/skos/core#',
    dcterms: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
    gba: 'http://resource.geolba.ac.at/PoolParty/schema/GBA/',
    owl: 'http://www.w3.org/2002/07/owl#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    dbpo: 'http://dbpedia.org/ontology/'
};

const PREF_LABEL = [n.skos + 'prefLabel'];
const PICTURE = [n.foaf + 'depiction'];
const SYNONYMS = [n.skos + 'altLabel'];
const NOTATION = [n.skos + 'notation'];
const GBA_STATUS = [n.gba + 'GBA_Status'];
const GBA_DATAVIEWER = [n.gba + 'DataViewer'];
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
    gbaStatus: GBA_STATUS,
    abstract: DESCRIPTION_1,
    citation: REF_LINKS,
    relatedConcepts: [...RELATIONS_1, ...RELATIONS_2],
    dataViewer: GBA_DATAVIEWER
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

//*******************************************************************************************************************************   

function details(divID, uri, endpoint) { //build the web page content
    //query Sparql endpoint

    let queryResult = $.ajax({ //query the concept and all relations
        url: endpoint + uri.split("/")[3],
        data: {
            query: `PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                    SELECT DISTINCT ?p ?o (GROUP_CONCAT(DISTINCT CONCAT(STR(?L), "@", lang(?L)) ; separator="|") AS ?Label) 
                    WHERE { 
                    VALUES ?s {<${uri}>} ?s ?p ?o . 
                    OPTIONAL {?o skos:prefLabel ?L}
                    } 
                    GROUP BY ?p ?o 
            `,
            format: "application/json"
        },
    });

    queryResult.done(function (data) {
        for (key in FRONT_LIST) createFrontPart(divID, uri, data, Array.from(FRONT_LIST[key].values()));

        $('#' + divID).append(`<hr>
                                <div style="cursor: pointer; color: #777;" id="detailsBtn" 
                                    onclick="javascript: toggleRead(\'detailsBtn\', \'detailsToggle\', \'read more\');"> &#9654; <em>read more ..</em>
                                </div>
                                <div style="display:none;" id="detailsToggle">
                                <br>
                                    <table id="details"></table>
                                </div>
                                `);

        for (key in TECHNICAL_LIST) createTechnicalPart('details', data, Array.from(TECHNICAL_LIST[key].values()));
        $('#' + divID).append('');

        insertConceptBrowser(divID, uri, 50);
    });
}

//*******************************************************************************************************************************   

function createFrontPart(divID, uri, data, props) {

    let html = '';
    props.forEach((i) => {
        let ul = getObj(data, i);
        if (ul.size > 0) {
            switch (key) {
                case 'prefLabel':
                    let pL = setUserLang(Array.from(ul).join('|').replace(/  <span class="lang">/g, '@').replace(/<\/span>/g, ''));
                    html += '<h1 class="mt-4">' + pL + '</h1>';
                    html += `   <p class="lead">URI: 
                                    <span id="uri" class="">${uri}</span>
                                        &nbsp;&nbsp;&nbsp;&#8658;
                                    <a href="${uri}.rdf"> RDF download</a>
                                </p>
                                <hr>`;
                    addApp('Database', 'tables', `${BASE}?uri=${uri}&list=${encodeURIComponent(pL)}&lang=${USER_LANG}`, 'table');
                    break;
                case 'dataViewer':
                    if (uri.search('/structure/') == -1) {
                        addApp('Data', 'Viewer', 'http://gisgba.geologie.ac.at/DataViewer/tdv/Index.aspx?url=' + uri + '&lang=' + USER_LANG, 'map');
                    } else {
                        addApp('Structure', 'Viewer', 'http://www.geolba.net/thesaurus/structureViewer.html?uri=' + uri + '&lang=' + USER_LANG, 'map-marker');
                    }
                    break;
                case 'picture':
                    ul.forEach(a => addApp('text1', 'text2', $(a).attr('href'), 'picture'));
                    break;
                case 'altLabel':
                    html += '<ul class="' + key + '"><li>' + Array.from(ul).join('</li><li>') + '</li></ul>';
                    break;
                case 'notation':
                    $('#' + divID).append('<hr><span>Notation: </span>');
                    html += '<ul class="' + key + '"><li>' + Array.from(ul).join('</li><li>') + '</li></ul>';
                    break;
                case 'gbaStatus':
                    $('#' + divID).append('<br><span>GBA Status: </span>');
                    let status = Number(Array.from(ul)[0].slice(0, 1));
                    let gbaStatusStyle = ['', 'success', 'danger', 'primary'];
                    let gbaStatusText = ['', 'official use', 'informal use', 'obsolete'];
                    html += '<span class="badge badge-' + gbaStatusStyle[status] + '"> ' + gbaStatusText[status] + ' </span>';
                    $('#uri').attr('class', 'text-' + gbaStatusStyle[status]);
                    break;
                case 'abstract':
                    html += '<hr><div class="' + key + '">' + setUserLang(Array.from(ul).join('|').replace(/  <span class="lang">/g, '@').replace(/<\/span>/g, '')) + '</div>';
                    break;
                case 'citation':
                    let a = [];
                    ul.forEach(i => {
                        a.push($.parseHTML(i)[0].innerHTML);
                    });
                    html += '<div id="citation"></div>';
                    getCitation(a);
                    break;
                case 'relatedConcepts':
                    if (html.search('<h4') == -1) {
                        html += '<hr><h4 style="margin-bottom: 1rem;">' + SEM_REL + '</h4>';
                    }
                    html += '<table><tr><td class="skosRel' + i.search('Match') + ' skosRel">' + i.replace(n.skos, '') + '</td><td class="skosRelUl"><ul><li>' +
                        shortenText(Array.from(ul).join('</li><li>')) + '</li></ul></td></tr></table>';

                    break;
            }
        }

    });
    $('#' + divID).append(html);
}


//*******************************************************************************************************************************

function shortenText(text) {

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

}

//*******************************************************************************************************************************    

function createTechnicalPart(divID, data, props) { //loop all single properties
    let html = '';
    let geoPath = 'http://www.w3.org/2003/01/geo/wgs84_pos#';
    let coord = {};

    props.forEach((i) => {
        let ul = getObj(data, i);
        if (ul.size > 0) {
            html += '<tr><td class="propTech">' + createHref(i) + '</td><td><ul><li>' + Array.from(ul).join('</li><li>') + '</li></ul></td></tr>';

            if (i == geoPath + 'lat') {
                coord.lat = Number(ul.values().next().value);
            }
            if (i == geoPath + 'long') {
                coord.long = Number(ul.values().next().value);
            }
            if (coord.hasOwnProperty('lat') && coord.hasOwnProperty('long')) {
                addApp('type', 'location', 'http://www.google.com/maps/place/' + coord.lat + 'N+' + coord.long + 'E/@47.6381118,13.6028916,7z/data=!4m2!3m1!1s0x0:0x0', 'map-marker');
                coord = {};
            }
            if (i == 'http://dbpedia.org/ontology/colourHexCode') {
                addApp('<span class="colorBox" style="background:' + ul.values().next().value + ';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><br>Color', ul.values().next().value, 'https://www.w3schools.com/colors/colors_converter.asp?color=' + ul.values().next().value.replace('#', ''), '');
            }

        }
    });



    if (html.length > 0) {
        $('#' + divID).append(`
                    <tr id="${key}">
                        <th></th>
                        <th>
                            ${eval(key + '_H')}
                        </th>
                    </tr>
                    <tr>
                        ${html}
                    </tr>`);
    }
}
//*******************************************************************************************************************************   

function getObj(data, i) {
    return new Set($.map(data.results.bindings.filter(item => item.p.value === i), (a => (a.Label.value !== '' ? '<a href="' + BASE +
        '?uri=' + a.o.value + '&lang=' + USER_LANG + '">' + setUserLang(a.Label.value) + '</a> ' : createHref(a.o.value) + ' ' +
        createDTLink(a.o.datatype) + ' ' + langTag(a.o['xml:lang'])))));
}

//*******************************************************************************************************************************       

function createHref(x) { //PROVIDE_REDIRECT?

    if (x.substring(0, 22) == 'http://resource.geolba') { //vocabulary base URI
        x = '<a href="' + BASE + '?uri=' + x + '">' + x + '</a>';
    } else if (x.substring(0, 4) == 'http') {
        let a = x;
        for (const [key, value] of Object.entries(n)) a = a.replace(value, key + ':');
        x = '<a href="' + x + '">' + refPdf(a.replace(/_/g, ' ')) + '</a>';
    }
    /*else if (x.length == 7 && x.charAt(0) == '#') {
           x += ' <span class="colorBox" style="background:' + x + ';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
       }*/
    return x;
}

//*******************************************************************************************************************************           

function langTag(x) {
    if (typeof x !== 'undefined') {
        x = '<span class="lang">' + x + '</span>';
    } else {
        x = '';
    }
    return x;
}

//*******************************************************************************************************************************           

function createDTLink(x) {
    if (typeof x !== 'undefined') {
        if (x.indexOf('XMLSchema') > 0) {
            x = '<a class="datatype" href="' + x + '">' + x.replace('http://www.w3.org/2001/XMLSchema#', 'xsd:') + '</a>';
        }
    } else {
        x = '';
    }
    return x;
}

//*******************************************************************************************************************************  

function setUserLang(x) {
    if (x.indexOf('@' + USER_LANG) > 0) {
        return x.substr(0, x.indexOf('@' + USER_LANG)).split('|').slice(-1).pop();
    } else if (x.indexOf('@en') > 0) {
        return x.substr(0, x.indexOf('@en')).split('|').slice(-1).pop();
    } else if (x.indexOf('@') > 0) {
        return x.substr(0, x.indexOf('@')).split('|').slice(-1).pop();
    } else {
        return x.split('|')[0];
    }
}

//*******************************************************************************************************************************  

function getCitation(refArr) {
    refArr = '<' + refArr.join('> <') + '>';

    let query = encodeURIComponent(`SELECT DISTINCT ?Citation ?DSN ?PDF
                                    WHERE {
                                    VALUES ?r {${refArr}}
                                    ?r <http://www.w3.org/2004/02/skos/core#definition> ?Citation . 
                                    OPTIONAL {?r <http://resource.geolba.ac.at/schema/GBA/DNS> ?dsn}
                                    BIND (IF(exists{?r <http://resource.geolba.ac.at/schema/GBA/DNS> ?dsn} , ?dsn, "") AS ?DSN)
                                    OPTIONAL {?r <http://resource.geolba.ac.at/schema/GBA/PDF_download> ?pdf} 
                                    BIND (IF(exists{?r <http://resource.geolba.ac.at/schema/GBA/PDF_download> ?pdf} , ?pdf, "") AS ?PDF) 
                                    }`);

    fetch('http://resource.geolba.ac.at/PoolParty/sparql/ref?query=' + query + '&format=application/json')

        .then(res => res.json())
        .then(jsonData => {
            html = '<br><blockquote class="blockquote">';
            jsonData.results.bindings.forEach((i) => {

                html += '<footer class="blockquote-footer">' + i.Citation.value.replace(/\:/g, ': <cite title="">') + '</cite>';
                if (i.PDF.value !== '' && i.PDF.value.substring(0, 4) == 'http') {
                    html += '&nbsp;-&nbsp;<a href="' + i.PDF.value + '" style="font-style: normal;">[PDF]</a>';
                } else if (i.PDF.value !== '') {
                    html += '&nbsp;-&nbsp;<a href="http://opac.geologie.ac.at/wwwopacx/wwwopac.ashx?command=getcontent&server=images&value=' + i.PDF.value + '" style="font-style: normal;">[PDF]</a>';
                }
                if (i.DSN.value !== '') {
                    html += '&nbsp;-&nbsp;<a href="http://opac.geologie.ac.at/document/' + i.DSN.value + '" style="font-style: normal;">[Catalog]</a>';
                }
                html += '</footer>';

            });
            $('#citation').append(html + '</blockquote>');
        });
}

//*******************************************************************************************************************************  

function provideAll(divID, uri, offset) { //provide all available concepts for navigation
    //query Sparql endpoint
    //let endpoint = 'http://resource.geolba.ac.at/PoolParty/sparql/' + concept.split("/")[3];
    let queryResult = $.ajax({ //query the concept and all relations
        url: 'http://resource.geolba.ac.at/PoolParty/sparql/' + uri.split("/")[3],
        data: {
            query: `PREFIX dcterms:<http://purl.org/dc/terms/> 
                    PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                    SELECT DISTINCT ?s (STR(?l) AS ?Label) ?cs (STR(?csl) AS ?Schema) (COALESCE(?csd, "") AS ?SchemaDesc) (COALESCE(?sd, "") AS ?Desc) ?tc 
                    WHERE { 
                    <${uri}> skos:broader* ?b . ?b skos:topConceptOf ?cs . 
                    ?cs dcterms:title ?csl .  FILTER(lang(?csl)="${USER_LANG}") . 
                    ?cs skos:hasTopConcept ?tc . ?s skos:broader* ?tc; skos:prefLabel ?l . FILTER(lang(?l)="${USER_LANG}") 
                    OPTIONAL{?cs dcterms:description ?csd .  FILTER(lang(?csd)="${USER_LANG}") } 
                    OPTIONAL{?s skos:definition ?sd .  FILTER(lang(?sd)="${USER_LANG}") } 
                    } 
                    ORDER BY ?Label 
                    LIMIT 50 
                    OFFSET ${offset}`,
            format: 'application/json'
        },
    });

    queryResult.done(function (data) {
        let a = [];
        $('#' + divID).append('');
        $('#allConceptsHeader').html(data.results.bindings[0].Schema.value + ' (' + Number(offset + 1) + ' .. ' + Number(offset + data.results.bindings.length) + ')');
        $('#allConcepts').empty();
        $('#allConcepts').append('<div>' + data.results.bindings[0].SchemaDesc.value + '</div><br>');

        data.results.bindings.forEach((i) => {
            if (i.s.value == i.tc.value) {
                a.push('<a data-toggle="tooltip" data-placement="right" data-html="true" title="<h4>' + i.Label.value + '</h4>' + i.Desc.value.slice(0, 230) + '.." href="' + BASE + '?uri=' + i.s.value + '&lang=' + USER_LANG + '"><strong>' + i.Label.value + '</strong></a> (&#8658; top concept)');
            } else {
                a.push('<a data-toggle="tooltip" data-placement="right" data-html="true" title="<h4>' + i.Label.value + '</h4>' + i.Desc.value.slice(0, 230) + '.." href="' + BASE + '?uri=' + i.s.value + '&lang=' + USER_LANG + '">' + i.Label.value + '</a>');
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
            if (Object.keys(data.results.bindings).length < 50) {
                $("#coBr").hide();
            }
        } else {
            $('#leftBtn').prop('disabled', false);
        }
        if (Object.keys(data.results.bindings).length < 50) {
            $('#rightBtn').prop('disabled', true);
        } else {
            $('#rightBtn').prop('disabled', false);
            $('#allConcepts').append(' ...');
        }

        $(document).ready(function () {
            $('[data-toggle="tooltip"]').tooltip({
                trigger: "hover"
            });
            $('[data-toggle="tooltip').on('click', function () {
                $(this).tooltip('hide');
                $("#DeleteUserModal").modal();
            });
        });

    });
}

//******************************************************************************************************************************* 

function insertConceptBrowser(divID, uri, offset) {

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
    provideAll('allConcepts', uri, 0);
}

//******************************************************************************************************************************* 

function feedBack() {

    let email = 'thesaurus@geologie.ac.at';
    let subject = 'Anfrage';
    let body = '';
    if ($('#uri').length > 0) {
        body = 'URI: ' + $('#uri').text();
    }
    if ($('.altLabel').length > 0) {
        subject = $('.altLabel').html().replace(/<span class="lang">/g, '[').replace(/<\/span>/g, '] ').replace(/<li>/g, '').replace(/<\/li>/g, '').replace(/  /g, '');
    }
    let mailto_link = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
    window.location.href = mailto_link;
}

//*******************************************************************************************************************************           

function refPdf(a) {

    if (a.split('.').slice(-1).pop().toLowerCase() == 'pdf') {
        a += ' - <img src="' + pdfImage() + '">';
    }
    return a;
}

//*******************************************************************************************************************************           

function pdfImage() {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAIcKAACMDQABBbcAAIDoAABSBQABFVsAADavAAAfQQLQ3GkAAAFDSURBVHjaADYByf4B////+gAAurGy5f/39vz6Cfn8Bu/1EwgRPEFFEyMWAf6ajgHZ5vjF2Pz+AwIGBef67PdANSx6b6nJxhAuKATxk4QB0+4PAAAAAAAAAADRAAD1E/3p3Du259X3+ucE6CIv9Q70BPfyDgAC5vr84Pf9QVhZ4+DvMA4q9vf9Af///+kA/r7NtSMjJwrw+uO3xklYZgDh7QAABs7KzAQAAAAA5usu3AwrGSLr49385fz90dj8LiPJCfuU7vgEAAAAAAQDCxQTAPX++Le8LyAW08y57sXyDSwkavz8BAAAAP76+O/05va1yRoeBf1LKwkIKBfQ0BPn7w3x+wQAAAAJBwcC8+oZLR4QQ0f7APAA8+oQNz8W+grJqK8EAAAABQcHu+Pi29HP87OxBvX+CfsE9Pj89QACHCsrAwCLf5kn2fkcxQAAAABJRU5ErkJggg==";
}

//*******************************************************************************************************************************NEU!!!!!!!!!!!!!

function addApp(text1, text2, link, glyphicon) {

    if (glyphicon == 'picture') {
        $('#appsBody2').append(`
                <div class="apps thumbNail">
                    <a href="${link}">
                        <img src="${imgPng(link)}" class="img-thumbnail" alt="Image" title="Image" onerror="$(this).remove();" style="width:75px; height:75px; overflow:hidden;">
                    </a>
                </div>`);
    } else if (glyphicon == '') {
        $('#appsBody2').append(`
                <div class="apps">
                    <a href="${link}" class="card-link">
                        ${text1}<br>${text2}
                    </a>
                </div>`);
    } else {
        $('#appsBody1').append(`
                <div class="apps">
                    <span class="appsIcon glyphicons glyphicons-${glyphicon} text-info style=""></span>
                    <br>
                    <a href="${link}" class="card-link">
                        ${text1}<br>${text2}
                    </a>
                </div>`);
    }


    //*******************************************************************************************************************************

    function imgPng(url) {
        if (url.search('geologie.ac.at') > -1) {
            let a = url.split('.');
            a.pop();
            url = a.join('.') + '.png';
        }
        return url;
    }






}
