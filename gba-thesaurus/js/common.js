function chgLang(lang) {
    if (location.href.indexOf('lang=') != -1) {
        if (lang == 'de') {
            location.replace(location.href.replace('lang=en', 'lang=de'));
            console.log(location.href);
        } else {
            location.replace(location.href.replace('lang=de', 'lang=en'));
            console.log(location.href);
        }
    } else if (location.href.indexOf('?') != -1) {
        location.replace(location.href + ('&lang=') + lang);
        console.log(location.href);
    } else {
        location.replace(location.href + '?lang=' + lang);
        console.log(location.href);
    }
}

//********************************************************************** 

function sideCard_projInfo(divID, project) {
    $('#' + divID).append(`<div class="card border-info mb-3">
                                <h5 class="card-header">${project.name} (${TOPIC})</h5>
                                <div id="${project.id}Card" class="card-body">${project.desc}</div>
                            </div>`);
}

function openParaLink(queryString) { //zB 'info=disclaimer'
    window.open(BASE + '?' + queryString + '&lang=' + USER_LANG, '_self', '', 'false');
}

//**********************************************************************  

function info(divID, topic) {
    $('#' + divID).empty();
    $('#' + divID).append('<br>' + eval('DESC_' + topic.toUpperCase()));
}

//**********************************************************************  

