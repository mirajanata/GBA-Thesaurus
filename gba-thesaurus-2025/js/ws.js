// webservices
"use strict";
var ws = {
    endpoint: 'https://resource.geosphere.at/graphdb/repositories/thes',
    getProject: function (uri) {
        return uri.split('/')[4];
    },
    projectFrom: {
        'GeologicUnit': 'FROM <https://resource.geosphere.at/thes/geolunit> FROM <https://resource.geosphere.at/thes/geomorph>',
        'geolunit': 'FROM <https://resource.geosphere.at/thes/geolunit> FROM <https://resource.geosphere.at/thes/geomorph>',
        'structure': 'FROM <https://resource.geosphere.at/thes/struct>',
        'struct': 'FROM <https://resource.geosphere.at/thes/struct>',
        'GeologicTimeScale': 'FROM <https://resource.geosphere.at/thes/time>',
        'time': 'FROM <https://resource.geosphere.at/thes/time>',
        'lithology': 'FROM <https://resource.geosphere.at/thes/lith>',
        'lith': 'FROM <https://resource.geosphere.at/thes/lith>',
        'tectonicunit': 'FROM <https://resource.geosphere.at/thes/tect>',
        'tect': 'FROM <https://resource.geosphere.at/thes/tect>',
        'mineral': 'FROM <https://resource.geosphere.at/thes/mineral>',
        'minres': 'FROM <https://resource.geosphere.at/thes/minres>',
        'citation': 'FROM <https://resource.geosphere.at/thes/citation>',
        'ref': 'FROM <https://resource.geosphere.at/thes/citation>',
    },
    projectIcons: {
        'inspire': 'INSPIRE.png',
        'linkedData': 'linkedData.png',
        'https://resource.geosphere.at/thes/geolunit': 'profil.png',
        'https://resource.geosphere.at/thes/struct': 'falte.png',
        'https://resource.geosphere.at/thes/time': 'time.png',
        'https://resource.geosphere.at/thes/lith': 'granit.png',
        'https://resource.geosphere.at/thes/tect': 'tektonik.png',
        'https://resource.geosphere.at/thes/mineral': 'quarz.png',
        'https://resource.geosphere.at/thes/minres': 'gold.png'
    },

    doc: function (query, thenFunc) {
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson').then(thenFunc);
    },
    json: function (uriPart, query, filteredItem, thenFunc) {
        query = ws.processSparql(uriPart, query, filteredItem);
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson')
            .then(res => res.json())
            .then(thenFunc)
            .catch(error => $('#pageContent').append(`<br>no results for <br>URI: <span style="color: red;"><strong>${uriPart}</strong></span> <br>`));
    },
    docJson: function (query, thenFunc) {
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&Accept=application%2Fsparql-results%2Bjson')
            .then(res => res.json())
            .then(thenFunc);
    },
    projectJson: function (projectId, query, filteredItem, thenFunc) {
        query = ws.processSparql(projectId, query, filteredItem);

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
    processSparql: function (projectId, query, filteredItem) {
        let filter = ws.projectFilter ? ws.projectFilter[projectId] : null;
        if (!filter) {
            filter = "";
        }
        if (!filteredItem) {
            filteredItem = "c";
        }
        query = query.replaceAll('@@filter', filter).replaceAll('@@item', filteredItem);

        let from = ws.projectFrom ? ws.projectFrom[projectId] : null;
        if (!from) {
            from = "";
        }
        query = query.replaceAll('@@from', from);

        return query;
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
};
