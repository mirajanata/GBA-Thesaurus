// page building&handling
"use strict";
var page = {
    BASE: location.protocol + '//' + location.host + location.pathname,
    urlParams: new URLSearchParams(window.location.search),
    isEmbedded: false,
    hideOnEmbed: ["#search_widget", "#navbarToggler", "#navbarResponsive", "#proj_desc", "#other_desc", "#pageFooter", "#navBar"],
    uriParameter: null,

    // called on page loaded
    init: function () {
        let USER_LANG = (navigator.language || navigator.language).substring(0, 2);
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
        let urlParams = this.urlParams;
        let startup = () => {
            let projects = config.projects;
            search.initProjects(projects);

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
                    this.uriParameter = uri;
                    label = decodeURI(urlParams.get('list').replace(/["';><]/gi, '')); //avoid injection
                }
                search.insertSparql(uri, label);
                this.insertProjCards(); //quick access cards, plus extended project comments from sparql
            } else if (urlParams.has('uri')) {
                let uri = config.checkUri(decodeURI(urlParams.get('uri').replace(/["';><]/gi, ''))); //avoid injection
                this.uriParameter = uri;
                $('#pageContent').empty();
                let projectId = ws.getProject(uri);
                let item = config.projectConfiguration[projectId];
                this.initApps(uri, item);
                detail.details(uri);
                this.insertSideCard_projectInfo(item);
            } else {
                this.insertPageDesc(); //general intro
                this.insertComments('proj_desc', projects); //project desc from js ,insert before ProjCards!
                //this.insertComments('other_desc', [lang.DESC_INSPIRE, lang.DESC_LINKEDDATA]);
                this.insertProjCards(); //quick access cards, plus extended project comments from sparql
                //this.insertVideo(); //screen cast youtube
            }
            document.documentElement.setAttribute('lang', USER_LANG);

            this.updateSharingUrl($('#fbShare'));
            this.updateSharingUrl($('#twShare'));
            this.updateSharingUrl($('#liShare'));

            this.isEmbedded = urlParams.has('embedded');
            if (this.isEmbedded || ((screen.width < 1000) && (window.location.search == null || window.location.search == "" || urlParams.has('search')))) {
                var r = $("#rightSidebar");
                r.detach();
                if (!this.isEmbedded)
                    r.prependTo("#contentRow1");
                r.removeClass("col-lg-4");
                r.addClass("col-lg-8");
                $("#appsCard").css('visibility', 'collapse');
                $("#proj_links").css('display', 'none');
                if (!this.isEmbedded)
                    $("#search_widget").css('visibility', 'inherit');
                else {
                    page.hideOnEmbed.forEach(function (s) {
                        $(s).css('visibility', 'collapse');
                    });
                    $("a:not([target])").attr("target", "_blank");
                }
            }
        };
        if (urlParams.has('uri') || urlParams.has('search')) {
            config.init(true, USER_LANG).then(startup);
        }
        else {
            config.init(true, USER_LANG).then(startup);
        }
    },
    updateSharingUrl: function (e) {
        var v = encodeURIComponent(this.uriParameter != null ? this.uriParameter : window.location.href);
        var s = e.attr("href").replace("wwwgeolbanet", v).replace("wwwgeolbanet", v);
        e.attr("href", s);
    },
    updateSharingTexts: function (title) {
        this.updateSharingText($('#fbShare'), title);
        this.updateSharingText($('#twShare'), title);
        this.updateSharingText($('#liShare'), title);
    },
    updateSharingText: function (e, title) {
        var v = encodeURIComponent(title);
        var s = e.attr("href").replace("GBA%20Thesaurus", v).replace("GBA%20Thesaurus", v);
        e.attr("href", s);
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
        //console.log(location.href);
    },


    openParaLink: function (queryString) { //zB 'info=disclaimer'
        window.open(this.BASE + '?' + queryString + '&lang=' + lang.ID, '_self', '', 'false');
    },
    toggleRead: function (divBtn, divTxt, text) {
        let txt = $('#' + divTxt).is(':visible') ? '<span class="fa fa-caret-down"></span> <em>' + text + ' ..</em>' : '<span class="fa fa-caret-up"></span> <em>' + text + ' ..</em>';
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
        if (project) {
            $('#proj_links').append(`<div class="card border-info mb-3">
                                <h4 class="card-header">${project.name} (${lang.TOPIC})</h4>
                                <div id="${project.id}Card" class="card-body">${project.desc}</div>
                            </div>`);
        }
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
                            SELECT ?g ?cL (COALESCE(?cD, "") AS ?desc) (COUNT(?n) AS ?count) (GROUP_CONCAT(DISTINCT ?L; separator = "|") as ?topConcepts)
                            @@from
                            WHERE { 
                            graph ?g {
                                ?c a skos:ConceptScheme; dcterms:title ?cL
                            . FILTER(lang(?cL)="${lang.ID}") . 
                            ?c skos:hasTopConcept ?tc . ?tc skos:prefLabel ?tcL . FILTER(lang(?tcL)="${lang.ID}") . 
                            ?tc skos:narrower* ?n 
                            BIND(CONCAT(STR(?tc),"$",STR(?tcL)) AS ?L) 
                            OPTIONAL {?c dcterms:description ?cD . FILTER(lang(?cD)="${lang.ID}")} 
                            @@filter
                            }
                            } 
                            GROUP BY ?g ?cL ?cD ORDER BY ?cL`;

        let from = "";
        for (let project of config.projects) {
            if (project.from)
                from += " " + project.from.replace("FROM", "FROM NAMED");
        }
        query = query.replace('@@from', "");
        ws.projectJson(null, query, "c", jsonData => {
            for (let project of config.projects) {
                let projectId = project.id;
                let projectName = project.name;
                let projectDesc = project.desc;
                let projectUri = project.uri;
                div.append('<div class="card my-4"><h4 class="card-header">' + projectName +
                    '</h4><div id="' + projectId + 'Card" class="card-body"></div></div>');

                const cardDiv = $('#' + projectId + 'Card');
                const commentDiv = $('#' + projectId + 'Comment');

                commentDiv.append(`
                            <br>
                            <div style="cursor: pointer;" id="${projectId}rmBtn"
                            onclick="javascript: page.toggleRead(\'${projectId}rmBtn\', \'${projectId}ReadMore\', \'read more\');"
                            class="text-muted">
                                <span class="fa fa-caret-down"></span> <em>read more ..</em>
                            </div>
                            <div style="display:none;" id="${projectId}ReadMore">
                                <br>
                            </div>`);

                const readMoreDiv = $('#' + projectId + 'ReadMore');

                let items = jsonData.results.bindings.filter((s) => {
                    let f = s.g.value == projectUri;
                    return f;
                });
                for (let a of items) {
                    //console.log(a.topConcepts.value);
                    cardDiv.append('<strong style="color:#006666;">' + a.cL.value + '</strong>' + ': <a href="' + page.BASE + '?uri=' +
                        a.topConcepts.value.split('$').join('&lang=' + lang.ID + '">').split('|').join('</a>, <a href="' + page.BASE + '?uri=') + '</a><br>');
                    //add concept schemes + topConcepts to project descriptions
                    readMoreDiv.append('<h4>' + a.cL.value + ' (' + a.count.value +
                        '):</h4><a href="' + page.BASE + '?uri=' + a.topConcepts.value.split('$').join('&lang=' + lang.ID + '">').split('|').join('</a>, <a href="' +
                            page.BASE + '?uri=') + '</a><br>' + a.desc.value + '<br><br>');
                }

                readMoreDiv.append(`
                        <p class="">
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="location.href='rdf/${projectId}.rdf'">
                                RDF/XML download
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="location.href='${ws.endpoint}${projectId}'">
                                SparQL endpoint
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm" onclick="location.href='bibl_res.html?proj=${projectId}';">
                                ${lang.LABEL_BIBLREF}
                            </button>
                        </p>
                        <hr>`);
            }
        }); //ws.projectJson
    },

    insertComments: function (divID, projects) {
        var div = $('#' + divID);
        div.empty();
        for (let desc of projects) {
            if (!desc.image) desc.image = 'profil.png';
            div.append(`
                                                <div class="media mb-4">
                                                    <img alt="${desc.name}" class="d-flex mr-3 rounded-circle" src="img/${desc.image}">
                                                    <div id="${desc.id}Comment" class="media-body">
                                                        <h4 class="mt-0">${desc.name}</h4>
                                                        ${desc.desc}
                                                    </div>
                                                </div>`);
        }
    },

    insertPageDesc: function () {
        $('#page_desc').append('<br><span style="font-size: 34px;">Thesaurus</span>')
            .append('<h3>' + lang.TITLE_THES_2 + '</h3><br>')
            .append('<p>' + lang.DESC_THESAURUS + '</p>');
    },

    initApps: function (uri, project) {
        $('#appsCard').toggle();
        $('#appsCard .card-header').html('<h4>' + lang.APPS + '</h4>');
        $('#appsBody1').append(page.getAppLink(uri, "network.html", "<br>Network<br>diagram", "Visual Network"));
        $('#appsBody1').append(page.getDiagramLink(uri, project));
    },
    getAppLink: function (uri, page, label, title) {
        return `<div class="apps">
                                            <span >
                                                <svg version="1.1" id="cluster" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="28px" height="28px" viewBox="0 0 88 88">
                                                    <path fill="#052E37" d="M25.243,68.226c-7.779-0.162-10.824,1.418-12.514,6.269
                                                    c-1.298,3.725-0.073,7.843,3.052,10.26c3.124,2.417,8.021,2.507,11.218,0.207c3.956-2.846,4.598-6.665,2.281-13.977
                                                    c2.695-3.676,5.439-7.419,7.67-10.462c4.344-0.346,7.912-0.63,10.76-0.856c2.77,2.229,5.328,4.29,7.639,6.15
                                                    c-3.086,9.265-1.674,15.109,4.174,18.846c5.004,3.198,11.908,2.506,16.154-1.619c4.309-4.186,5.209-10.888,2.154-16.039
                                                    c-3.627-6.117-9.424-7.57-18.604-4.8c-2.486-2.344-4.881-4.601-6.598-6.221c0-4.854,0-8.901,0-13.041
                                                    c3.43-3.57,7.107-7.399,10.752-11.193c9.363,4.032,16.313,2.72,21.049-3.901c4.033-5.643,3.449-13.757-1.357-18.86
                                                    C78.143,3.751,69.836,2.801,63.859,6.79c-6.689,4.463-8.117,11.536-4.303,21.188c-3.783,3.745-7.553,7.479-11.523,11.411
                                                    c-1.955-0.574-4.135-1.213-6.449-1.892c-1.358-5.275-2.673-10.38-3.913-15.195c4.617-5.517,5.502-9.582,3.164-13.413
                                                    c-2.165-3.548-6.295-5.263-10.355-4.3c-3.828,0.907-6.542,4.212-6.772,8.244c-0.319,5.573,1.616,7.891,9.164,10.797
                                                    c1.332,4.98,2.699,10.095,4.098,15.327c-1.748,1.625-3.408,3.168-5.104,4.745c-4.015-1.192-7.824-2.323-11.454-3.4
                                                    c-2.861-7.399-5.794-10.033-10.653-9.752c-4.045,0.234-7.7,3.273-8.632,7.178c-0.886,3.712,0.814,7.84,4.115,9.989
                                                    c4.029,2.622,7.786,1.88,13.602-2.779c3.861,1.141,7.828,2.312,11.364,3.354c1.129,3.27,2.087,6.046,3.097,8.969
                                                    C30.682,60.825,28.026,64.438,25.243,68.226z"/>
                                                </svg>
                                            </span>
                                            <a href="${page}?uri=${uri}&lang=${lang.ID}" title="${title}" class="card-link" target="_blank">
                                                ${label}
                                            </a>
                                        </div>`;
    },
    getDiagramLink: function (uri, project) {
        let icon;

        switch (project.diagram) {
            case 'tree':
                icon = `<svg width="28px" height="28px" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true">
                <path fill="#cfd8dc" d="M4.3 7.3v3.3h4.8v1.5h2.7v-.6H9.7V9.1h2.1v-.6H9.1V10H4.9V4h4.2v1.5h2.7v-.6H9.7V2.5h2.1v-.6H9.1v1.5H4.3v3.3H2.2v.6z" id="element_0637e0a3"></path><path fill="#000000" d="M1 5.8h2.4v2.4H1z" id="element_10de2f02"></path><path fill="#000000" d="M10.6 4H13v2.4h-2.4zm0-3H13v2.4h-2.4zM5.8 2.5h2.4v2.4H5.8zm0 6.6h2.4v2.4H5.8zm4.8 1.5H13V13h-2.4zm0-3H13V10h-2.4z" id="element_0b3d7880">
                </path></svg>`;
                break;
            case 'sunburst':
                icon = `<svg fill="#000000" viewBox="0 0 32 32" width="28px" height="28px" xml:space="preserve">
<path id="chart--sunburst_1_" d="M16,31.36c-4.103,0-7.96-1.598-10.861-4.499c-0.141-0.141-0.141-0.369,0-0.51l3.289-3.288
	c-1.652-1.771-2.693-4.118-2.782-6.704H1c-0.199,0-0.36-0.161-0.36-0.36c0-4.103,1.597-7.959,4.498-10.86
	c0.027-0.027,0.059-0.05,0.093-0.067c0.185-0.093,0.227-0.107,3.704,3.357c1.77-1.653,4.119-2.694,6.705-2.783V1
	c0-0.199,0.161-0.36,0.36-0.36c8.47,0,15.36,6.89,15.36,15.36c0,0.199-0.161,0.36-0.36,0.36h-4.646
	c-0.187,5.427-4.566,9.807-9.994,9.994V31C16.36,31.199,16.199,31.36,16,31.36z M5.906,26.604c2.646,2.523,6.078,3.944,9.734,4.032
	v-4.282c-2.585-0.089-4.934-1.129-6.704-2.781L5.906,26.604z M16.36,21.348v4.286c5.031-0.186,9.088-4.243,9.274-9.274h-4.286
	C21.17,19.029,19.029,21.17,16.36,21.348z M9.446,23.063c1.64,1.522,3.807,2.482,6.194,2.57v-4.286
	c-1.208-0.08-2.307-0.562-3.166-1.313L9.446,23.063z M6.367,16.36c0.088,2.387,1.048,4.555,2.57,6.194l3.029-3.028
	c-0.751-0.858-1.233-1.958-1.314-3.166H6.367z M16,11.36c-2.559,0-4.64,2.082-4.64,4.64s2.082,4.64,4.64,4.64s4.64-2.081,4.64-4.64
	S18.559,11.36,16,11.36z M26.354,15.64h4.282C30.447,7.853,24.147,1.553,16.36,1.364v4.282C21.787,5.833,26.167,10.213,26.354,15.64
	z M21.348,15.64h4.286c-0.186-5.03-4.243-9.088-9.274-9.273v4.285C19.029,10.83,21.17,12.971,21.348,15.64z M6.367,15.64h4.285
	c0.081-1.208,0.563-2.307,1.314-3.166c-0.492-0.492-1.736-1.735-3.029-3.029C7.415,11.085,6.455,13.253,6.367,15.64z M1.364,15.64
	h4.282c0.089-2.585,1.13-4.934,2.782-6.703C7.15,7.66,5.915,6.424,5.396,5.906C2.873,8.553,1.452,11.984,1.364,15.64z M9.445,8.938
	c0.828,0.826,1.825,1.823,3.03,3.028c0.858-0.751,1.958-1.233,3.166-1.314V6.367C13.252,6.455,11.084,7.415,9.445,8.938z"></path>
<rect id="_Transparent_Rectangle" style="fill:none;" width="32" height="32"></rect>
</svg>`;
                break;
            default: // circles etc
                icon = `<svg fill="#000000" viewBox="0 0 32 32" width="28px" height="28px" xml:space="preserve">
<path id="chart--bubble_1_" d="M4,31.36c-1.301,0-2.36-1.059-2.36-2.36S2.699,26.64,4,26.64S6.36,27.698,6.36,29
	S5.301,31.36,4,31.36z M4,27.36c-0.904,0-1.64,0.735-1.64,1.64S3.096,30.64,4,30.64S5.64,29.904,5.64,29S4.904,27.36,4,27.36z
	 M20,30.36c-1.853,0-3.36-1.508-3.36-3.36s1.507-3.36,3.36-3.36s3.36,1.508,3.36,3.36S21.853,30.36,20,30.36z M20,24.36
	c-1.456,0-2.64,1.184-2.64,2.64s1.184,2.64,2.64,2.64s2.64-1.184,2.64-2.64S21.456,24.36,20,24.36z M10,26.36
	c-4.058,0-7.36-3.302-7.36-7.36s3.302-7.36,7.36-7.36s7.36,3.302,7.36,7.36C17.36,23.059,14.058,26.36,10,26.36z M10,12.36
	c-3.661,0-6.64,2.979-6.64,6.64s2.979,6.64,6.64,6.64s6.64-2.979,6.64-6.64S13.661,12.36,10,12.36z M25,22.36
	c-2.955,0-5.36-2.405-5.36-5.36c0-2.956,2.405-5.36,5.36-5.36s5.36,2.404,5.36,5.36C30.36,19.955,27.955,22.36,25,22.36z M25,12.36
	c-2.559,0-4.64,2.082-4.64,4.64s2.081,4.64,4.64,4.64s4.64-2.081,4.64-4.64S27.559,12.36,25,12.36z M18,11.36
	c-2.956,0-5.36-2.404-5.36-5.36S15.044,0.64,18,0.64c2.955,0,5.36,2.404,5.36,5.36S20.955,11.36,18,11.36z M18,1.36
	c-2.559,0-4.64,2.082-4.64,4.64s2.082,4.64,4.64,4.64S22.64,8.559,22.64,6S20.559,1.36,18,1.36z M7,10.36
	c-1.853,0-3.36-1.507-3.36-3.36S5.147,3.64,7,3.64S10.36,5.147,10.36,7S8.853,10.36,7,10.36z M7,4.36C5.544,4.36,4.36,5.544,4.36,7
	S5.544,9.64,7,9.64S9.64,8.456,9.64,7S8.456,4.36,7,4.36z"></path>
<rect id="_Transparent_Rectangle" style="fill:none;" width="32" height="32"></rect>
</svg>`;
        }

        return `
<div class="apps">
<a href="diagram.html?uri=${uri}&lang=${lang.ID}" title="Relations Diagram" class="card-link" target="_blank">
<span >
    ${icon}
</span>
    <br>Diagram</br>
</a>
</div>`;
    }
};