function sparql(endpoint, uri, label) {


    $('#pageContent').append(`<br>
                <div class="card border-info">
                    <div class="card-body">
                        <div style="">
                            <div style="float:left;"><h2>${DB_QUERY}&nbsp;</h2></div>
                            <div style="float:right; min-width:210px" class="form-group">
                                <select class="form-control" id="endpointSelect"></select>
                            </div>
                        </div>
                        <div style="">
                            <div style="float:left; width:85%;">
                                <textarea class="form-control code" id="sparqlCode" rows="14"></textarea>
                            </div>
                            <div style="float:right; width:15%; padding-left: 1rem;">
                                <fieldset class="form-group" style="display: inline-block;" id="namespacesAddin">
                                  <span>Namespace</span>
                                </fieldset>
                            </div>
                        </div>
                        <div style="clear:both; padding-top:20px;">
                           <div style="float:left; margin-right:10px; font-size:120%;"><strong>Output format:</strong></div>
                           <div class="form-group" style="float:left; margin-right:10px;">
                              <select class="form-control" id="outputFormat">
                                <option value='text/html'>HTML table</option>
                                <option value='application/json'>JSON</option> 
                                <option value='application/rdf+xml'>XML</option>
                              </select>
                            </div>
                            <div style="float:right;">
                                <button id="runSparql" type="submit" class="btn btn-success" style="width:150px;">run query</button>
                            </div>
                        </div>
                    </div>                    
                </div>`);
    
    $('#runSparql').on('click', function (e) {
        // https://code.google.com/archive/p/rdfquery/  zur validierung
        window.open($('#endpointSelect').find(":selected").val() + '?query=' + encodeURIComponent($('#sparqlCode').val()) + '&content-type=' + encodeURI($('#outputFormat').find(":selected").val()), '_blank');

    })

    $('#sparqlCode').on('input propertychange', function (e) {
        fetch(endpoint + 'doc?query=' + encodeURIComponent($('#sparqlCode').val()) + '')
            .then(function (response) {
                if (response.ok) {
                    $('#runSparql').prop('disabled', false);
                } else {
                    $('#runSparql').prop('disabled', true);
                }
            });
    });

    $.each(n, function (key, value) {
        $('#namespacesAddin').append(`<div class="form-check">
                                        <label class="form-check-label">
                                          <input class="form-check-input" value="${value}" type="checkbox">
                                          ${key}
                                        </label>
                                      </div>`);
    });

    $('#namespacesAddin :checkbox').change(function () {
        let a = 'PREFIX ' + $(this).parent().text().trim() + ':<' + $(this).val() + '>\r\n';
        $('#sparqlCode').val(function (index, old) {
            return a + old;
        });
    })

    $.each(LIST_THESAURUS_PROJECTS, function (index, value) {
        $('#endpointSelect').append(`<option value="${endpoint}${value.id}">${value.name} (${TOPIC})</option>`);
        if (uri.search(value.id) > -1) {
            $("#endpointSelect").val(`${endpoint}${value.id}`);
        }
    });

    let query = encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                        SELECT ?L ?D
                                        WHERE {
                                        <http://resource.geolba.ac.at/doc/159> skos:narrower* ?s .
                                        ?s skos:prefLabel ?L . FILTER (lang(?L)='${USER_LANG}') .
                                        ?s skos:definition ?D
                                        }`);

    fetch(endpoint + 'doc?query=' + query + '&format=application/json')
        .then(res => res.json())
        .then(jsonData => {
            //console.log(jsonData);
            $('#pageContent').append(`<br>
                                        <h3>${EXAMPLE_QUERY}</h3>
                                        <table class="table table-hover" id="bmTbl">
                                            <tbody></tbody>
                                        </table>`);

            for (var i in jsonData.results.bindings) {
                if (label.length > 1 && jsonData.results.bindings[i].L.value.search('label') > -1) {
                    $('#bmTbl tbody').append(`<tr id="${i}">
                                                <td>
                                                    <span class="glyphicons glyphicons-align-left text-info style=""></span>
                                                    ${jsonData.results.bindings[i].L.value.replace(/\+label/g, '<a href="' + BASE + '?uri=' + uri + '">' + decodeURIComponent(label) + '</a>')}
                                                </td>
                                              </tr>`);
                }
                if (jsonData.results.bindings[i].L.value.search('label') < 0) {
                    $('#bmTbl tbody').append(`<tr id="${i}">
                                                <td>
                                                    <span class="glyphicons glyphicons-align-left text-info style=""></span>
                                                    ${jsonData.results.bindings[i].L.value}
                                                </td>
                                              </tr>`);
                }
            };

            $('#bmTbl > tbody > tr').click(function () {
                //console.log(jsonData.results.bindings[$(this).attr('id')].D.value.replace(/§/g, '&#xa;'));
                let a = String.fromCharCode(167);
                let regex = new RegExp(a, "g");
                $('#sparqlCode').empty();
                $('#sparqlCode').val(jsonData.results.bindings[$(this).attr('id')].D.value.replace(regex, '\r\n').replace(/\+uri/g, uri).replace(/\+lang/g, USER_LANG));
                $('#runSparql').prop('disabled', false);
            });
        });
}

//**********************************************************************  

function labelNavbarFooter() {
    $('#LABEL_CONTACT').html(LABEL_CONTACT);
    $('#contact').html(LABEL_CONTACT);
    //$('#feedback').html(LABEL_FEEDBACK);
    $('#license').html(LABEL_LICENSE);
    $('#disclaimer').html(LABEL_DISCLAIMER);
    $('#IMG_GBALOGO').attr('src', 'img/' + IMG_GBALOGO);
}

//**********************************************************************         

function insertSearchCard(widgetID) {

    $('#searchInput').keydown(function (e) {
        if (e.which == 13) {
            openParaLink('search=' + encodeURI($('#searchInput').val()));
            $('#dropdown').empty();
            $('#searchInput').val('');
        }
    });

    $('#searchBtn').click(function (e) { //provide search results 
        openParaLink('search=' + encodeURI($('#searchInput').val()));
        $('#dropdown').empty();
        $('#searchInput').val('');
    });

    $('#searchInput').focusout(function () {
        $('#dropdown').delay(300).hide(0, function () {
            $('#dropdown').empty();
            $('#searchInput').val('');
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
                        entry = entry + ' <span class="addVoc">(' + eval(value.s.value.split('\/')[3] + 'Desc').name + ')</span>';
                    }
                    $('#dropdown').append('<tr><td class="searchLink" onclick="document.location.href = \'' + BASE + '?uri=' + value.s.value + '&lang=' + USER_LANG + '\';">' + entry + '</td></tr>');
                });
            }
        }, 200);
    });
}

//**********************************************************************         

function initSearch(projects, endpoint, lang) {

    let a = [];
    let b = 0;
    projects.forEach(function (project) {

        let query = encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                        SELECT ?s ?L 
                                        WHERE { 
                                        VALUES ?p {skos:prefLabel skos:altLabel} 
                                        ?s a skos:Concept; ?p ?L . FILTER(lang(?L)="${lang}") 
                                        } ORDER BY STRLEN(STR(?L)) ?L`);

        fetch(endpoint + project.id + '?query=' + query + '&format=application/json')

            .then(res => res.json())
            .then(jsonData => {
                a = [...a, ...jsonData.results.bindings];
                b += 1;

                if (b == LIST_THESAURUS_PROJECTS.length) {
                    const options = {
                        shouldSort: true,
                        tokenize: true,
                        keys: ['L.value']
                    };
                    window.fuse = new Fuse(a, options);
                }
            });
    });
}

