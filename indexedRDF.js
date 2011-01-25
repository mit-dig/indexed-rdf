(function (window, undefined) {

// Handle beta stuff.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;

/**
 * @private
 * @constructor Creates a new IRDFEnvironment with the specified indexedDB backing store.
 * @param db {<a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBDatabase">IDBDatabase</a>} The indexedDB database to use as a backing store for the IRDFEnvironment.
 */
var IRDFEnvironment = function(db) { IRDFEnvironment.fn.init(db); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFEnvironment">RDFEnvironment</a>.
 * @name IRDFEnvironment
 */
IRDFEnvironment.fn = IRDFEnvironment.prototype = {
    init: function(db) {
	/**
	 * @private
	 * The indexedDB backing store.
	 * @type <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBDatabase">IDBDatabase</a>
	 */
	this.db = db;
	/**
	 * The base IRI used to resolve relative IRIs in the environment.
	 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>
	 * @default null
	 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-base">Profile#base</a>
	 */
	this.base = null;
	
	/**
	 * @private
	 * The IRDFTermMap of the environment.
	 * @type IRDFTermMap
	 */
	//	this.envTerms = new IRDFTermMap();
	/**
	 * @private
	 * The IRDFPrefixMap of the environment.
	 * @type IRDFPrefixMap
	 */
	//	this.envPrefixes = new IRDFPrefixMap();
    },
    
    /**
     * The name of the environment's store.
     * @field
     * @name IRDFEnvironment#name
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, readonly
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBDatabase-name">IDBDatabase#name</a>
     */
    get name() {
	return this.db.name;
    },
    /**
     * The description of the environment's store at the time of opening.
     * @field
     * @name IRDFEnvironment#description
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, readonly
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBDatabase-description">IDBDatabase#description</a>
     */
    get description() {
	return this.db.description;
    },
    
    /**
     * The mapping of RDF prefix strings to base IRIs in the environment.
     * @field
     * @name IRDFEnvironment#prefixes
     * @type IRDFPrefixMap, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-prefixes">Profile#prefixes</a>
     */
    get prefixes() {
	return this.envPrefixes;
    },
    /**
     * The mapping of terms to IRIs in the environment.
     * @field
     * @name IRDFEnvironment#terms
     * @type IRDFTermMap, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-terms">Profile#terms</a>
     */
    get terms() {
	return this.envTerms;
    },
    
    // Don't return NULL?
    /**
     * Resolve a Term, CURIE, or Relative-IRI into an absolute IRI.
     * @param toresolve {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The Term, CURIE, or Relative-IRI to resolve.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of toresolve, or toresolve if no resolution is possible.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-resolve">Profile#resolve</a>
     */
    resolve: function(toresolve) {
	var resolved;
	
	resolved = this.terms.resolve(toresolve);
	if (resolved !== null) {
	    return resolved;
	}
	
	resolved = this.prefixes.resolve(toresolve);
	if (resolved !== null) {
	    return resolved;
	}
	
	if (this.base !== null) {
	    return resolveIRI(this.base, toresolve);
	} else {
	    return toresolve;
	}
    },
    
    /**
     * Set the default vocabulary to be used to resolve unknown terms.
     * It is identical to calling IRDFEnvironment#terms#setDefault(iri).
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be used as the default vocabulary.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setDefaultVocabulary">Profile#setDefaultVocabulary</a>
     */
    setDefaultVocabulary: function(iri) {
	this.terms.setDefault(iri);
    },
    /**
     * Set the default prefix to be used to resolve CURIEs which lack one.
     * It is identical to calling IRDFEnvironment#prefixes#setDefault(iri).
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be used as the default prefix.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setDefaultPrefix">Profile#setDefaultPrefix</a>
     */
    setDefaultPrefix: function(iri) {
	this.prefixes.setDefault(iri)
    },
    /**
     * Associate an IRI with a term.
     * It is identical to calling IRDFEnvironment#terms#set(term, iri).
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term to set. Must be a valid NCName.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be associated with the term.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setTerm">Profile#setTerm</a>
     */
    setTerm: function(term, iri) {
	this.terms.set(term, iri);
    },
    /**
     * Associate an IRI with a prefix.
     * It is identical to calling IRDFEnvironment#prefixes#set(term, iri).
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The prefix to set. Must be a valid NCName.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be associated with the prefix.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setPrefix">Profile#setPrefix</a>
     */
    setPrefix: function(prefix, iri) {
	this.prefixes.set(prefix, iri);
    },
    /**
     * Import the terms and prefixes from another profile into the environment.
     * @param profile {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Profile">Profile</a>} The Profile to import.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting terms and prefixes in the environment will be overridden by those in the imported Profile.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-importProfile">Profile#importProfile</a>
     */
    importProfile: function(profile, override) {
	this.prefixes.import(profile.prefixes, override);
	this.terms.import(profile.terms, override);
    },
    /**
     * Import the terms and prefixes defined in a Graph into the environment.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>} A graph containing triples describing term and prefix mappings according to the <a href="http://www.w3.org/TR/2010/WD-rdfa-core-20100422/#s_profiles">RDFa Profile</a> specification.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting terms and prefixes in the environment will be overridden by those in the imported Graph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-importProfileFromGraph">Profile#importProfileFromGraph</a>
     */
    importProfileFromGraph: function(graph, override) {
	this.prefixes.importFromGraph(graph, override);
	this.terms.importFromGraph(graph, override);
    },
    
    /**
     * Create a new blank node in the environment.
     * @return {IRDFBlankNode} The new blank node.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createBlankNode">RDFEnvironment#createBlankNode</a>
     */
    createBlankNode: function() {
	return new IRDFBlankNode();
    },
    
    /**
     * Create a new named node in the environment.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The lexical value of the IRI of the node to create.
     * @return {IRDFNamedNode} The new named node.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createNamedNode">RDFEnvironment#createNamedNode</a>
     */
    createNamedNode: function(iri) {
	return new IRDFNamedNode(iri);
    },
    
    // What are the supported datatypes?
    /**
     * Create a new literal in the environment.
     * @param value {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>} The value of the literal.  The value must respond to toString().
     * @param language {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The language code associated with the literal, specified according to <a href="http://tools.ietf.org/rfc/bcp/bcp47.txt">BCP47</a>.
     * @param datatype {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The datatype associated with the literal.  This value may be specified as a full IRI or CURIE.
     * @return {IRDFLiteral} The new literal.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createLiteral">RDFEnvironment#createLiteral</a>
     */
    createLiteral: function(value, language, datatype) {
	return new IRDFLiteral(value, language, datatype);
    },
    
    /**
     * Create a new graph literal in the environment.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>, optional} The graph represented by the graph literal.  If not specified, an empty graph will be created.
     * @return {IRDFGraphLiteral} The new graph literal.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createGraphLiteral">RDFEnvironment#createGraphLiteral</a>
     */
    createGraphLiteral: function(graph) {
	return new IRDFGraphLiteral(graph);
    },
    
    /**
     * Create a new triple in the environment.
     * @param subject {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to be used as the subject of the triple.
     * @param property {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to be used as the property of the triple.
     * @param object {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to be used as the object of the triple.
     * @return {IRDFTriple} The new triple.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createTriple">RDFEnvironment#createTriple</a>
     */
    createTriple: function(subject, property, object) {
	return new IRDFTriple(subject, property, object);
    },
    
    /**
     * Create a new graph in the environment.
     * @param triples {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">[]Triple</a>, optional} An array of Triples to be added to the created graph.
     * @return {IRDFGraph} The new graph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createGraph">RDFEnvironment#createGraph</a>
     */
    createGraph: function(triples) {
	return new IRDFGraph(triples);
    },
    
    /**
     * Create a new action in the environment.
     * @param test {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
     * @param action {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleCallback">TripleCallback</a>} A callback action to run for each Triple which passes the test.
     * @return {IRDFTripleAction} The new triple action.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createAction">RDFEnvironment#createAction</a>
     */
    createAction: function(test, action) {
	return new IRDFTripleAction(test, action);
    },
    
    /**
     * Create a new profile in the environment.
     * @param base {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The IRI to use as the base IRI of the new profile.
     * @param empty {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>, optional} If true, then the new profile will contain an empty TermMap and PrefixMap.  Otherwise, the current environment's TermMap and PrefixMaps will be copied to the new profile.
     * @return {IRDFProfile} The new profile.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createProfile">RDFEnvironment#createProfile</a>
     */
    createProfile: function(base, empty) {
	return new IRDFProfile(base, empty);
    },
    
    /**
     * Create a new term map in the environment.
     * @param empty {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>, optional} If true, then an empty TermMap will be returned.  Otherwise, a copy of the current environment's TermMap will be returned.
     * @return {IRDFTermMap} The new term map.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createTermMap">RDFEnvironment#createTermMap</a>
     */
    createTermMap: function(empty) {
	return new IRDFTermMap(empty);
    },
    
    /**
     * Create a new prefix map in the environment.
     * @param empty {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>, optional} If true, then an empty PrefixMap will be returned.  Otherwise, a copy of the current environment's PrefixMap will be returned.
     * @return {IRDFPrefixMap} The new prefix map.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createPrefixMap">RDFEnvironment#createPrefixMap</a>
     */
    createPrefixMap: function(empty) {
	return new IRDFPrefixMap(empty);
    },
    
    /**
     * Close the current environment.
     */
    close: function() {
	this.db.close();
    }
};

/**
 * @private
 * @constructor Creates an EventListenerWrapper
 */
var EventListenerWrapper = function() { EventListenerWrapper.fn.init(); };

/**
 * @private
 * @class A wrapper object for a general function taking one argument to make it adhere to the EventListener interface.
 * @name EventListenerWrapper
 * @see <a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventListener">EventListener</a>
 */
EventListenerWrapper.fn = EventListenerWrapper.prototype = {
    init: function() {
	/**
	 * @private
	 * The wrapped function.
	 * @type <a href="http://w3.org/TR/html5/webappapis.html#function">Function</a>
	 */
	this.wrappedFun = function(evt) {};
    },
    
    /**
     * @private
     * Handle an incoming event.
     * @see <a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventListener-handleEvent">EventListener#handleEvent</a>
     */
    handleEvent: function(evt) {
	this.wrappedFun(evt);
    }
};

/**
 * @private
 * @constructor Creates a new IRDFRequest.
 * @param idbRequest {<a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBRequest">IDBRequest</a>} The indexedDB request object encapsulated for use with indexedRDF.
 */
var IRDFRequest = function(idbRequest) { IRDFRequest.fn.init(idbRequest); };

/**
 * @class An asynchronous request object used to signal store-open events in indexedRDF, like <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBRequest">IDBRequest</a> for indexedDB.
 * @name IRDFRequest
 */
IRDFRequest.fn = IRDFRequest.prototype = {
    init: function(idbRequest) {
	/**
	 * @private
	 * The encapsulated indexedDB IDBRequest.
	 * @type <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBRequest">IDBRequest</a>
	 */
	this.idbRequest = idbRequest;
	
	/**
	 * @private
	 * The wrapper for the onsuccess function.
	 * @type EventListenerWrapper
	 */
	this.onsuccessFun = new EventListenerWrapper();
	/**
	 * @private
	 * The wrapper for the onerror function.
	 * @type EventListenerWrapper
	 */
	this.onerrorFun = new EventListenerWrapper();
	
	/**
	 * @private
	 * An associative array containing all event listeners, indexed first
	 * by event name, followed by useCapture.
	 * @type Object
	 */
	this.eventListeners = new Object();
	this.eventListeners['success'] = new Object();
        this.eventListeners['success'][false] = [this.onsuccessFun];
	this.eventListeners['error'] = new Object();
	this.eventListeners['error'][false] = [this.onerrorFun];
    },
    
    /**
     * The current state value of the request.
     * @field
     * @name IRDFRequest#readyState
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-unsigned-short">unsigned short</a>, readonly
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBRequest-readyState">IDBRequest#readyState</a>
     */
    get readyState() {
	if (this.idbRequest &&
	    this.idbRequest.readyState) {
	    return this.idbRequest.readyState;
	} else {
	    return IRDFRequest.LOADING;
	}
    },
    
    /**
     * The event handler called upon a successful completion of the request.
     * @field
     * @name IRDFRequest#onsuccess
     * @type <a href="http://w3.org/TR/html5/webappapis.html#function">Function</a>
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBRequest-onsuccess">IDBRequest#onsuccess</a>
     */
    get onsuccess() {
	return this.onsuccessFun.wrappedFun;
    },
    set onsuccess(fun) {
	this.onsuccessFun.wrappedFun = fun;
    },
    /**
     * The event handler called upon receiving an error while completing the request.
     * @field
     * @name IRDFRequest#onerror
     * @type <a href="http://w3.org/TR/html5/webappapis.html#function">Function</a>
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBRequest-onsuccess">IDBRequest#onerror</a>
     */
    get onerror() {
	return this.onerrorFun.wrappedFun;
    },
    set onerror(fun) {
	this.onerrorFun.wrappedFun = fun;
    },
    
    /**
     * Register an event listener on this request.
     * @param type {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The event type for which an event listener is registered.
     * @param listener {<a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventListener">EventListener</a>} The object used to listen for events.
     * @param useCapture {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, this event listener will not be triggered during the bubbling phase.
     * @see <a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventTarget-addEventListener">EventTarget#addEventListener</a>
     */
    addEventListener: function(type, listener, useCapture) {
	if (type == 'success' ||
	    type == 'error') {
	    if (this.eventListeners[type] == undefined) {
		this.eventListeners[type] = new Object();
	    }
	    if (this.eventListeners[type][useCapture] == undefined) {
		this.eventListeners[type][useCapture] = [listener];
	    } else {
                // Only add the listener if it's not already there.
                // Too bad JavaScript doesn't have a true hash-table.
                var addListener = true;
                for (var i = 0; i < this.eventListeners[type][useCapture].length; i++) {
                    if (this.eventListeners[type][useCapture][i] == listener) {
                        addListener = false;
                        break;
                    }
                }
                if (addListener) {
                    this.eventListeners[type][useCapture].push(listener);
                }
            }
	}
    },
    /**
     * Remove an event listener from this request.
     * @param type {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The event type for which an event listener is to be removed.
     * @param listener {<a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventListener">EventListener</a>} The object listening for events to be removed.
     * @param useCapture {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} The useCapture flag used to add the event listener via addEventListener.
     * @see <a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventTarget-removeEventListener">EventTarget#removeEventListener</a>
     */
    removeEventListener: function(type, listener, useCapture) {
	if (type == 'success' ||
	    type == 'error') {
	    if (this.eventListeners[type] != undefined &&
                this.eventListeners[type][useCapture] != undefined) {
                // Too bad JavaScript doesn't have a true hash-table.
                for (var i = 0; i < this.eventListeners[type][useCapture].length; i++) {
                    if (this.eventListeners[type][useCapture][i] == listener) {
                        this.eventListeners[type][useCapture].splice(i, 1);
                        break;
                    }
                }
	    }
	}
    },
    /**
     * Dispatch an event into the event model.
     * @param evt {<a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-Event">Event</a>} The event to be dispatched.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If false, Event.preventDefault() was called by at least one of the listeners that received the event.
     * @see <a href="http://www.w3.org/TR/DOM-Level-3-Events/#events-EventTarget-dispatchEvent">EventTarget#dispatchEvent</a>
     */
    dispatchEvent: function(evt) {
	if (evt.type == 'success' ||
	    evt.type == 'error') {
	    if (this.eventListeners[evt.type] != undefined) {
		if (this.eventListeners[evt.type][true] != undefined) {
		    for (var i = 0; i < this.eventListeners[evt.type][true].length; i++) {
                        var listener = this.eventListeners[evt.type][true][i];
			try {
			    if (listener.handleEvent != undefined) {
				listener.handleEvent(evt);
			    } else {
				listener(evt);
			    }
			} catch (exc) {
			}
		    }
		}
		if (this.eventListeners[evt.type][false] != undefined) {
		    for (var i = 0; i < this.eventListeners[evt.type][false].length; i++) {
                        var listener = this.eventListeners[evt.type][false][i];
			try {
			    if (listener.handleEvent != undefined) {
				listener.handleEvent(evt);
			    } else {
				listener(evt);
			    }
			} catch (exc) {
			}
		    }
		}
	    }
	}
    }
};
/**
 * The state value of a request that has been started, but which has not completed.
 * @field
 * @name IRDFRequest.LOADING
 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-unsigned-short">unsigned short</a>, readonly
 * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBRequest-LOADING">IDBRequest.LOADING</a>
 */
IRDFRequest.LOADING = 1;
/**
 * The state value of a request that has completed.
 * @field
 * @name IRDFRequest.DONE
 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-unsigned-short">unsigned short</a>, readonly
 * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBRequest-DONE">IDBRequest.DONE</a>
 */
IRDFRequest.DONE = 2;

/**
 * @private
 * @constructor Creates a new IRDFFactory.
 */
var IRDFFactory = function() {};

/**
 * @class A factory object, like <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBFactory">IDBFactory</a>, used to create IRDFEnvironments.
 * @name IRDFFactory
 */
IRDFFactory.prototype = {
    /**
     * This method returns immediately and attempts to open up an
     * indexedDB database with the given name containing a valid
     * IRDFEnvironment.  This function will not work when called from a file://
     * URI in Firefox.
     * @param name {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The name of the database containing an IRDFEnvironment.
     * @return {IRDFRequest}
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBFactory-open">IDBFactory#open</a>
     */
    open: function(name) {
        // NOTE: This doesn't actually work from a file:/// URI in Firefox!!
	var idbRequest = indexedDB.open(name);
	var irdfRequest = new IRDFRequest(idbRequest);
	
	idbRequest.onsuccess = function(evt) {
	    var irdfEvent = new Object();
	    
	    irdfEvent.source = irdfRequest;
	    irdfEvent.result = new IRDFEnvironment(idbRequest.result);
	    
	    if (irdfRequest.onsuccess &&
		typeof(irdfRequest.onsuccess) == 'function') {
		irdfRequest.onsuccess(irdfEvent);
	    } else {
		irdfEvent.result.close();
	    }
	}
	idbRequest.onerror = function(evt) {
	    var irdfEvent = new Object();
	    
	    irdfEvent.source = irdfRequest;
	    irdfEvent.code = evt.code;
            irdfEvent.message = evt.message;
	    
	    if (irdfRequest.onerror &&
		typeof(irdfRequest.onsuccess) == 'function') {
		irdfRequest.onerror(irdfEvent);
	    }
	}
	
	return irdfRequest;
    },
    
    /**
     * This method returns immediately and attempts to delete any existing
     * indexedDB database with the given name containing a valid
     * IRDFEnvironment.  This method does nothing in Firefox 4.
     * @param name {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The name of the database containing an IRDFEnvironment.
     * @return {IRDFRequest}, or null if <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBFactory-deleteDatabase">IDBFactory#deleteDatabase</a> is not implemented (e.g. in Firefox 4).
     * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBFactory-deleteDatabase">IDBFactory#deleteDatabase</a>
     */
    deleteStore: function(name) {
        // Firefox 4 hasn't implemented this.
        if (indexedDB.deleteDatabase == undefined) {
            return null;
        }
        
	var idbRequest = indexedDB.deleteDatabase(name);
	var irdfRequest = new IRDFRequest(idbRequest);
	
	idbRequest.onsuccess = function(evt) {
	    var irdfEvent = new Object();
	    
	    irdfEvent.source = irdfRequest;
	    irdfEvent.result = null;
	    
	    if (irdfRequest.onsuccess &&
		typeof(irdfRequest.onsuccess) == 'function') {
		irdfRequest.onsuccess(irdfEvent);
	    } else {
		irdfEvent.result.close();
	    }
	}
	idbRequest.onerror = function(evt) {
	    var irdfEvent = new Object();
	    
	    irdfEvent.source = irdfRequest;
	    irdfEvent.code = evt.code;
            irdfEvent.message = evt.message;
	    
	    if (irdfRequest.onerror &&
		typeof(irdfRequest.onsuccess) == 'function') {
		irdfRequest.onerror(irdfEvent);
	    }
	}
	
	return irdfRequest;
    }
};

/**
 * @namespace
 * The global window object.
 * @name window
 */

/**
 * The IRDFRequest class (for reference to IRDFRequest constants).
 * @name window#IRDFRequest
 */
window.IRDFRequest = IRDFRequest;

/**
 * The primary IRDFFactory object capable of creating IRDFEnvironments.
 * @type IRDFFactory
 * @name window#indexedRDF
 */
return (window.indexedRDF = new IRDFFactory());

})(window);