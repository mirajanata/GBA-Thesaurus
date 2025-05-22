// webservices
"use strict";
var ws = {
    endpoint: 'https://resource.geosphere.at/graphdb/repositories/thes',

    doc: function (query, thenFunc) {
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson').then(thenFunc);
    },
    json: function (uri, query, thenFunc) {
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson')
            .then(res => res.json())
            .then(thenFunc)
            .catch(error => $('#pageContent').append(`<br>no results for <br>URI: <span style="color: red;"><strong>${uri}</strong></span> <br>`));
    },
    docJson: function (query, thenFunc) {
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson')
            .then(res => res.json())
            .then(thenFunc);
    },
    projectJson: function (projectId, query, filteredItem, thenFunc) {
        let projectFilter = {
            'GeologicUnit': 'FILTER(contains(STR(?@@item), "/geolunit") || contains(STR(?@@item), "/geomorph"))',
            'geolunit': 'FILTER(contains(STR(?@@item), "/geolunit") || contains(STR(?@@item), "/geomorph"))',
            'structure': 'FILTER(contains(STR(?@@item), "/struct"))',
            'struct': 'FILTER(contains(STR(?@@item), "/struct"))',
            'GeologicTimeScale': 'FILTER(contains(STR(?@@item), "/time"))',
            'time': 'FILTER(contains(STR(?@@item), "/time"))',
            'lithology': 'FILTER(contains(STR(?@@item), "/lith"))',
            'lith': 'FILTER(contains(STR(?@@item), "/lith"))',
            'tectonicunit': 'FILTER(contains(STR(?@@item), "/tect"))',
            'tect': 'FILTER(contains(STR(?@@item), "/tect"))',
            'mineral': 'FILTER(contains(STR(?@@item), "/mineral"))',
            'minres': 'FILTER(contains(STR(?@@item), "/minres"))',
        };
        var filter = projectFilter[projectId];
        if (!filter) {
            filter = "";
        }
        if (!filteredItem) {
            filteredItem = "c";
        }
        query = query.replaceAll('@@filter', filter);
        query = query.replaceAll('@@item', filteredItem);

        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson')
            .then(res => res.json())
            .then(thenFunc)
            .catch(error => {
                if (!$('#outOfService').length) {
                    $('#rightSidebar').append(`<div id="outOfService" class="alert alert-dismissible alert-primary">
                                                <button type="button" class="close" data-dismiss="alert">&times;</button>
                                                <h4 class="alert-heading">Service downtime:</h4>
                                                    <p class="mb-0">
                                                        GBA Thesaurus is currently not available!
                                                    </p>
                                                </div>`);
                }
            });
    },

    getProjUrl: function (projectId, query) {
        return this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson';
    },
    getRefUrl: function (query) {
        return this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson';
    },
    getMineralUrl: function (query) {
        return this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson';
    },
    getMinresUrl: function (query) {
        return this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson';
    },
    getStructureUrl: function (query) {
        return this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson';
    }
    /*
    endpoint: 'https://resource.geolba.ac.at/PoolParty/sparql/',
    doc: function (query, thenFunc) {
        return fetch(this.endpoint + 'doc?query=' + encodeURIComponent(query) + '').then(thenFunc);
    },
    json: function (uri, query, thenFunc) {
        return fetch(this.endpoint + uri + '?query=' + encodeURIComponent(query) + '&format=application/json')
            .then(res => res.json())
            .then(thenFunc)
            .catch(error => $('#pageContent').append(`<br>no results for <br>URI: <span style="color: red;"><strong>${uri}</strong></span> <br>`));
    },
    docJson: function (query, thenFunc) {
        return fetch(this.endpoint + 'doc?query=' + encodeURIComponent(query) + '&format=application/json')
            .then(res => res.json())
            .then(thenFunc);
    },
    projectJson: function (projectId, query, thenFunc) {
        return fetch(this.endpoint + projectId + '?query=' + encodeURIComponent(query) + '&format=application/json')
            .then(res => res.json())
            .then(thenFunc)
            .catch(error => {
                if (!$('#outOfService').length) {
                    $('#rightSidebar').append(`<div id="outOfService" class="alert alert-dismissible alert-primary">
                                                <button type="button" class="close" data-dismiss="alert">&times;</button>
                                                <h4 class="alert-heading">Service downtime:</h4>
                                                    <p class="mb-0">
                                                        GBA Thesaurus is currently not available!
                                                    </p>
                                                </div>`);
                }
            });
    */
};
