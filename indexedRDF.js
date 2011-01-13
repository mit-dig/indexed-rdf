(function (window, undefined) {

var IRDFEnvironment = function() {};

IRDFEnvironment.prototype = {
    init: function(db) {
	this.db = db;
	this.base = null;
    },
    
    get name() {
	return this.db.name;
    },
    get description() {
	return this.db.description;
    },
    
    get prefixes() {
	return null;
	//	return new IRDFPrefixMap();
    },
    get terms() {
	return null;
	//	return new IRDFTermMap();
    },
    
    resolve: function(toresolve) {
	//	return null;
    },
    setDefaultVocabulary: function(iri) {
    },
    setDefaultPrefix: function(iri) {
    },
    setTerm: function(term, iri) {
    },
    setPrefix: function(prefix, iri) {
    },
    importProfile: function(profile, override) {
    },
    importProfileFromGraph: function(graph, override) {
    }
    
    createBlankNode: function() {
	//	return new IRDFBlankNode();
    },
    
    createNamedNode: function(iri) {
	//	return new IRDFNamedNode(iri);
    },
    
    createLiteral: function(value, language, datatype) {
	//	return new IRDFLiteral(value, language, datatype);
    },
    
    createGraphLiteral: function(graph) {
	//	return new IRDFGraphLiteral(graph);
    },
    
    createTriple: function(subject, property, object) {
	//	return new IRDFTriple(subject, property, object);
    },
    
    createGraph: function(triples) {
	//	return new IRDFGraph(triples);
    },
    
    createAction: function(test, action) {
	//	return new IRDFTripleAction(test, action);
    },
    
    createProfile: function(base, empty) {
	//	return new IRDFProfile(base, empty);
    },
    
    createTermMap: function(empty) {
	//	return new IRDFTermMap(empty);
    },
    
    createPrefixMap: function(empty) {
	//	return new IRDFPrefixMap(empty);
    },
    
    close: function() {
	this.db.close();
    }
};

// Like IDBRequest
var IRDFRequest = function() {};

IRDFRequest.prototype = {
    init: function(idbRequest) {
	this.idbRequest = idbRequest;
    },
    
    abort: function() {
	if (this.idbRequest &&
	    this.idbRequest.abort &&
	    typeof(this.idbRequest.abort) == 'function') {
	    this.idbRequest.abort();
	}
    },
    
    get LOADING() {
	if (this.idbRequest &&
	    this.idbRequest.LOADING) {
	    return this.idbRequest.LOADING;
	} else {
	    return 1;
	}
    },
    get DONE() {
	if (this.idbRequest &&
	    this.idbRequest.DONE) {
	    return this.idbRequest.DONE;
	} else {
	    return 2;
	}
    },
    get readyState() {
	if (this.idbRequest &&
	    this.idbRequest.readyState) {
	    return this.idbRequest.readyState;
	} else {
	    return this.LOADING;
	}
    },
    
    onsuccess: function(evt) {},
    onerror: function(evt) {}
};

var IRDFFactory = function() {};

IRDFFactory.prototype = {
    stores = [],
    
    /**
     * <p>This method return immediately and attempts to open up an
     * indexedDB database with the given name and description containing a
     * valid RDFEnvironment.</p>
     * @param name {DOMString} The name for the database
     * @param description {DOMString} The description for the database
     * @return {IRDFRequest}
     */
    open: function(name, description) {
	var idbRequest = indexedDB.open(name, description);
	var irdfRequest = new IRDFRequest(idbRequest);
	
	idbRequest.onsuccess = function(evt) {
	    var irdfEvent = new Object;
	    
	    irdfEvent.source = irdfRequest;
	    irdfEvent.result = new IRDFEnvironment(evt.result);
	    
	    if (irdfRequest.onsuccess &&
		typeof(irdfRequest.onsuccess) == 'function') {
		irdfRequest.onsuccess(evt);
	    } else {
		irdfEvent.result.close();
	    }
	}
	idbRequest.onerror = function(evt) {
	    if (irdfRequest.onerror &&
		typeof(irdfRequest.onsuccess) == 'function') {
		irdfRequest.onerror(evt);
	    }
	}
	
	return irdfRequest;
    }
};

return (window.indexedRDF = IRDFFactory);

})(window);