//**********************************************************************         

function search(projects, endpoint, searchText, lang) {
    let gbaStatusStyle = ['bold', 'success', 'danger', 'primary'];
    $('#pageContent').empty();
    $('#pageContent').append('<br><h1>' + TITLE_SEARCHRESULTS + '</h1><p id="hits" class="lead">' + HITS_SEARCHRESULTS +
        '\"' + searchText + '\"</p><hr><ul id="searchresults" class="searchresults"></ul>');
    $('#searchresults').bind("DOMSubtreeModified", function () {
        $('#hits').html(HITS_SEARCHRESULTS.replace('0', $('#searchresults li').length) + '\"' + searchText + '\"');
    });

    projects.forEach(function (project) {

        let query = encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                        SELECT DISTINCT ?s (MIN(?pL) AS ?title) (GROUP_CONCAT(DISTINCT ?label; separator = "$") as ?text) (MIN(?so) AS ?sort) 
                                        (MIN(?stat) AS ?Status) 
                                        WHERE { 
                                        VALUES ?n {"${searchText.toLowerCase()}"} 
                                        VALUES ?p {skos:prefLabel skos:altLabel skos:definition skos:scopeNote <http://purl.org/dc/terms/description>} 
                                        ?s a skos:Concept; ?p ?L . FILTER((lang(?L)="${lang}")) . 
                                        BIND(CONCAT(STR(?p),"|",STR(?L)) AS ?label) . FILTER(regex(?L,?n,"i")) 
                                        ?s skos:prefLabel ?pL . FILTER((lang(?pL)="${lang}")) 
                                        BIND(IF(?p=skos:prefLabel,1,2) AS ?so) 
                                        OPTIONAL {?s <http://resource.geolba.ac.at/PoolParty/schema/GBA/GBA_Status> ?st} 
                                        BIND (IF(exists{?s <http://resource.geolba.ac.at/PoolParty/schema/GBA/GBA_Status> ?st} , ?st, 0) AS ?stat) 
                                        } 
                                        GROUP BY ?s 
                                        ORDER BY ?sort 
                                        LIMIT 100`);

        fetch(endpoint + project.id + '?query=' + query + '&format=application/json')

            .then(res => res.json())
            .then(jsonData => {

                jsonData.results.bindings.forEach(function (a) {
                    if ($('#searchresults li').length > 199) {
                        return false;
                    } else {
                        $('#searchresults').append(`
                                            <li>
                                                <a href="${BASE}?uri=${a.s.value}&lang=${USER_LANG}">
                                                    <strong>${a.title.value}</strong> (${project.name})
                                                </a>
                                                <br>
                                                <span class="searchPropTyp">URI: </span>
                                                <span class="searchResultURI text-${gbaStatusStyle[Number(a.Status.value)]}">
                                                    ${a.s.value}
                                                </span>
                                                <br>
                                                <p class="searchResultText">
                                                    ${createSearchResultsText(a.text.value, searchText)}
                                                </p>
                                            </li>`);
                        if ($('#searchresults li').length > 199) {
                            $('#hits').prepend('>');
                        }
                    }
                });

            }).catch(function (error) {
                //console.log(error);
            });
    });
}

//**********************************************************************          

function createSearchResultsText(sparqlText, searchText) {

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
}

//**********************************************************************        

function toggleRead(divBtn, divTxt, text) {
    let txt = $('#' + divTxt).is(':visible') ? '&#9654; <em>' + text + ' ..</em>' : '&#9660; <em>' + text + ' ..</em>';
    $('#' + divBtn).html(txt);
    $('#' + divTxt).slideToggle();
}


//**********************************************************************         

function insertProjCards(divID, projects, endpoint, lang) {
    projects.forEach(function (project) {

        let query = encodeURIComponent(`
                            PREFIX dcterms:<http://purl.org/dc/terms/> 
                            PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                            SELECT ?cL (COALESCE(?cD, "") AS ?desc) (COUNT(?n) AS ?count) (GROUP_CONCAT(DISTINCT ?L; separator = "|") as ?topConcepts) 
                            WHERE { 
                            ?c a skos:ConceptScheme; dcterms:title ?cL  
                            . FILTER(lang(?cL)="${lang}") . 
                            ?c skos:hasTopConcept ?tc . ?tc skos:prefLabel ?tcL . FILTER(lang(?tcL)="${lang}") . 
                            ?tc skos:narrower* ?n 
                            BIND(CONCAT(STR(?tc),"$",STR(?tcL)) AS ?L) 
                            OPTIONAL {?c dcterms:description ?cD . FILTER(lang(?cD)="${lang}")} 
                            } 
                            GROUP BY ?cL ?cD ORDER BY ?cL`);

        fetch(endpoint + project.id + '?query=' + query + '&format=application/json')

            .then(res => res.json())
            .then(jsonData => {
                $('#' + divID).append('<div class="card my-4"><h5 class="card-header">' + project.name +
                    '</h5><div id="' + project.id + 'Card" class="card-body"></div></div>');

                //work around for HTML5 details and summary tags
                //$('#' + project.id + 'Comment').append('<details id="'+ project.id + 'ReadMore' +'"><summary class="text-muted"><em>read more ..</em></summary><br></details>');
                $('#' + project.id + 'Comment').append(`
                            <br>
                            <div style="cursor: pointer;" id="${project.id}rmBtn"
                            onclick="javascript: toggleRead(\'${project.id}rmBtn\', \'${project.id}ReadMore\', \'read more\');"
                            class="text-muted">
                                &#9654; <em>read more ..</em>
                            </div>
                            <div style="display:none;" id="${project.id}ReadMore">
                                <br>
                            </div>`);

                jsonData.results.bindings.forEach(function (a) {
                    //console.log(a.topConcepts.value);
                    $('#' + project.id + 'Card').append(a.cL.value + ':<br><a href="' + BASE + '?uri=' +
                        a.topConcepts.value.split('$').join('&lang=' + USER_LANG + '">').split('|').join('</a>, <a href="' + BASE + '?uri=') + '</a><br>');
                    //add concept schemes + topConcepts to project descriptions
                    $('#' + project.id + 'ReadMore').append('<h5>' + a.cL.value + ' (' + a.count.value +
                        '):</h5><a href="' + BASE + '?uri=' + a.topConcepts.value.split('$').join('&lang=' + USER_LANG + '">').split('|').join('</a>, <a href="' +
                            BASE + '?uri=') + '</a><br>' + a.desc.value + '<br><br>');
                });

                $('#' + project.id + 'ReadMore').append(`
                        <p class="">
                            <a href="http://resource.geolba.ac.at/GeologicUnit/export/${project.id}.rdf" type="button" class="btn btn-outline-info btn-sm">
                                RDF/XML download
                            </a>
                                &nbsp;
                            <a href="http://resource.geolba.ac.at/PoolParty/sparql/${project.id}" type="button" class="btn btn-outline-info btn-sm">
                                SparQL endpoint
                            </a>
                                &nbsp;
                            <a href="http://resource.geolba.ac.at/thesaurus/ref.html#${project.id}" type="button" class="btn btn-outline-info btn-sm">
                                ${LABEL_BIBLREF}
                            </a>
                        </p>
                        <hr>`);
            });
    });
}
