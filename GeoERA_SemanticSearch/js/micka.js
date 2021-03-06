"use strict";

var micka = {

    init: function () {
        micka.USER_LANG = (navigator.language || navigator.language).substring(0, 2);
        let suppLang = ['en', 'cs', 'da', 'el', 'de', 'es', 'et', 'fi', 'fr', 'hr', 'hu', 'is', 'it', 'lt', 'nl', 'no', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv', 'uk'];
        if (!suppLang.includes(micka.USER_LANG)) {
            micka.USER_LANG = 'en';
        }

        let urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('lang')) {
            micka.USER_LANG = urlParams.get('lang');
        }

        micka.insertSearchCard('search_widget'); //inserts search widget only                

        if (urlParams.has('search')) {
            micka.search(decodeURI(urlParams.get('search')));

        }
        micka.initSearch(); //provides js for fuse search 
        document.getElementById('lang').innerHTML = '[' + micka.USER_LANG + ']';
    },

    insertSearchCard: function (widgetID) {
        $('#searchInput').keydown(function (e) {
            switch (e.which) {
                case 13:
                    if (Object.keys(micka.__upperConcept).length !== 0) {
                        micka.semanticSearch(micka.__upperConcept.uri, micka.__upperConcept.label);
                        $('#dropdown').empty();
                        micka.__upperConcept = {};
                    } else {
                        micka.fullTextSearch($('#searchInput').val());
                    }
                    break;
                case 38: // up
                    micka.__selectSearchLink(1);
                    break;
                case 40: // down
                    micka.__selectSearchLink(0);
                    break;
            };
        });

        $('#searchBtn').click(function (e) {
            micka.fullTextSearch($('#searchInput').val());
        });

        $('#searchInput').focusout(function () {
            $('#dropdown').delay(300).hide(0, function () {
                $('#dropdown').empty();
                //$('#searchInput').val('');
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
                    micka.__upperConcept = {
                        label: autoSuggest.slice(0, 1)[0].L.value,
                        uri: autoSuggest.slice(0, 1)[0].URIs.value
                    };
                    $.each(autoSuggest.slice(0, 10), function (index, value) {
                        $('#dropdown').append(` <tr>
                                                <td class="searchLink dropdown-item" 
                                                    onclick="micka.semanticSearch('${value.URIs.value}','${value.L.value}');" data-uri="${value.URIs.value}", data-label="${value.L.value}">
                                                    ${value.L.value}
                                                </td>
                                            </tr>`);
                    });
                }
            }, 200);
        });
    },

    //**********************the initial sparql query to build the fuse (trie) object - stored in window****         
    initSearch: function () {
        ws_micka.json(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#> 
                                    SELECT (GROUP_CONCAT(?s; separator = ';') as ?URIs) ?L 
                                    WHERE { 
                                    VALUES ?p {skos:prefLabel skos:altLabel} 
                                    ?s a skos:Concept; ?p ?L . FILTER(lang(?L)="${micka.USER_LANG}")
                                    }
                                    GROUP BY ?L`, jsonData => {
            const options = {
                shouldSort: true,
                tokenize: true,
                keys: ['L.value']
            };
            window.fuse = new Fuse(jsonData.results.bindings, options);
            //console.log(window.fuse);
            document.getElementById('searchInput').disabled = false;
        });
    },

    //************************perform the search for a selected term ************************************         
    semanticSearch: function (URIs, origLabel) {
        $('#searchInput').val(origLabel);
        ws_micka.json(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                    SELECT DISTINCT (MIN(?sort) AS ?rank) ?L
                                    WHERE {
                                    VALUES ?s {<${URIs.replace(/;/g, "> <")}>}
                                    VALUES ?l {skos:prefLabel skos:altLabel}
                                    {BIND(?s AS ?o) ?o ?l ?L . FILTER(lang(?L)='en') BIND(1 AS ?sort)}
                                    UNION
                                    {?s skos:narrower* ?o . ?o ?l ?L . FILTER(lang(?L)='en') BIND(2 AS ?sort)}
                                    UNION
                                    {?s skos:related ?o . ?o ?l ?L . FILTER(lang(?L)='en') BIND(3 AS ?sort)}
                                    UNION
                                    {?s skos:broader ?o . ?o ?l ?L . FILTER(lang(?L)='en') BIND(4 AS ?sort)}
                                    }
                                    GROUP BY ?L
                                    ORDER BY ?rank
                                    LIMIT 20`, data => {
            let allTerms = data.results.bindings.map(a => a.L.value);
            let rankedTerms = [];
            for (let i = 1; i <= 4; i++) {
                rankedTerms.push($.map(data.results.bindings.filter(item => item.rank.value == i), (a => (a.L.value.replace(' (theme)', '')))));
            }
            micka.clearPage();
            micka.queryCSW(allTerms, rankedTerms);
        });
    },

    //******************************************************************************************************
    clearPage: function () {
        let content = document.getElementById('pageContent').childNodes;
        for (let a of content) {
            a.innerHTML = '';
        }
    },

    //******************************************************************************************************
    fullTextSearch: function (searchTerm) {

        let prefix = 'https://egdi.geology.cz/csw/?request=GetRecords&query=(';
        let suffix = ')&format=application/json&language=eng&MaxRecords=19&ElementSetName=full';
        let results = [];
        let rankedTerms = [[], [], [], []];
        rankedTerms[0].push(searchTerm.toLowerCase());
        micka.clearPage();

        fetch(`${prefix}Anytext like '* ${searchTerm}*'${suffix}`)
            .then(res => res.json())
            .then(data => {
                results = micka.addResults(results, data, rankedTerms);
                micka.printResults(results.sort((a, b) => b.rank - a.rank), [[`${searchTerm}`], [], [], []]);
            });
    },

    //******************************************************************************************************
    /*
    
        case insensitive	#################################################### todo
        	
    1	Suchbegriff	subject
    2	Suchbegriff	*Title*
    3	narrower/related	subject
    4	narrower/related	*Title*
    5	Suchbegriff	*Anytext*
    6	broader	subject
    7	broader	*Title*
    */
    createQuery1: function (terms, queryType) { //micka query doesn`t accept brackets? -> replace
        return terms.map(a => encodeURIComponent(queryType + '\'' + a + '\'').replace('\(', '').replace('\)', '')).join('+OR+');
    },

    createQuery2: function (terms, queryType) { //micka query doesn`t accept brackets? -> replace
        return terms.map(a => encodeURIComponent(queryType + '\'*' + a + '*\'').replace('\(', '').replace('\)', '')).join('+OR+');
    },

    //******************************************************************************************************
    queryCSW: function (allTerms, rankedTerms) {
        let fetchQueries = [];
        fetchQueries.push(micka.createQuery1(rankedTerms[0], 'subject='));
        fetchQueries.push(micka.createQuery1(rankedTerms[0], 'title like '));
        if (rankedTerms[1].concat(rankedTerms[2]).length > 0) {
            fetchQueries.push(micka.createQuery1(rankedTerms[1].concat(rankedTerms[2]), 'subject='));
            fetchQueries.push(micka.createQuery1(rankedTerms[1].concat(rankedTerms[2]), 'title like '));
        }
        fetchQueries.push(micka.createQuery2(rankedTerms[0], 'Anytext like '));
        if (rankedTerms[3].length > 0) {
            fetchQueries.push(micka.createQuery1(rankedTerms[3], 'subject='));
            fetchQueries.push(micka.createQuery1(rankedTerms[3], 'title like '));
        }

        let prefix = 'https://egdi.geology.cz/csw/?request=GetRecords&query=(';
        let suffix = ')&format=application/json&language=eng&ElementSetName=full';
        let results = [];

        (async function loop() {
            for (let i = 0; i < fetchQueries.length; i++) { //to run all 5 queries
                if (results.length > 19) { //to get a minimum of 20 results
                    break;
                }
                await fetch(prefix + fetchQueries[i] + suffix)
                    .then(res => res.json())
                    .then(data => {
                        results = micka.addResults(results, data, rankedTerms);
                    });
                //console.log(i, results);
            }
            micka.printResults(results.sort((a, b) => b.rank - a.rank), rankedTerms);
        })();
    },

    //******************************************************************************************************
    addResults: function (results, jsonData, rankedTerms) {

        for (let a of jsonData.records) {
            let k = [];
            if (a.keywords !== undefined) {
                a.keywords.forEach(x => {
                    if (x.keywords !== undefined) {
                        k = k.concat(x.keywords.filter(Boolean))
                    }
                });
            }
            let rank = 1;
            let keywords = [];
            for (let b of k) {
                if (rankedTerms[0].includes(b.toLowerCase())) {
                    keywords.push('<span class="keywords1">' + b + '</span>');
                    rank += 10;
                } else if (rankedTerms[1].includes(b.toLowerCase())) {
                    keywords.push('<span class="keywords2">' + b + '</span>');
                    rank += 3;
                } else if (rankedTerms[2].includes(b.toLowerCase())) {
                    keywords.push('<span class="keywords3">' + b + '</span>');
                    rank += 3;
                } else if (rankedTerms[3].includes(b.toLowerCase())) {
                    keywords.push('<span class="keywords4">' + b + '</span>');
                    rank += 1;
                } else {
                    keywords.push('<span class="keywords">' + b + '</span>');
                }
            }
            let c = new RegExp(rankedTerms[0][0], 'gi');
            rank += (a.title.match(c) || []).length * 3;
            rank += (a.abstract.match(c) || []).length * 2;
            rank += (keywords.join().match(c) || []).length * 1;

            results.push({
                id: a.id,
                title: a.title,
                abstract: a.abstract.substring(0, 500) + ' ..',
                keywords: keywords,
                rank: rank,
                relevance: ((rank / 12 * 100).toFixed(0) > 100) ? 100 : (rank / 12 * 100).toFixed(0)
            });
        }
        return results
    },

    //******************************************************************************************************
    printResults: function (results, rankedTerms) {

        if (results.length == 19) {
            document.getElementById('1').innerHTML += 'more than ';
        }
        document.getElementById('1').innerHTML += `<strong>
                                                    ${results.length}
                                                </strong> results for: <span class="keywords1">
                                                    ${rankedTerms[0].join('</span> <span class="keywords1">')}
                                                </span><br>`;
        if (rankedTerms[1].length > 0) {
            document.getElementById('1').innerHTML += `- narrower terms: <span class="keywords2">
                                                        ${rankedTerms[1].join('</span> <span class="keywords2">')}
                                                    </span> <br>`;
        }
        if (rankedTerms[2].length > 0) {
            document.getElementById('1').innerHTML += `- related terms: <span class="keywords3">
                                                        ${rankedTerms[2].join('</span> <span class="keywords3">')}
                                                    </span> <br>`;
        }
        if (rankedTerms[3].length > 0) {
            document.getElementById('1').innerHTML += `- and broader terms: <span class="keywords4">
                                                        ${rankedTerms[3].join('</span> <span class="keywords4">')}
                                                    </span>
                                                    <br>`;
        }
        document.getElementById('1').innerHTML += `in keywords, title and abstracts texts<hr>`;

        let mickaViewer = 'https://egdi.geology.cz/records/';
        for (let record of results) {
            document.getElementById('1').innerHTML += `
                        <div>
                            <a href="${mickaViewer + record.id}">
                                <strong>
                                    ${record.title}
                                </strong>
                            </a>
                            <span style="float:right">
                                relevance: ${record.rank} pts or <strong>${record.relevance}%
                            </span>
                        </div>
                        <br>
                        <p style="line-height: 80%;">
                            <small>
                                ${record.abstract}
                            </small>
                        </p>
                        <p  style="line-height: 80%;">
                            ${record.keywords.join(' ')}
                        </p>
                        <hr>`;
        }
    },

    __upperConcept: {},
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
            micka.__upperConcept = {
                label: o.attr("data-label"),
                uri: o.attr("data-uri")
            };
        }
    }
};

/* MICKA query examples

https://egdi.geology.cz/csw/?request=GetRecords
&query=(subject='Geology'+OR+Subject='Hydrogeology')
&format=application/json
&MaxRecords=50
&StartPosition=
&language=eng
&ElementSetName=full

https://egdi.geology.cz/csw/?request=GetRecords
&query=(subject='Geology'+AND+Subject='Hydrogeology')
&format=application/json
&MaxRecords=50
&StartPosition=
&language=eng
&ElementSetName=full

https://egdi.geology.cz/csw/?request=GetRecords
&query=(title like '*Hydrogeology*' OR abstract like '*Hydrogeology*')
&format=application/json
&MaxRecords=9999
&StartPosition=
&language=eng
&elementsetname=full

Also fulltext search in any metadata element is provided by AnyText element:

https://egdi.geology.cz/csw/?request=GetRecords
&query=Anytext like '*radon*'
&format=application/json
&MaxRecords=9999
&StartPosition=
&language=eng
&elementsetname=full
*/

//***********************************************************************************************************      
//********************************END************************************************************************
