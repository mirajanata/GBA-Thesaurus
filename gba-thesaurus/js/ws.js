// webservices
"use strict";
var ws = {
    endpoint: 'http://resource.geolba.ac.at/PoolParty/sparql/',

    doc: function (query, thenFunc) {
        fetch(this.endpoint + 'doc?query=' + encodeURIComponent(query) + '').then(thenFunc);
    },

    docJson: function (query, thenFunc) {
        fetch(this.endpoint + 'doc?query=' + encodeURIComponent(query) + '&format=application/json')
            .then(res => res.json())
            .then(thenFunc);
    },

    projectJson: function (projectId, query, thenFunc) {
        fetch(this.endpoint + projectId + '?query=' + encodeURIComponent(query) + '&format=application/json')
            .then(res => res.json())
            .then(thenFunc);
    }

};