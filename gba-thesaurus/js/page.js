// page building&handling
"use strict";
var page = {
    BASE: location.protocol + '//' + location.host + location.pathname,
    urlParams: new URLSearchParams(window.location.search),

    // called on page loaded
    init: function () {
        var USER_LANG = (navigator.language || navigator.language).substring(0, 2);
        $('#appsCard').toggle();
        if (this.urlParams.has('lang')) {
            USER_LANG = this.urlParams.get('lang');
        }

        if (USER_LANG !== 'de') {
            USER_LANG = 'en';
            $('#lang').text('EN');
        } else {
            $('#lang').text('DE');
        }
        lang.load(USER_LANG);
    },

    setLang: function (lang) {
        if (location.href.indexOf('lang=') != -1) {
            if (lang == 'de') {
                location.replace(location.href.replace('lang=en', 'lang=de'));
            } else {
                location.replace(location.href.replace('lang=de', 'lang=en'));
            }
        } else if (location.href.indexOf('?') != -1) {
            location.replace(location.href + ('&lang=') + lang);
        } else {
            location.replace(location.href + '?lang=' + lang);
        }
        console.log(location.href);
    },


    openParaLink: function (queryString) { //zB 'info=disclaimer'
        window.open(this.BASE + '?' + queryString + '&lang=' + lang.ID, '_self', '', 'false');
    },
    toggleRead: function (divBtn, divTxt, text) {
        let txt = $('#' + divTxt).is(':visible') ? '&#9654; <em>' + text + ' ..</em>' : '&#9660; <em>' + text + ' ..</em>';
        $('#' + divBtn).html(txt);
        $('#' + divTxt).slideToggle();
    },

    openFeedBack: function () {
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
    },

    insertSideCard_projectInfo: function (project) {
        $('#proj_links').append(`<div class="card border-info mb-3">
                                <h5 class="card-header">${project.name} (${lang.TOPIC})</h5>
                                <div id="${project.id}Card" class="card-body">${project.desc}</div>
                            </div>`);
    },

    initSearch: function () {
        var a = [];
        var b = 0;
        var query = `PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                        SELECT ?s ?L 
                                        WHERE { 
                                        VALUES ?p {skos:prefLabel skos:altLabel} 
                                        ?s a skos:Concept; ?p ?L . FILTER(lang(?L)="${lang.ID}") 
                                        } ORDER BY STRLEN(STR(?L)) ?L`;

        lang.LIST_THESAURUS_PROJECTS.forEach(function (project) {
            ws.projectJson(project.id, query, jsonData => {
                a = [...a, ...jsonData.results.bindings];
                b += 1;

                if (b == lang.LIST_THESAURUS_PROJECTS.length) {
                    const options = {
                        shouldSort: true,
                        tokenize: true,
                        keys: ['L.value']
                    };
                    window.fuse = new Fuse(a, options);
                }
            });
        });
    },


    insertInfo: function (topic) {
        var div = $('#page_desc');
        div.empty().append('<br>' + lang['DESC_' + topic.toUpperCase()]);
    },


    insertSparql: function (uri, label) {
        var pageContent = $('#pageContent');
        pageContent.append(`<br>
                <div class="card border-info">
                    <div class="card-body">
                        <div style="">
                            <div style="float:left;"><h2>${lang.DB_QUERY}&nbsp;</h2></div>
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

        var sparqlCode = $('#sparqlCode');

        $('#runSparql').on('click', function (e) {
            // https://code.google.com/archive/p/rdfquery/  zur validierung
            window.open($('#endpointSelect').find(":selected").val() + '?query=' + encodeURIComponent(sparqlCode.val()) + '&content-type=' + encodeURI($('#outputFormat').find(":selected").val()), '_blank');
        })

        sparqlCode.on('input propertychange', function (e) {
            ws.doc(sparqlCode.val(), function (response) {
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
            sparqlCode.val(function (index, old) {
                return a + old;
            });
        })

        $.each(LIST_THESAURUS_PROJECTS, function (index, value) {
            $('#endpointSelect').append(`<option value="${endpoint}${value.id}">${value.name} (${TOPIC})</option>`);
            if (uri.search(value.id) > -1) {
                $("#endpointSelect").val(`${endpoint}${value.id}`);
            }
        });

        let query = `PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                        SELECT ?L ?D
                                        WHERE {
                                        <http://resource.geolba.ac.at/doc/159> skos:narrower* ?s .
                                        ?s skos:prefLabel ?L . FILTER (lang(?L)='${lang.ID}') .
                                        ?s skos:definition ?D
                                        }`;

        ws.docJson(query, jsonData => {
            pageContent.append(`<br>
                                        <h3>${EXAMPLE_QUERY}</h3>
                                        <table class="table table-hover" id="bmTbl">
                                            <tbody></tbody>
                                        </table>`);

            for (var i in jsonData.results.bindings) {
                if (label.length > 1 && jsonData.results.bindings[i].L.value.search('label') > -1) {
                    $('#bmTbl tbody').append(`<tr id="${i}">
                                                <td>
                                                    <span class="glyphicons glyphicons-align-left text-info style=""></span>
                                                    ${jsonData.results.bindings[i].L.value.replace(/\+label/g, '<a href="' + this.BASE + '?uri=' + uri + '">' + decodeURIComponent(label) + '</a>')}
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
                sparqlCode.empty().val(jsonData.results.bindings[$(this).attr('id')].D.value.replace(regex, '\r\n').replace(/\+uri/g, uri).replace(/\+lang/g, lang.ID));
                $('#runSparql').prop('disabled', false);
            });
        });
    },

    setNavbarFooter: function () {
        $('#LABEL_CONTACT').html(lang.LABEL_CONTACT);
        $('#contact').html(lang.LABEL_CONTACT);
        $('#license').html(lang.LABEL_LICENSE);
        $('#disclaimer').html(lang.LABEL_DISCLAIMER);
        $('#IMG_GBALOGO').attr('src', 'img/' + lang.IMG_GBALOGO);
    },

    insertSearchCard: function (widgetID) {
        var searchInput = $('#searchInput');
        $('#searchInput').keydown(function (e) {
            if (e.which == 13) {
                this.openParaLink('search=' + encodeURI(searchInput.val()));
                $('#dropdown').empty();
                searchInput.val('');
            }
        });

        $('#searchBtn').click(function (e) { //provide search results 
            this.openParaLink('search=' + encodeURI(searchInput.val()));
            $('#dropdown').empty();
            searchInput.val('');
        });

        searchInput.focusout(function () {
            $('#dropdown').delay(300).hide(0, function () {
                $('#dropdown').empty();
                searchInput.val('');
            });
        });

        let timer;
        searchInput.on('input', function () {
            clearTimeout(timer);
            $('#dropdown').empty();
            timer = setTimeout(function () {
                var searchVal = searchInput.val();
                if (searchVal.length > 0) {
                    $('#dropdown').show();
                    let autoSuggest = window.fuse.search(searchVal);
                    let c = [];
                    $.each(autoSuggest.slice(0, 10), function (index, value) {
                        c.push(value.L.value)
                    });
                    $.each(autoSuggest.slice(0, 10), function (index, value) {
                        let entry = value.L.value;
                        if (c.indexOf(entry) !== c.lastIndexOf(entry)) {
                            entry = entry + ' <span class="addVoc">(' + lang[value.s.value.split('\/')[3] + 'Desc'].name + ')</span>';
                        }
                        $('#dropdown').append('<tr><td class="searchLink" onclick="document.location.href = \'' + this.BASE + '?uri=' + value.s.value + '&lang=' + lang.ID + '\';">' + entry + '</td></tr>');
                    });
                }
            }, 200);
        });
    },

    insertSearch: function (searchText) {
        var gbaStatusStyle = ['bold', 'success', 'danger', 'primary'];
        var pageContent = $('#pageContent');
        pageContent.empty().append('<br><h1>' + lang.TITLE_SEARCHRESULTS + '</h1><p id="hits" class="lead">' + lang.HITS_SEARCHRESULTS +
            '\"' + searchText + '\"</p><hr><ul id="searchresults" class="searchresults"></ul>');
        $('#searchresults').bind("DOMSubtreeModified", function () {
            $('#hits').html(HITS_SEARCHRESULTS.replace('0', $('#searchresults li').length) + '\"' + searchText + '\"');
        });

        lang.LIST_THESAURUS_PROJECTS.forEach(function (project) {

            let query = `PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                        SELECT DISTINCT ?s (MIN(?pL) AS ?title) (GROUP_CONCAT(DISTINCT ?label; separator = "$") as ?text) (MIN(?so) AS ?sort) 
                                        (MIN(?stat) AS ?Status) 
                                        WHERE { 
                                        VALUES ?n {"${searchText.toLowerCase()}"} 
                                        VALUES ?p {skos:prefLabel skos:altLabel skos:definition skos:scopeNote <http://purl.org/dc/terms/description>} 
                                        ?s a skos:Concept; ?p ?L . FILTER((lang(?L)="${lang.ID}")) . 
                                        BIND(CONCAT(STR(?p),"|",STR(?L)) AS ?label) . FILTER(regex(?L,?n,"i")) 
                                        ?s skos:prefLabel ?pL . FILTER((lang(?pL)="${lang}")) 
                                        BIND(IF(?p=skos:prefLabel,1,2) AS ?so) 
                                        OPTIONAL {?s <http://resource.geolba.ac.at/PoolParty/schema/GBA/GBA_Status> ?st} 
                                        BIND (IF(exists{?s <http://resource.geolba.ac.at/PoolParty/schema/GBA/GBA_Status> ?st} , ?st, 0) AS ?stat) 
                                        } 
                                        GROUP BY ?s 
                                        ORDER BY ?sort 
                                        LIMIT 100`;

            ws.projectJson(project.id, query, jsonData => {

                jsonData.results.bindings.forEach(function (a) {
                    if ($('#searchresults li').length > 199) {
                        return false;
                    } else {
                        $('#searchresults').append(`
                                            <li>
                                                <a href="${this.BASE}?uri=${a.s.value}&lang=${lang.ID}">
                                                    <strong>${a.title.value}</strong> (${project.name})
                                                </a>
                                                <br>
                                                <span class="searchPropTyp">URI: </span>
                                                <span class="searchResultURI text-${gbaStatusStyle[Number(a.Status.value)]}">
                                                    ${a.s.value}
                                                </span>
                                                <br>
                                                <p class="searchResultText">
                                                    ${page.createSearchResultsText(a.text.value, searchText)}
                                                </p>
                                            </li>`);
                        if ($('#searchresults li').length > 199) {
                            $('#hits').prepend('>');
                        }
                    }
                });

            }).catch(function (error) {
                console.log(error);
            });
        });
    },

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

    insertProjCards: function () {
        var div = $('#proj_links');
        var query = `
                            PREFIX dcterms:<http://purl.org/dc/terms/> 
                            PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                            SELECT ?cL (COALESCE(?cD, "") AS ?desc) (COUNT(?n) AS ?count) (GROUP_CONCAT(DISTINCT ?L; separator = "|") as ?topConcepts) 
                            WHERE { 
                            ?c a skos:ConceptScheme; dcterms:title ?cL
                            . FILTER(lang(?cL)="${lang.ID}") . 
                            ?c skos:hasTopConcept ?tc . ?tc skos:prefLabel ?tcL . FILTER(lang(?tcL)="${lang.ID}") . 
                            ?tc skos:narrower* ?n 
                            BIND(CONCAT(STR(?tc),"$",STR(?tcL)) AS ?L) 
                            OPTIONAL {?c dcterms:description ?cD . FILTER(lang(?cD)="${lang.ID}")} 
                            } 
                            GROUP BY ?cL ?cD ORDER BY ?cL`;

        lang.LIST_THESAURUS_PROJECTS.forEach(function (project) {
            ws.projectJson(project.id, query, jsonData => {
                div.append('<div class="card my-4"><h5 class="card-header">' + project.name +
                    '</h5><div id="' + project.id + 'Card" class="card-body"></div></div>');

                //work around for HTML5 details and summary tags
                //$('#' + project.id + 'Comment').append('<details id="'+ project.id + 'ReadMore' +'"><summary class="text-muted"><em>read more ..</em></summary><br></details>');
                $('#' + project.id + 'Comment').append(`
                            <br>
                            <div style="cursor: pointer;" id="${project.id}rmBtn"
                            onclick="javascript: page.toggleRead(\'${project.id}rmBtn\', \'${project.id}ReadMore\', \'read more\');"
                            class="text-muted">
                                &#9654; <em>read more ..</em>
                            </div>
                            <div style="display:none;" id="${project.id}ReadMore">
                                <br>
                            </div>`);

                jsonData.results.bindings.forEach(function (a) {
                    //console.log(a.topConcepts.value);
                    $('#' + project.id + 'Card').append(a.cL.value + ':<br><a href="' + page.BASE + '?uri=' +
                        a.topConcepts.value.split('$').join('&lang=' + lang.ID + '">').split('|').join('</a>, <a href="' + page.BASE + '?uri=') + '</a><br>');
                    //add concept schemes + topConcepts to project descriptions
                    $('#' + project.id + 'ReadMore').append('<h5>' + a.cL.value + ' (' + a.count.value +
                        '):</h5><a href="' + page.BASE + '?uri=' + a.topConcepts.value.split('$').join('&lang=' + lang.ID + '">').split('|').join('</a>, <a href="' +
                            page.BASE + '?uri=') + '</a><br>' + a.desc.value + '<br><br>');
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
                                ${lang.LABEL_BIBLREF}
                            </a>
                        </p>
                        <hr>`);
            });
        });
    },

    insertComments: function (divID, projects) {
        var div = $('#' + divID);
        div.empty();
        projects.forEach(function (desc) {
            div.append(`
                                                <div class="media mb-4">
                                                    <img class="d-flex mr-3 rounded-circle" src="img/${desc.image}">
                                                    <div id="${desc.id}Comment" class="media-body">
                                                        <h4 class="mt-0">${desc.name}</h4>
                                                        ${desc.desc}
                                                    </div>
                                                </div>`);
        });
    },

    insertPageDesc: function () {
        $('#page_desc').append('<br><h1 id="title">GBA Thesaurus</h1>')
            .append('<h3>' + lang.TITLE_THES_2 + '</h3>')
            .append('<p>' + lang.DESC_THESAURUS + '</p>');
    },

    initApps: function (uri) {
        $('#appsCard').toggle();
        $('#appsCard .card-header').text(lang.APPS);
        $('#appsBody1').append(`
                                        <div class="apps">
                                            <span class="appsIcon glyphicons glyphicons-cluster text-info"></span>
                                            <a href="http://resource.geolba.ac.at/thesaurus/network.html#${uri.split('geolba.ac.at/')[1]}/${lang.ID}" title="Network Diagram" class="card-link">
                                                <br>Network<br>diagram
                                            </a>
                                        </div>`);
    }
};
