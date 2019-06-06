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

        this.setNavbarFooter();
        search.insertSearchCard(); //inserts search widget only

        var urlParams = this.urlParams;
        if (urlParams.has('search')) { //need lang parameter only for sparql requests
            search.insertSearch(decodeURI(urlParams.get('search')));
            this.insertProjCards(); //quick access cards, plus extended project comments from sparql
        } else if (urlParams.has('info')) {
            this.insertInfo(decodeURI(urlParams.get('info')));
            this.insertProjCards(); //quick access cards, plus extended project comments from sparql
        } else if (urlParams.has('list')) {
            $('#pageContent').empty();
            let uri = '§';
            let label = '§';
            if (urlParams.has('uri')) {
                uri = decodeURI(urlParams.get('uri').replace(/["';><]/gi, '')); //avoid injection
                label = decodeURI(urlParams.get('list').replace(/["';><]/gi, '')); //avoid injection
            }
            search.insertSparql(uri, label);
            this.insertProjCards(); //quick access cards, plus extended project comments from sparql
        } else if (urlParams.has('uri')) {
            let uri = decodeURI(urlParams.get('uri').replace(/["';><]/gi, '')); //avoid injection
            $('#pageContent').empty();
            this.initApps(uri);
            detail.details(uri);
            var project = lang[uri.split('\/')[3] + 'Desc'];
            this.insertSideCard_projectInfo(project);
        } else {
            this.insertPageDesc(); //general intro
            this.insertComments('proj_desc', lang.LIST_THESAURUS_PROJECTS); //project desc from js ,insert before ProjCards!
            this.insertComments('other_desc', [lang.DESC_INSPIRE, lang.DESC_LINKEDDATA]);
            this.insertProjCards(); //quick access cards, plus extended project comments from sparql
        }
        search.initProjects();
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

    insertInfo: function (topic) {
        var div = $('#page_desc');
        div.empty().append('<br>' + lang['DESC_' + topic.toUpperCase()]);
    },



    setNavbarFooter: function () {
        $('#LABEL_CONTACT').html(lang.LABEL_CONTACT);
        $('#contact').html(lang.LABEL_CONTACT);
        $('#license').html(lang.LABEL_LICENSE);
        $('#disclaimer').html(lang.LABEL_DISCLAIMER);
        $('#IMG_GBALOGO').attr('src', 'img/' + lang.IMG_GBALOGO);
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
                                            <span class="appsIcon fa fa-network-wired text-info"></span>
                                            <a href="http://resource.geolba.ac.at/thesaurus/network.html#${uri.split('geolba.ac.at/')[1]}/${lang.ID}" title="Network Diagram" class="card-link">
                                                <br>Network<br>diagram
                                            </a>
                                        </div>`);
    }
};
