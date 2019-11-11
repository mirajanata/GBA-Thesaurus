// webservices
"use strict";
var ws = {
    endpoint: 'http://resource.geolba.ac.at/PoolParty/sparql/structure',

    json: function (query, thenFunc) {
        return fetch(this.endpoint + '?query=' + encodeURIComponent(query) + '&format=application/json')
            .then(res => res.json())
            .then(thenFunc);
    }
};