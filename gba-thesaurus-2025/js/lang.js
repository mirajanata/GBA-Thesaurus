// language context
"use strict";
var lang = {
    load: function (id) {
        this.ID = id || "de";
        var f = this[id] || this.DE;
        f.call(this);
    },
    // loading functions, one for each language
    de: function () {
        this.LABEL_LICENSE = 'Nutzungsbedingungen';
        this.LABEL_DISCLAIMER = 'Haftungsausschluss';
        this.LABEL_SERVICES = 'Services';
        this.LABEL_CONTACT = 'Kontakt';
        this.LABEL_SEARCH = 'Suche';
        this.TIP_SEARCH = 'Suchen...';
        this.TITLE_SEARCHRESULTS = 'Suchergebnisse';
        this.HITS_SEARCHRESULTS = '0 Treffer zu ';
        this.LABEL_BIBLREF = 'Quellverzeichnis';
        this.IMG_GBALOGO = 'GSA_Logozusammenstellung_Logo_RGB.svg';
        this.APPS = 'Anwendungen';
        this.TOPIC = 'Thema';
        this.DB_QUERY = 'Datenbankabfrage (SPARQL)';
        this.EXAMPLE_QUERY = 'Beispiele f&uuml;r Abfragen';
        this.SEM_REL = 'Verwandte Begriffe, Relationen';
        this.descriptions_H = 'Beschreibungen';
        this.scientificReferences_H = 'Quellverweise';
        this.semanticRelations_H = 'Semantische Relationen';
        this.dataLinks_H = 'Downloads';
        this.visualization_H = 'Grafische Darstellung';
        this.location_H = 'Ortsbezug';
        this.creator_H = 'Bearbeitung';
        this.TITLE_THES_2 = 'ein kontrolliertes Vokabular geowissenschaftlicher Begriffe';
        this.DESC_THESAURUS = '..zweisprachig (Deutsch, Englisch), wie sie in den Textpublikationen und Karten der GeoSphere Austria verwendet werden<br>..entworfen als Wissensrepr&auml;sentation der GeoSphere Austria, im Gegensatz zu nationalen und internationalen Standards, Klassifikationen oder Lexika<br>..formatiert als <a href="http://www.w3.org/2004/02/skos/" title="SKOS Simple Knowledge Organization System" target="_blank">SKOS</a> Konzepte (Begriffe, einschlie&szlig;lich Synonyme), mit eigenen Web-Adressen &#8594; <a href="http://de.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URI\'s</a><br>..definiert durch polyhierarchische Beziehungen als &uuml;ber-, untergeordnete, und verwandte Konzepte innerhalb eines Themenbereichs, mit Beschreibungen und Quellenangabe &#8594; <a href="bibl_res.html" target="_blank">Literaturverzeichnis</a>';

        //************Description Objects**************
        this.DESC_INSPIRE = {
            id: 'inspire',
            image: 'INSPIRE.png',
            name: 'INSPIRE',
            desc: 'Mit der Erstellung von semantischen und technisch interoperablen Geodaten setzt die GeoSphere Austria die gesetzlichen Verpflichtungen der EU-Direktive 2007/2/EC <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a> bzw. des Geodateninfrastrukturgesetzes 2010 <a href="http://www.parlament.gv.at/PAKT/VHG/XXIV/ME/ME_00055/index.shtml" title="Geodateninfrastrukturgesetz GeoDIG" target="_blank">GeoDIG</a> um. Die Daten der GeoSphere Austria werden hierbei mit Thesaurus-Konzepten attributiert, w&auml;hrend der Thesaurus gleichzeitig mit INSPIRE-Codes und weiteren international standardisierten Vokabularen verlinkt wird. Datens&auml;tze, die bereits nach INSPIRE harmonisiert wurden, k&ouml;nnen mit dem DataViewer (ein Erweiterungsmodul des GeoSphere Austria Thesaurus, dzt. im Testbetrieb) durchsucht werden.'
        };
        this.DESC_LINKEDDATA = {
            id: 'linkedData',
            image: 'linkedData.png',
            name: 'Linked Data',
            desc: 'Alle Begriffe sind als SKOS Konzepte formatiert (Begriffe, einschlie&szlig;lich Synonyme), mit eigenen Web-Adressen &#8594; <a href="http://de.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URI\'s</a>, sowie durch polyhierarchische Beziehungen als &uuml;ber-, untergeordnete, und verwandte Konzepte innerhalb eines Themenbereichs definiert , mit Beschreibungen und Quellenangabe &#8594; Literaturverzeichnis<br>Als <a href="http://de.wikipedia.org/wiki/Linked_Open_Data" title="Linked Data" target="_blank">Linked Data</a> Resource ist sie semantisch mit anderen Resourcen im Web verlinkt &#8594; <a href="http://dbpedia.org/" title="DBpedia Knowledge Base" target="_blank">DBpedia</a>, <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>, <a href="http://resource.geosciml.org/" title="Resources for Geosciences XML" target="_blank">GeoSciML</a> maschinenlesbar &uuml;ber Webservices (Endpoints) gem&auml;&szlig; den <a href="http://www.w3.org/2013/data/" title="The World Wide Web Consortium" target="_blank">W3C</a> Standards ver&ouml;ffentlicht &#8594 <a href="http://www.w3.org/RDF/" title="Resource Description Framework (RDF)" target="_blank">RDF</a>, <a href="http://www.w3.org/TR/rdf-sparql-query/" title="SPARQL Query Language for RDF" target="_blank">SparQL</a><br>zur Verwendung in Linked Data Webapplikationen, als Hyperlinks, oder als Kodierung f&uuml;r Geodaten &#8594; Datenharmonisierung, DataViewer'
        };
        this.DESC_DISCLAIMER = '<h1>Haftungsausschluss:</h1>Die GeoSphere Austria (GBA) &uuml;bernimmt keine Verantwortung f&uuml;r die Richtigkeit der Inhalte bzw. keine Haftung irgendeiner Art f&uuml;r die zur Verf&uuml;gung gestellten Informationen oder Services und etwaiger Folgesch&auml;den die aus deren Verwendung resultieren. Obwohl versucht wird die Daten sorgf&auml;ltig zu &uuml;berpr&uuml;fen sind die Inhalte dieser Seite nicht notwendigerweise vollst&auml;ndig, aktuell oder fehlerfrei. Die zur Verf&uuml;gung gestellten Daten und Dienste stellen eine (wissenschaftliche) Kompilation dar die nicht notwendigerweise die offizielle Meinung der GeoSphere Austria widerspiegelt. Es wird versucht die Information fehlerfrei und so aktuell wie m&ouml;glich zu halten, dar&uuml;ber hinaus wird versucht berichtete Fehler wenn m&ouml;glich zu korrigieren. Diese Webseite beinhaltet Links zu externen Seiten &uuml;ber die die GeoSphere Austria keine Kontrolle hat und daher keine Verantwortung &uuml;bernimmt. Weder die GeoSphere Austria noch Personen die in ihrem Auftrag handeln, k&ouml;nnen f&uuml;r die Inhalte auf dieser Webseite noch auf deren Verwendung in irgendeiner Weise haftbar gemacht werden. Die GeoSphere Austria beh&auml;lt sich das Recht vor die Inhalte dieser Seite bzw. die Nutzungsbedingungen ohne vorherige Ank&uuml;ndigung zu &auml;ndern. Der Nutzer nimmt diesen Haftungsausschluss ausdr&uuml;cklich zur Kenntnis.<br><br>Die Website nutzt die Standards HTML5/ES16/JQuery und wurde f&uuml;r die Ansicht in Firefox, Chrome, Safari oder Edge optimiert. MS InternetExplorer11 oder &auml;lter wird deshalb nicht mehr unterst&uuml;tzt.';
    },
    en: function () {
        this.LABEL_LICENSE = 'Terms of use';
        this.LABEL_DISCLAIMER = 'Disclaimer';
        this.LABEL_SERVICES = 'Services';
        this.LABEL_CONTACT = 'Contact';
        this.LABEL_SEARCH = 'Search';
        this.TIP_SEARCH = 'Search for...';
        this.TITLE_SEARCHRESULTS = 'Search results';
        this.HITS_SEARCHRESULTS = '0 results for ';
        this.LABEL_BIBLREF = 'bibliographic references';
        this.IMG_GBALOGO = 'GSA_Logozusammenstellung_Logo_RGB.svg';
        this.APPS = 'Applications';
        this.TOPIC = 'subject';
        this.DB_QUERY = 'Database query (SPARQL)';
        this.EXAMPLE_QUERY = 'Example queries';
        this.SEM_REL = 'Concept relations';
        this.descriptions_H = 'Descriptions';
        this.scientificReferences_H = 'Scientific references';
        this.semanticRelations_H = 'Semantic relations';
        this.dataLinks_H = 'Downloads';
        this.visualization_H = 'Visualization';
        this.location_H = 'Location';
        this.creator_H = 'Editing';
        this.TITLE_THES_2 = 'a controlled vocabulary for geosciences';
        this.DESC_THESAURUS = '..bilingual in german and english as used in geoscientific text publications and geological maps of the GeoSphere Austria<br>..designed as a knowledge representation of the geological survey, in contrast to national and international standards, classifications or dictionaries<br>..formatted as <a href="http://www.w3.org/2004/02/skos/" title="SKOS Simple Knowledge Organization System" target="_blank">SKOS</a> concepts (terms, including synonyms), each with their own web addresses &#8594; <a href="http://en.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URIs</a><br>..specified by polyhierarchical relationships as broader, narrower, and related concepts within the domain including descriptions and &#8594; <a href="bibl_res.html" target="_blank">bibliographic references</a>';

        //************Description Objects**************
        this.DESC_INSPIRE = {
            id: 'inspire',
            image: 'INSPIRE.png',
            name: 'INSPIRE',
            desc: 'With the creation of semantic and technically interoperable geodata sets the Geological Survey implements the legal requirements of the EU directive 2007/2/EC (<a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>) or rather the Austrian Geodateninfrastrukturgesetz 2010 (<a href="http://www.parlament.gv.at/PAKT/VHG/XXIV/ME/ME_00055/index.shtml" title="Geodateninfrastrukturgesetz GeoDIG" target="_blank">GeoDIG</a>). Therefore the datasets of the Geological Survey are coded with thesaurus terms, while the thesaurus is linked to INSPIRE terminology (and other internationally standardized vocabularies) at the same time. The DataViewer (beta) extension provides a way for testing selected concepts applied to the harmonization of map data.'
        };
        this.DESC_LINKEDDATA = {
            id: 'linkedData',
            image: 'linkedData.png',
            name: 'Linked Data',
            desc: 'formatted as SKOS concepts (terms, including synonyms), each with their own web addresses &#8594; <a href="http://en.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URIs</a> - specified by polyhierarchical relationships as broader, narrower, and related concepts within the domain including descriptions and bibliographic references - as <a href="http://en.wikipedia.org/wiki/Linked_Open_Data" title="Linked Data" target="_blank">Linked Data</a> resource semantically linked to other web resources &#8594; <a href="http://dbpedia.org/" title="DBpedia Knowledge Base" target="_blank">DBpedia</a>, <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>, <a href="http://resource.geosciml.org/" title="Resources for Geosciences XML" target="_blank">GeoSciML</a> - machine-readable published using web services (endpoints) according to the standards of <a href="http://www.w3.org/2013/data/" title="The World Wide Web Consortium" target="_blank">W3C</a> &#8594; <a href="http://www.w3.org/RDF/" title="Resource Description Framework (RDF)" target="_blank">RDF</a>, <a href="http://www.w3.org/TR/rdf-sparql-query/" title="SPARQL Query Language for RDF" target="_blank">SparQL</a> - to be used in Linked Data web applications such as hyperlinks for online texts or as encoding for geospatial data harmonizing data, DataViewer'
        };

        this.DESC_DISCLAIMER = '<h1>Disclaimer:</h1>The GeoSphere Austria takes no responsibility for the correctness of the contents and no liability (of any sorts) for the information and services provided and possible consequential damage resulting from the use of these. Although we try to scrutinise our data the information on this site is not necessarily complete, up to date or accurate. The provided data and services represent a scientific compilation that may not reflect the official opinion of the GeoSphere Austria. We try to keep our data as accurate and up to date as possible and in addition we attempt to correct errors if they are reported to us. This website contains links to other external sites over which the GeoSphere Austria has no control and therefore can take no responsibility. Neither the GeoSphere Austria nor persons acting in their behalf can be held liable for the contents of this website or their use. The GeoSphere Austria reserves its right to change the contents of this website and its terms of use without prior announcement. The user of this site takes note and approves this disclaimer.<br><br>The application uses standards like HTML5/ES16/JQuery and is best viewed with Firefox, Chrome, Safari or Edge. MS InternetExplorer11 and older versions are not supported.';
    },
    // current langId
    ID: null,

    projects: {
        en: {
            desc_inspire: {
                desc: 'With the creation of semantic and technically interoperable geodata sets the Geological Survey implements the legal requirements of the EU directive 2007/2/EC (<a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>) or rather the Austrian Geodateninfrastrukturgesetz 2010 (<a href="http://www.parlament.gv.at/PAKT/VHG/XXIV/ME/ME_00055/index.shtml" title="Geodateninfrastrukturgesetz GeoDIG" target="_blank">GeoDIG</a>). Therefore the datasets of the Geological Survey are coded with thesaurus terms, while the thesaurus is linked to INSPIRE terminology (and other internationally standardized vocabularies) at the same time. The DataViewer (beta) extension provides a way for testing selected concepts applied to the harmonization of map data.'
            },
            desc_linkeddata: {
                desc: 'formatted as SKOS concepts (terms, including synonyms), each with their own web addresses &#8594; <a href="http://en.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URIs</a> - specified by polyhierarchical relationships as broader, narrower, and related concepts within the domain including descriptions and bibliographic references - as <a href="http://en.wikipedia.org/wiki/Linked_Open_Data" title="Linked Data" target="_blank">Linked Data</a> resource semantically linked to other web resources &#8594; <a href="http://dbpedia.org/" title="DBpedia Knowledge Base" target="_blank">DBpedia</a>, <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>, <a href="http://resource.geosciml.org/" title="Resources for Geosciences XML" target="_blank">GeoSciML</a> - machine-readable published using web services (endpoints) according to the standards of <a href="http://www.w3.org/2013/data/" title="The World Wide Web Consortium" target="_blank">W3C</a> &#8594; <a href="http://www.w3.org/RDF/" title="Resource Description Framework (RDF)" target="_blank">RDF</a>, <a href="http://www.w3.org/TR/rdf-sparql-query/" title="SPARQL Query Language for RDF" target="_blank">SparQL</a> - to be used in Linked Data web applications such as hyperlinks for online texts or as encoding for geospatial data harmonizing data, DataViewer'
            }
        },
        de: {
            desc_inspire: {
                desc: 'Mit der Erstellung von semantischen und technisch interoperablen Geodaten setzt die Geologische Bundesanstalt die gesetzlichen Verpflichtungen der EU-Direktive 2007/2/EC <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a> bzw. des Geodateninfrastrukturgesetzes 2010 <a href="http://www.parlament.gv.at/PAKT/VHG/XXIV/ME/ME_00055/index.shtml" title="Geodateninfrastrukturgesetz GeoDIG" target="_blank">GeoDIG</a> um. Die Daten der GBA werden hierbei mit Thesaurus-Konzepten attributiert, w&auml;hrend der Thesaurus gleichzeitig mit INSPIRE-Codes und weiteren international standardisierten Vokabularen verlinkt wird. Datens&auml;tze, die bereits nach INSPIRE harmonisiert wurden, k&ouml;nnen mit dem DataViewer (ein Erweiterungsmodul des GBA Thesaurus, dzt. im Testbetrieb) durchsucht werden.'
            },
            desc_linkeddata: {
                desc: 'Alle Begriffe sind als SKOS Konzepte formatiert (Begriffe, einschlie&szlig;lich Synonyme), mit eigenen Web-Adressen &#8594; <a href="http://de.wikipedia.org/wiki/Uniform_Resource_Identifier" title="URI Uniform Resource Identifier" target="_blank">URI\'s</a>, sowie durch polyhierarchische Beziehungen als &uuml;ber-, untergeordnete, und verwandte Konzepte innerhalb eines Themenbereichs definiert , mit Beschreibungen und Quellenangabe &#8594; Literaturverzeichnis<br>Als <a href="http://de.wikipedia.org/wiki/Linked_Open_Data" title="Linked Data" target="_blank">Linked Data</a> Resource ist sie semantisch mit anderen Resourcen im Web verlinkt &#8594; <a href="http://dbpedia.org/" title="DBpedia Knowledge Base" target="_blank">DBpedia</a>, <a href="http://inspire.ec.europa.eu/registry/" title="INSPIRE Codes" target="_blank">INSPIRE</a>, <a href="http://resource.geosciml.org/" title="Resources for Geosciences XML" target="_blank">GeoSciML</a> maschinenlesbar &uuml;ber Webservices (Endpoints) gem&auml;&szlig; den <a href="http://www.w3.org/2013/data/" title="The World Wide Web Consortium" target="_blank">W3C</a> Standards ver&ouml;ffentlicht &#8594 <a href="http://www.w3.org/RDF/" title="Resource Description Framework (RDF)" target="_blank">RDF</a>, <a href="http://www.w3.org/TR/rdf-sparql-query/" title="SPARQL Query Language for RDF" target="_blank">SparQL</a><br>zur Verwendung in Linked Data Webapplikationen, als Hyperlinks, oder als Kodierung f&uuml;r Geodaten &#8594; Datenharmonisierung, DataViewer'
            }
        }
    }
};
