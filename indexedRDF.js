/*
 * Copyright © 2011 Ian Jacobi
 *
 * Parts Additionally Copyright © 2007 Dominic Mitchell
 *
 * The following code makes use of the URI and URIQuery classes which
 * are used and distributed under the New BSD license, which follows:
 *
 * Copyright © 2007 Dominic Mitchell
 * 
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * Neither the name of the Dominic Mitchell nor the names of its contributors
 * may be used to endorse or promote products derived from this software
 * without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function (window, undefined) {

// Embed some URI handling stuff from js-uri.

// Globals we introduce.
var URI;
var URIQuery;

// Introduce a new scope to define some private helper functions.
(function () {

    //// HELPER FUNCTIONS /////
 
    // RFC3986 §5.2.3 (Merge Paths)
    function merge(base, rel_path) {
        var dirname = /^(.*)\//;
        if (base.authority && !base.path) {
            return "/" + rel_path;
        }
        else {
            return base.getPath().match(dirname)[0] + rel_path;
        }
    }

    // Match two path segments, where the second is ".." and the first must
    // not be "..".
    var DoubleDot = /\/((?!\.\.\/)[^\/]*)\/\.\.\//;

    function remove_dot_segments(path) {
        if (!path) {
            return "";
        }
        // Remove any single dots
        var newpath = path.replace(/\/\.\//g, '/');
        // Remove any trailing single dots.
        newpath = newpath.replace(/\/\.$/, '/');
        // Remove any double dots and the path previous.  NB: We can't use
        // the "g", modifier because we are changing the string that we're
        // matching over.
        while (newpath.match(DoubleDot)) {
            newpath = newpath.replace(DoubleDot, '/');
        }
        // Remove any trailing double dots.
        newpath = newpath.replace(/\/([^\/]*)\/\.\.$/, '/');
        // If there are any remaining double dot bits, then they're wrong
        // and must be nuked.  Again, we can't use the g modifier.
        while (newpath.match(/\/\.\.\//)) {
            newpath = newpath.replace(/\/\.\.\//, '/');
        }
        return newpath;
    }

    // give me an ordered list of keys of this object
    function hashkeys(obj) {
        var list = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                list.push(key);
            }
        }
        return list.sort();
    }

    // TODO: Make these do something
    function uriEscape(source) {
        return source;
    }

    function uriUnescape(source) {
        return source;
    }


    //// URI CLASS /////

    // Constructor for the URI object.  Parse a string into its components.
    // note that this 'exports' 'URI' to the 'global namespace'
    URI = function (str) {
        if (!str) {
            str = "";
        }
        // Based on the regex in RFC2396 Appendix B.
        var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
        var result = str.match(parser);
       
        // Keep the results in private variables.
        var scheme    = result[1] || null;
        var authority = result[2] || null;
        var path      = result[3] || null;
        var query     = result[4] || null;
        var fragment  = result[5] || null;
       
        // Set up accessors.
        this.getScheme = function () {
            return scheme;
        };
        this.setScheme = function (newScheme) {
            scheme = newScheme;
        };
        this.getAuthority = function () {
            return authority;
        };
        this.setAuthority = function (newAuthority) {
            authority = newAuthority;
        };
        this.getPath = function () {
            return path;
        };
        this.setPath = function (newPath) {
            path = newPath;
        };
        this.getQuery = function () {
            return query;
        };
        this.setQuery = function (newQuery) {
            query = newQuery;
        };
        this.getFragment = function () {
            return fragment;
        };
        this.setFragment = function (newFragment) {
            fragment = newFragment;
        };
    };

    // Restore the URI to it's stringy glory.
    URI.prototype.toString = function () {
        var str = "";
        if (this.getScheme()) {
            str += this.getScheme() + ":";
        }
        if (this.getAuthority()) {
            str += "//" + this.getAuthority();
        }
        if (this.getPath()) {
            str += this.getPath();
        }
        if (this.getQuery()) {
            str += "?" + this.getQuery();
        }
        if (this.getFragment()) {
            str += "#" + this.getFragment();
        }
        return str;
    };

    // RFC3986 §5.2.2. Transform References;
    URI.prototype.resolve = function (base) {
        var target = new URI();
        if (this.getScheme()) {
            target.setScheme(this.getScheme());
            target.setAuthority(this.getAuthority());
            target.setPath(remove_dot_segments(this.getPath()));
            target.setQuery(this.getQuery());
        }
        else {
            if (this.getAuthority()) {
                target.setAuthority(this.getAuthority());
                target.setPath(remove_dot_segments(this.getPath()));
                target.setQuery(this.getQuery());
            }        
            else {
                // XXX Original spec says "if defined and empty"…;
                if (!this.getPath()) {
                    target.setPath(base.getPath());
                    if (this.getQuery()) {
                        target.setQuery(this.getQuery());
                    }
                    else {
                        target.setQuery(base.getQuery());
                    }
                }
                else {
                    if (this.getPath().charAt(0) === '/') {
                        target.setPath(remove_dot_segments(this.getPath()));
                    } else {
                        target.setPath(merge(base, this.getPath()));
                        target.setPath(remove_dot_segments(target.getPath()));
                    }
                    target.setQuery(this.getQuery());
                }
                target.setAuthority(base.getAuthority());
            }
            target.setScheme(base.getScheme());
        }

        target.setFragment(this.getFragment());

        return target;
    };

    URI.prototype.parseQuery = function () {
        return URIQuery.fromString(this.getQuery(), this.querySeparator);
    };

    //// URIQuery CLASS /////

    URIQuery = function () {
        this.params    = {};
        this.separator = "&";
    };

    URIQuery.fromString = function (sourceString, separator) {
        var result = new URIQuery();
        if (separator) {
            result.separator = separator;
        }
        result.addStringParams(sourceString);
        return result;
    };

   
    // From http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
    // (application/x-www-form-urlencoded).
    //
    // NB: The user can get this.params and modify it directly.
    URIQuery.prototype.addStringParams = function (sourceString) {
        var kvp = sourceString.split(this.separator);
        var list, key, value;
        for (var i = 0; i < kvp.length; i++) {
            // var [key,value] = kvp.split("=", 2) only works on >= JS 1.7
            list  = kvp[i].split("=", 2);
            key   = uriUnescape(list[0].replace(/\+/g, " "));
            value = uriUnescape(list[1].replace(/\+/g, " "));
            if (!this.params.hasOwnProperty(key)) {
                this.params[key] = [];
            }
            this.params[key].push(value);
        }
    };

    URIQuery.prototype.getParam = function (key) {
        if (this.params.hasOwnProperty(key)) {
            return this.params[key][0];
        }
        return null;
    };

    URIQuery.prototype.toString = function () {
        var kvp = [];
        var keys = hashkeys(this.params);
        var ik, ip;
        for (ik = 0; ik < keys.length; ik++) {
            for (ip = 0; ip < this.params[keys[ik]].length; ip++) {
                kvp.push(keys[ik].replace(/ /g, "+") + "=" + this.params[keys[ik]][ip].replace(/ /g, "+"));
            }
        }
        return kvp.join(this.separator);
    };

})();
// END js-uri

// Handle beta stuff.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;

/**
 * Resolve an IRI given a base IRI.
 * @param base {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The base IRI from which rel may be considered relative.
 * @param rel {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to resolve.
 * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of rel if rel is a relative IRI.  This will be an absolute IRI if base is absolute.  If rel is an absolute IRI, rel will be returned.
 */
function resolveIRI(base, rel) {
    if (rel == null) {
	return null;
    }
    
    base = new URI(base);
    rel = new URI(rel);
    
    return rel.resolve(base).toString();
}

/**
 * @private
 * @constructor Creates a new IRDFNode.
 * @param value {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>} The value of this IRDFNode.
 */
var IRDFNode = function(value) { IRDFNode.fn.init.apply(this, [value]); }

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>.
 * @name IRDFNode
 */
IRDFNode.fn = IRDFNode.prototype = {
    init: function(value) {
	/**
	 * @private
	 * The value of the node.
	 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>
	 */
	this._value = value;
	
	/**
	 * @private
	 * The type of node interface that this node exposes.
	 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>
	 */
	this._interfaceName = 'RDFNode';
    },
    
    /**
     * The value of the node.
     * @field
     * @name IRDFNode#value
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFNode-value">RDFNode#value</a>
     */
    get value() {
	return this._value;
    },
    /**
     * The type of node interface that this node exposes.
     * @field
     * @name IRDFNode#interfaceName
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFNode-interfaceName">RDFNode#interfaceName</a>
     */
    get interfaceName() {
	return this._interfaceName;
    },
    
    /**
     * Return the string value of this node.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The string value of this node.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFNode-toString">RDFNode#toString</a>
     */
    toString: function() {
	return this.value.toString();
    },
    
    /**
     * Return the N-Triples representation of this node, according to <a href="http://www.w3.org/TR/2004/REC-rdf-testcases-20040210/">RDF Test Cases</a>.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The N-Triples representation of this node.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFNode-toNT">RDFNode#toNT</a>
     */
    toNT: function() {
	return null;
    },
    
    /**
     * Return whether or not this RDFNode is equal to another.  This function takes all appropriate attributes into account when performing a comparison.
     * @param otherNode {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to compare this RDFNode to.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} True, if the two RDFNode objects are equivalent, or, if otherNode is not an instance of RDFNode, if otherNode is equal to this node's value.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFNode-equals">RDFNode#equals</a>
     */
    equals: function(otherNode) {
        if (otherNode.value && otherNode.interfaceName) {
	    return (this.value == otherNode.value) &&
	           (this.interfaceName == otherNode.interfaceName);
	} else {
	    return this.value == otherNode;
	}
    }
};

/**
 * @private
 * @constructor Creates a new IRDFBlankNode.
 * @param value {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>} The internal value of the IRDFBlankNode used to stringify it.  The value must respond to toString().
 */
var IRDFBlankNode = function(value) { IRDFBlankNode.fn.init.apply(this, [value]); }

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-BlankNode">BlankNode</a>.
 * @name IRDFBlankNode
 * @augments IRDFNode
 */
IRDFBlankNode.prototype = new IRDFNode();

IRDFBlankNode.prototype.init = function(value) {
    IRDFNode.fn.init.apply(this, [value]);
    this._interfaceName = 'BlankNode';
};

IRDFBlankNode.prototype.toString = function() {
    return '_:' + this.value.toString();
};

IRDFBlankNode.prototype.toNT = function() {
    return '_:' + this.value.toString().replace(/[^A-Za-z0-9]/g, '').replace(/^[0-9]+/, '');
};

IRDFBlankNode.fn = IRDFBlankNode.prototype;

/**
 * @private
 * @constructor Creates a new IRDFNamedNode.
 * @param value {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>} The IRI value of the IRDFNamedNode.
 */
var IRDFNamedNode = function(value) { IRDFNamedNode.fn.init.apply(this, [value]); }

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-NamedNode">NamedNode</a>.
 * @name IRDFNamedNode
 * @augments IRDFNode
 */
IRDFNamedNode.prototype = new IRDFNode();

IRDFNamedNode.prototype.init = function(value) {
    IRDFNode.fn.init.apply(this, [value]);
    this._interfaceName = 'NamedNode';
};

IRDFNamedNode.prototype.toString = function() {
    return this.value.toString();
};

IRDFNamedNode.prototype.toNT = function() {
    return '<' + this.value.toString() + '>';
};

IRDFNamedNode.fn = IRDFNamedNode.prototype;

/**
 * @private
 * @constructor Creates a new IRDFLiteral.
 * @param value {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>} The value of the IRDFLiteral.  The value must respond to toString().
 * @param language {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The language code associated with the literal, specified according to <a href="http://tools.ietf.org/rfc/bcp/bcp47.txt">BCP47</a>.
 * @param datatype {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-NamedNode">NamedNode</a>, optional} The datatype associated with the literal.  This value may be specified as a full IRI or CURIE.
 */
var IRDFLiteral = function(value, language, datatype) { IRDFLiteral.fn.init.apply(this, [value, language, datatype]); }

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Literal">Literal</a>.
 * @name IRDFLiteral
 * @augments IRDFNode
 */
IRDFLiteral.prototype = new IRDFNode();

IRDFLiteral.prototype.init = function(value, language, datatype) {
    IRDFNode.fn.init.apply(this, [value]);
    this._interfaceName = 'Literal';
    
    /**
     * @private
     * The language code associated with this literal.
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>
     */
    this._language = language;
    if (language == undefined) {
	this._language = null;
    }
    
    /**
     * @private
     * The datatype associated with this literal.
     * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-NamedNode">NamedNode</a>
     */
    this._datatype = datatype;
    if (datatype == undefined) {
	this._datatype = null;
    } else if (this._datatype.equals) {
	// Do automatic type conversion.
	if (this._datatype.equals('http://www.w3.org/2001/XMLSchema#string')) {
	    this._value = this._value.toString();
	} else if (this._datatype.equals('http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral')) {
	    this._value = this._value.toString();
	    if (this._language == null) {
		this._language = '';
	    }
	} else if (this._datatype.equals('http://www.w3.org/2001/XMLSchema#boolean')) {
	    this._value = (this._value.toLowerCase() == 'true' ||
			   this._value == '1');
	} else if (this._datatype.equals('http://www.w3.org/2001/XMLSchema#dateTime') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#date')) {
	    this._value = new Date(this._value);
	} else if (this._datatype.equals('http://www.w3.org/2001/XMLSchema#time')) {
	    var date = new Date();
	    date.setUTCHours(0, 0, 0, 0);
	    this._value = new Date('1970-01-01T' + this._value);
	    this._value.setTime(date.getTime() + this._value.getTime());
	} else if (this._datatype.equals('http://www.w3.org/2001/XMLSchema#int') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#positiveInteger') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#negativeInteger') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#nonPositiveInteger') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#nonNegativeInteger') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#integer') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#long') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#short') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#byte') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#unsignedLong') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#unsignedInt') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#unsignedShort') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#unsignedByte')) {
	    this._value = parseInt(this._value);
	} else if (this._datatype.equals('http://www.w3.org/2001/XMLSchema#double') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#float') ||
		   this._datatype.equals('http://www.w3.org/2001/XMLSchema#decimal')) {
	    this._value = parseFloat(this._value);
	}
    }
};

/**
 * The language code associated with the literal.
 * @field
 * @name IRDFLiteral#language
 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, readonly
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Literal-language">Literal#language</a>
 */
IRDFLiteral.prototype.__defineGetter__('language', function() {
    return this._language;
});

/**
 * The datatype associated with the literal.
 * @field
 * @name IRDFLiteral#datatype
 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-NamedNode">NamedNode</a>, readonly
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Literal-datatype">Literal#datatype</a>
 */
IRDFLiteral.prototype.__defineGetter__('datatype', function() {
    return this._datatype;
});

IRDFLiteral.prototype.toString = function() {
    return this.value.toString();
};

IRDFLiteral.prototype.toNT = function() {
    var nt;
    
    if (this.datatype && this.datatype.equals('http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral')) {
	nt = '"' + this.value.toString().replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '@' + this.language + '"^^' + this.datatype.toNT(); // FIX EMACS HIGHLIGHTING: "'"');
    } else {
	nt = '"' + this.value.toString().replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; // FIX EMACS HIGHLIGHTING: "'"');
	if (this.language) {
	    nt += '@' + this.language.toString();
	} else if (this.datatype) {
	    nt += '^^' + this.datatype.toNT();
	}
    }

    // What about if both are set?
    
    return nt;
};

IRDFLiteral.prototype.equals = function(otherNode) {
    if (otherNode.value && otherNode.interfaceName) {
	return (this.value == otherNode.value) &&
	       (this.interfaceName == otherNode.interfaceName) &&
	       (this.language == otherNode.language) &&
	       (this.datatype == otherNode.datatype ||
		(this.datatype && otherNode.datatype &&
		 this.datatype.equals(otherNode.datatype)));
    } else {
	return this.value == otherNode;
    }
};

IRDFLiteral.fn = IRDFLiteral.prototype;

/**
 * @private
 * @constructor Creates a new IRDFTriple.
 * @param subject {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The subject of the triple.
 * @param property {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The property of the triple.
 * @param object {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The object of the triple.
 */
var IRDFTriple = function(subject, property, object) { IRDFTriple.fn.init.apply(this, [subject, property, object]); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">Triple</a>.
 * @name IRDFTriple
 */
IRDFTriple.fn = IRDFTriple.prototype = {
    init: function(subject, property, object) {
	/**
	 * @private
	 * The subject of the triple.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>
	 */
	this._subject = subject;

	/**
	 * @private
	 * The property of the triple.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>
	 */
	this._property = property;

	/**
	 * @private
	 * The object of the triple.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>
	 */
	this._object = object;
    },
    
    /**
     * The subject of this triple.
     * @field
     * @name IRDFTriple#subject
     * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Triple-subject">Triple#subject</a>
     */
    get subject() {
	return this._subject;
    },
    /**
     * The property of this triple.
     * @field
     * @name IRDFTriple#property
     * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Triple-property">Triple#property</a>
     */
    get property() {
	return this._property;
    },
    /**
     * The object of this triple.
     * @field
     * @name IRDFTriple#object
     * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Triple-object">Triple#object</a>
     */
    get object() {
	return this._object;
    },
    
    /**
     * Return this triple as rendered in N-Triples notation.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The value of this triple as rendered in N-Triples notation.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Triple-toString">Triple#toString</a>
     */
    toString: function() {
	return this._subject.toNT() + ' ' + this._property.toNT() + ' ' + this._object.toNT() + ' .';
    }
};

/**
 * @private
 * @constructor Creates a new IRDFTripleAction.
 * @param test {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} The test to run against a triple.
 * @param action {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleCallback">TripleCallback</a>} The action to run should a triple pass the test.
 */
var IRDFTripleAction = function(test, action) { IRDFTripleAction.fn.init.apply(this, [test, action]); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleAction">TripleAction</a>.
 * @name IRDFTripleAction
 */
IRDFTripleAction.fn = IRDFTripleAction.prototype = {
    init: function(test, action) {
	/**
	 * The test to run against a triple.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>
	 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TripleAction-test">TripleAction#test</a>
	 */
	this.test = test;
	/**
	 * The action to run should a triple pass the test.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleCallback">TripleCallback</a>
	 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TripleAction-action">TripleAction#action</a>
	 */
	this.action = action;
    },
    
    /**
     * Run this action against a triple if it passes this action's test.
     * @param triple {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">Triple</a>} The triple to run against this action.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TripleAction-try">TripleAction#try</a>
     */
    try: function(triple) {
	if (this.test &&
	    ((typeof this.test === 'function' &&
	      this.test(triple)) ||
	     (this.test.test &&
	      typeof this.test.test === 'function' &&
	      this.test.test(triple)))) {
	    if (this.action) {
		if (typeof this.action === 'function') {
		    this.action(triple);
		} else if (this.action.run &&
			   typeof this.action.run === 'function') {
		    this.action.run(triple);
		}
	    }
	}
    }
};

/**
 * @private
 * @constructor Creates a new IRDFQuad.
 * @param graph {IRDFGraph} The graph which the triple belongs to.
 * @param triple {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">Triple</a>} The triple to associate with a graph.
 */
var IRDFQuad = function(graph, triple) { IRDFQuad.fn.init.apply(this, [graph, triple]); };

/**
 * @private
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">Triple</a>, adding a property IRDFQuad#graph to store the graph which the triple is associated with.
 * @name IRDFQuad
 */
IRDFQuad.fn = IRDFQuad.prototype = {
    init: function(graph, triple) {
	/**
	 * @private
	 * The subject of this quad.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>
	 */
	this.subject = triple.subject;

	/**
	 * @private
	 * The property of this quad.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>
	 */
	this.property = triple.property;

	/**
	 * @private
	 * The object of this quad.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>
	 */
	this.object = triple.object;

	/**
	 * @private
	 * The graph which this quad belongs to.
	 * @type IRDFGraph
	 */
	this.graph = graph;
    },
    
    /**
     * @private
     * Return the IRDFTriple of this quad.
     * @return {IRDFTriple} The triple consisting of the subject, property, and object of this quad.
     */
    toTriple: function() {
	return new IRDFTriple(this.subject, this.property, this.object);
    },
    
    /**
     * @private
     * Return the TriG serialization of this quad.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The serialization of this quad in TriG (This should be equivalent to this.graph.toNT() + " {" + this.toTriple().toString() + "}").
     */
    toTriG: function() {
	return this.graph.toNT() + ' {' + this.toTriple().toString() + '}';
    },
    
    /**
     * @private
     * The TriG serialization of this quad.  This must be a property to allow keyPaths to use it.  It is equivalent to the return value of IRDFQuad#toTriG.
     * @field
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>
     */
    get _trig() {
	return this.toTriG();
    }
};


/**
 * @private
 * @constructor Creates a new non-persistent IRDFGraph.
 * @param env {IRDFEnvironment} The environment in which to create the graph.
 * @param triples {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">[]Triple</a>, optional} An array of Triples to be added to the created graph.
 * @param iri {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-NamedNode">NamedNode</a>, optional} If specified, the graph will be made persistent with the specified IRI as its name.  Any pre-existing persistent triples associated with that graph IRI will be added to the new graph object in addition to any specified in the triples argument.  Any triples specified in the triples argument will be automatically persisted.
 */
var IRDFGraph = function(env, triples, iri) { IRDFGraph.fn.init.apply(this, [env, triples, iri]); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>.  Most functions may return invalid answers before a persistent graph has finished loading.  The Graph#request property may be monitored immediately following graph creation to determine when the graph has finished loading.
 * @name IRDFGraph
 */
// Need to assign an IRI to the graph in order to save it automatically?
// Need to be able to find existing graphs
// GraphLiteral?
// Transient copies vs. durable copies
IRDFGraph.fn = IRDFGraph.prototype = {
    init: function(env, triples, iri) {
	/**
	 * @private
	 * The IRDFEnvironment this graph was created in and is persisted in.
	 * @type IRDFEnvironment
	 */
	this._env = env;
	
	/**
	 * @private
	 * An array of the Triples in this graph (the active cache, if persistent)
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">[]Triple</a>
	 */
	if (this._triples == undefined ||
	    this._triples == null) {
	    this._triples = [];
	} else {
	    this._triples = triples;
	}
	
	/**
	 * @private
	 * An Object acting as a nested associative array of the Triples in this graph (keyed first by subject, then by property, and finally by object).
	 */
	this._tripleIndex = new Object();
	
	/**
	 * @private
	 * An array of the TripleActions attached to this graph to be run when a triple is added.
	 * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleAction">[]TripleAction</a>
	 */
	this._actions = [];
	
	// Add each triple to the index.
	var pruneTriples = [];
	for (var i = 0; i < this._triples.length; i++) {
	    var triple = this._triples[i];
	    
	    if (this._tripleIndex[triple.subject] == undefined) {
		this._tripleIndex[triple.subject] = new Object();
	    }
	    if (this._tripleIndex[triple.subject][triple.property] == undefined) {
		this._tripleIndex[triple.subject][triple.property] = new Object();
	    }
	    if (this._tripleIndex[triple.subject][triple.property][triple.object] == undefined) {
		this._tripleIndex[triple.subject][triple.property][triple.object] = true;
	    } else {
		// Plan on pruning this triple since it already exists.
		pruneTriples.append(i);
	    }
	}
	
	// Prune redundant triples from this._triples.
	pruneTriples.sort();
	for (var i = pruneTriples.length; i > 0; i--) {
	    this._triples.splice(pruneTriples[i - 1], 1);
	}
	
	if (iri !== undefined) {
	    /**
	     * @private
	     * The IRI serving as the name of the graph in the environment.
	     * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-NamedNode">NamedNode</a>
	     */
	    this._iri = iri;
	    /**
	     * If true, this graph is persistent, and changes will automatically be persisted.
	     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>
	     */
	    this.persistent = true;
	    
	    // Prepare to populate this._triples.
	    var txn = this._env.db.transaction(['quads'],
					       IDBTransaction.READ_ONLY);
	    var store = txn.objectStore('quads');
	    
	    // First, persist any pre-defined triples.
	    for (var i = 0; i < this._triples.length; i++) {
		store.add(new IRDFQuad(this, this._triples[i]));
	    }
	    
	    // Then load existing triples.
	    var idx = store.index('graph');
	    var range = IDBKeyRange.only(this._iri);
	    
	    /**
	     * @private
	     * The most recent IDBRequest used by the graph.
	     * @type <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBRequest">IDBRequest</a>
	     */
	    this._request = idx.openKeyCursor(range);
	    
	    this._request.onsuccess = function(event) {
		var cursor = event.target.result;
		if (cursor) {
		    // Add each new Triple to the index and array.
		    if (this._tripleIndex[cursor.value.subject] == undefined) {
			this._tripleIndex[cursor.value.subject] = new Object();
		    }
		    if (this._tripleIndex[cursor.value.subject][cursor.value.property] == undefined) {
			this._tripleIndex[cursor.value.subject][cursor.value.property] = new Object();
		    }
		    if (this._tripleIndex[cursor.value.subject][cursor.value.property][cursor.value.object] == undefined) {
			this._triples.push(cursor.value.toTriple());
			this._tripleIndex[cursor.value.subject][cursor.value.property][cursor.value.object] = true;
		    }
		    
		    // And continue.
		    cursor.continue();
		}
	    };
	} else {
	    this._iri = null;
	    this.persistent = false;
	    this._request = null;
	}
    },
    
    /**
     * The number of Triples in this graph.  May be 0 before a persistent graph has finished loading.
     * @field
     * @name IRDFGraph#length
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-unsigned-long">unsigned long</a>, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-length">Graph#length</a>
     */
    get length() {
	return this._triples.length;
    },
    
    /**
     * Add a Triple to the graph.  May not correctly add a Triple before a persistent graph has finished loading.  Graph#request may be monitored following this function call to ensure that the Triple was correctly added to a persistent graph.
     * @param triple {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-Triple">Triple</a>} The Triple to be added to the graph.
     * @return {IRDFGraph} This IRDFGraph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-add">Graph#add</a>
     */
    add: function(triple) {
	// Check the index...
	if (this._tripleIndex[triple.subject] == undefined ||
	    this._tripleIndex[triple.subject][triple.property] == undefined ||
	    this._tripleIndex[triple.subject][triple.property][triple.object] == undefined) {
	    // Add the triple...
	    this._triples.push(triple);
	    
	    // Add to the index too.
	    if (this._tripleIndex[triple.subject] == undefined) {
		this._tripleIndex[triple.subject] = new Object();
	    }
	    if (this._tripleIndex[triple.subject][triple.property] == undefined) {
		this._tripleIndex[triple.subject][triple.property] = new Object();
	    }
	    if (this._tripleIndex[triple.subject][triple.property][triple.object] == undefined) {
		this._tripleIndex[triple.subject][triple.property][triple.object] = true;
	    }
	    
	    // And if we are persistent, try to persist the modification.
	    if (this.persistent) {
		var txn = this._env.db.transaction(['quads'],
						   IDBTransaction.READ_WRITE);
		var store = txn.objectStore('quads');
		
		this._request = store.add(new IRDFQuad(this, triple));
	    }
	    
	    // Run all actions.
	    this.actions.forEach(function(action) {
		action.try(triple);
	    });
	}
	
	return this;
    },
    /**
     * Remove a Triple from the graph.  May not correctly remove a Triple before a persistent graph has finished loading.  Graph#request may be monitored following this function call to ensure that the Triple was correctly removed from a persistent graph.
     * @param triple {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-Triple">Triple</a>} The Triple to be removed from the graph.
     * @return {IRDFGraph} This IRDFGraph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-remove">Graph#remove</a>
     */
    remove: function(triple) {
	// Check the index...
	if (this._tripleIndex[triple.subject] != undefined &&
	    this._tripleIndex[triple.subject][triple.property] != undefined &&
	    this._tripleIndex[triple.subject][triple.property][triple.object] != undefined) {
	    delete this._tripleIndex[triple.subject][triple.property][triple.object];
	    // This is slow. O(n)
	    for (var i = 0; i < this._triples; i++) {
		if (this._triples[i].subject.equals(triple.subject) &&
		    this._triples[i].property.equals(triple.property) &&
		    this._triples[i].object.equals(triple.object)) {
		    this._triples.splice(i, 1);
		}
	    }
	    
	    // And if we are persistent, try to persist the modification.
	    if (this.persistent) {
		var txn = this._env.db.transaction(['quads'],
						   IDBTransaction.READ_WRITE);
		var store = txn.objectStore('quads');
		
		this._request = store.delete(new IRDFQuad(this, triple));
	    }
	}
	
	return this;
    },
    
    /**
     * Return an Array containing the Triples in this graph.  May return an empty Array before a persistent graph has finished loading.
     * @return {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-Triple">[]Triple</a>} The Triples in this graph.  The order of the Triples is arbitrary.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-toArray">Graph#toArray</a>
     */
    toArray: function() {
	return this._triples.slice(0);
    },
    
    /**
     * Existential quantification.  Returns true if at least one Triple in the graph causes a callback to return true.
     * @param callback {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, at least one Triple in the graph caused the callback to return true.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-some">Graph#some</a>
     */
    some: function(callback) {
	return this._triples.some(function(triple) {
	    return ((typeof callback === 'function' &&
		     callback(triple)) ||
		    (callback.test &&
		     typeof callback.test === 'function' &&
		     callback.test(triple)));
	});
    },
    /**
     * Universal quantification.  Returns true if all Triples in the graph cause a callback to return true.
     * @param callback {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, all Triples in the graph caused the callback to return true.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-every">Graph#every</a>
     */
    every: function(callback) {
	return this._triples.every(function(triple) {
	    return ((typeof callback === 'function' &&
		     callback(triple)) ||
		    (callback.test &&
		     typeof callback.test === 'function' &&
		     callback.test(triple)));
	});
    },
    /**
     * Unique existential quantification.  Returns true if exactly one Triple in the graph causes a callback to return true.
     * @param callback {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, exactly one Triple in the graph caused the callback to return true.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-the">Graph#the</a>
     */
    the: function(callback) {
	var count = 0;
	for (var i = 0; i < this._triples.length; i++) {
	    if ((typeof callback === 'function' &&
		 callback(triple)) ||
		(callback.test &&
		 typeof callback.test === 'function' &&
		 callback.test(triple))) {
		count++;
	    }
	    if (count > 1) {
		return false;
	    }
	}
	
	return count == 1;
    },
    
    /**
     * Create a new non-persistent graph containing all Triples which cause a callback to return true.
     * @param filter {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
     * @return {IRDFGraph} The new non-persistent graph containing all Triples in this graph which cause callback to return true.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-filter">Graph#filter</a>
     */
    filter: function(filter) {
	return this.env.createGraph(this._triples.filter(function(triple) {
	    return ((typeof filter === 'function' &&
		     filter(triple)) ||
		    (filter.test &&
		     typeof filter.test === 'function' &&
		     filter.test(triple)));
	}));
    },
    /**
     * Remove all Triples from this graph which cause a callback to return false.
     * @param filter {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
     * @return {IRDFGraph} This IRDFGraph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-apply">Graph#apply</a>
     */
    apply: function(filter) {
	this._triples.slice(0).forEach(function(triple) {
	    if ((typeof filter === 'function' &&
		 filter(triple)) ||
		(filter.test &&
		 typeof filter.test === 'function' &&
		 filter.test(triple))) {
		// Do nothing.
	    } else {
		// This is slow! O(n^2)!
		this.remove(triple);
	    }
	});
	
	return this;
    },
    
    /**
     * Execute a callback once on each Triple in this graph.
     * @param callback {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleCallback">TripleCallback</a>} A callback to execute for each Triple.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-forEach">Graph#forEach</a>
     */
    forEach: function(callback) {
	this._triples.forEach(function(triple) {
	    if (typeof callback === 'function') {
		callback(triple);
	    } else if (callback.run &&
		       typeof callback.run === 'function') {
		callback.run(triple);
	    }
	});
    },
    
    /**
     * Return a new non-persistent graph which is the logical concatenation of this graph and the graph passed as an argument to this function.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>} The graph to take the concatenation of this graph with.
     * @return {IRDFGraph} A new non-persistent graph containing the logical concatenation of this graph and the graph passed as an argument to this function.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-merge">Graph#merge</a>
     */
    merge: function(graph) {
	return this.env.createGraph(this._triples.concat(graph.toArray()));
    },
    /**
     * Concatenate another graph with this graph.  Graph#request will only indicate the status of the addition of a single triple when persisting, rather than all triples in the import.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>} The graph to concatenate with this graph.
     * @return {IRDFGraph} This IRDFGraph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-import">Graph#import</a>
     */
    import: function(graph) {
	var triples = graph.toArray();
	for (var i = 0; i < triples.length; i++) {
	    this.add(triples[i]);
	}
	return this;
    },
    
    /**
     * An array of the actions to run when a Triple is added to the graph.
     * @field
     * @name IRDFGraph#actions
     * @type <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleAction">[]TripleAction</a>
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-actions">Graph#actions</a>
     */
    get actions() {
	return this._actions;
    },
    /**
     * Add a new TripleAction to the set of actions to be run when a Triple is added to the graph.
     * @param action {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleAction">TripleAction</a>} The TripleAction to be added.
     * @param run {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, the action will be run immediately on all existing triples in the graph.
     * @return {IRDFGraph} This IRDFGraph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Graph-addAction">Graph#addAction</a>
     */
    addAction: function(action, run) {
	this._actions.append(action);
	if (run) {
	    this.forEach(action.try);
	}
    },
    
    // indexedRDF-specific functions.
    /**
     * The IRI under which this graph is persisted.
     * @field
     * @name IRDFGraph#iri
     * @type IRDFNamedNode, readonly
     */
    get iri() {
	return this._iri;
    },
    /**
     * The environment in which this graph is persisted.
     * @field
     * @name IRDFGraph#env
     * @type IRDFEnvironment, readonly
     */
    get env() {
	return this._env;
    },
    /**
     * The most recent IDBRequest performed to persist this graph.
     * @field
     * @name IRDFGraph#request
     * @type <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBRequest">IDBRequest</a>, readonly
     */
    get request() {
	return this._request;
    },
    
    /**
     * Return a non-persistent copy of this graph.
     * @return {IRDFGraph} The new non-persistent copy of this graph.
     */
    nonpersistentCopy: function() {
	return this.env.createGraph(this._triples);
    },
    
    /**
     * Persist this graph using the given IRI as its name.  If the graph is already persistent, all future changes to this graph will be persisted under the new IRI.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to name this persistent graph.
     * @param env {IRDFEnvironment, optional} The environment in which to persist this graph.  If not specified, it will be persisted in the environment in which the graph was created.
     * @return {IRDFGraph} This IRDFGraph.
     */
    persist: function(iri, env) {
	this.persistent = true;
	this._iri = this.env.createNamedNode(iri);
	
	if (env == undefined) {
	    env = this._env;
	}
	
	var txn = env.db.transaction(['quads'],
				     IDBTransaction.READ_ONLY);
	var store = txn.objectStore('quads');
	
	// Persist any pre-defined triples.
	for (var i = 0; i < this._triples.length; i++) {
	    store.add(new IRDFQuad(this, this._triples[i]));
	}
    },
    /**
     * Stop persisting this graph and remove its persistence from the environment.  (To simply make this graph nonpersistent without removing it, set IRDFGraph#persistent to false.)
     * @return {IRDFGraph} This IRDFGraph.
     */
    unpersist: function() {
	if (this.persistent && this.iri) {
	    var txn = env.db.transaction(['quads'],
					 IDBTransaction.READ_ONLY);
	    var store = txn.objectStore('quads');
	    
	    // Delete any pre-defined triples.
	    for (var i = 0; i < this._triples.length; i++) {
		store.delete(new IRDFQuad(this, this._triples[i]));
	    }
	}
	this.persistent = false;
	this._iri = null;
    }
};

/**
 * @private
 * @constructor Creates a new IRDFPrefixMap.
 */
var IRDFPrefixMap = function() { IRDFPrefixMap.fn.init.apply(this); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-PrefixMap">PrefixMap</a>.
 * @name IRDFPrefixMap
 */
IRDFPrefixMap.fn = IRDFPrefixMap.prototype = {
    init: function() {
	
    },
    
    /**
     * Get the IRI mapped to a particular prefix.
     * @param prefix {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The prefix to find the mapping for.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of prefix, or null if no resolution is possible.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-get">PrefixMap#get</a>
     */
    get: function(prefix) {
	return this[prefix];
    },
    /**
     * Set the IRI mapped to a particular prefix.
     * @param prefix {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The prefix to be mapped.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be mapped to the prefix.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-set">PrefixMap#set</a>
     */
    set: function(prefix, iri) {
	this[prefix] = iri;
    },
    /**
     * Remove mapping of a particular prefix.
     * @param prefix {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The prefix for which a mapping is to be removed.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-remove">PrefixMap#remove</a>
     */
    remove: function(prefix) {
	delete this[prefix];
    },
    
    // Return NULL?
    // Case sensitivity?
    /**
     * Resolve a CURIE into an IRI.
     * @param curie {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The curie to resolve.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of curie if the prefix is known.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-resolve">PrefixMap#resolve</a>
     */
    resolve: function(curie) {
	curie = curie.split(':', 2);
	if (this[curie[0]] != undefined) {
	    return this[curie[0]] + curie[1]
	} else {
	    return null;
	}
    },
    /**
     * Return the CURIE for a given IRI.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be shrunk into a CURIE.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The CURIE corresponding to iri, or iri if no matching prefix is known.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-shrink">PrefixMap#shrink</a>
     */
    shrink: function(iri) {
	// This is slow!!
	for (var prefix in this) {
	    // Which CURIE to choose?  For now we pick the first.
	    if (this[prefix] &&
                this[prefix].substr &&
                this[prefix].length < iri.length &&
		this[prefix] == iri.substr(0, this[prefix].length)) {
		// This might not be a valid CURIE!
		return prefix + ':' + iri.substr(this[prefix].length);
	    }
	}
	return iri;
    },
    /**
     * Set the default IRI prefix to be used when resolving CURIEs lacking a prefix (e.g. ':this').
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be set as the default prefix.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-setDefault">PrefixMap#setDefault</a>
     */
    setDefault: function(iri) {
	this[''] = iri;
    },
    /**
     * Import the prefixes from another PrefixMap into this PrefixMap.
     * @param prefixes {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-PrefixMap">PrefixMap</a>} The PrefixMap to import.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting prefixes in the PrefixMap will be overridden by those in the imported PrefixMap.
     * @return {IRDFPrefixMap} The instance on which import was called.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-import">PrefixMap#import</a>
     */
    import: function(prefixes, override) {
	for (var prefix in prefixes) {
	    if (prefixes[prefix] &&
		prefixes[prefix].substr &&
		(this[prefix] == undefined || override)) {
		this[prefix] = prefixes[prefix];
	    }
	}
	
	return this;
    },
    /**
     * Import the prefixes defined in a Graph into this PrefixMap.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>} A graph containing triples describing prefix mappings according to the <a href="http://www.w3.org/TR/2010/WD-rdfa-core-20100422/#s_profiles">RDFa Profile</a> specification.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting prefixes in the PrefixMap will be overridden by those in the imported Graph.
     * @return {IRDFPrefixMap} The instance on which importFromGraph was called.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-PrefixMap-importFromGraph">PrefixMap#importFromGraph</a>
     */
    importFromGraph: function(graph, override) {
	// Find all triples of the form "?s rdfa:prefix ?literal"
	var filterPrefixes = new IRDFTripleFilter(function(triple) {
	    return triple.property.equals(RDFA_PREFIX) &&
	           triple.object.interfaceName == 'Literal';
	});
	var prefixGraph = graph.filter(filterPrefixes);
	
	// Add a mapping if we can also find a unique statement
	// "?s rdfa:uri ?uri"
	var addMapping = function(graph, override) {
	    return new IRDFTripleCallback(function(triple) {
		var mappingResource = triple.subject;
		var prefix = triple.object.value;
		
		// If the prefix should be assigned, find the mapping.
		if (this[prefix] == undefined || override) {
		    var checkUnique = new IRDFTripleFilter(function(triple) {
			return triple.subject.equals(mappingResource) &&
			       triple.predicate.equals(RDFA_URI) &&
			       triple.object.interfaceName == 'NamedNode';
		    });
		    var unique = graph.the(checkUnique);
		    
		    // What if it's not unique?
		    if (unique) {
			var uriGraph = graph.filter(checkUnique);
			
			this[prefix] = uriGraph.toArray()[0].object.value;
		    }
		}
	    });
	};
	
	prefixGraph.forEach(addMapping(graph, override));
	
	return this;
    }
};

/**
 * @private
 * @constructor Creates a new IRDFTermMap.
 */
var IRDFTermMap = function() { IRDFTermMap.fn.init.apply(this); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TermMap">TermMap</a>.
 * @name IRDFTermMap
 */
IRDFTermMap.fn = IRDFTermMap.prototype = {
    init: function() {
	
    },
    
    /**
     * Get the IRI mapped to a particular term.
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term to find the mapping for.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of term, or null if no resolution is possible.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-get">TermMap#get</a>
     */
    get: function(term) {
	return this[term];
    },
    /**
     * Set the IRI mapped to a particular term.
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term to be mapped.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be mapped to the term.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-set">TermMap#set</a>
     */
    set: function(term, iri) {
	this[term] = iri;
    },
    /**
     * Remove mapping of a particular term.
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term for which a mapping is to be removed.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-remove">TermMap#remove</a>
     */
    remove: function(term) {
	delete this[term];
    },
    
    // Return NULL?
    // Case sensitivity?
    /**
     * Resolve a term into an IRI.
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term to resolve.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of term if the term is known, otherwise the concatenation of the default value and term (if a default is known), otherwise null.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-resolve">TermMap#resolve</a>
     */
    resolve: function(term) {
        if (this[term] != undefined) {
	    return this[term];
	} else if (this[''] != undefined) {
	    return this[''] + term;
	} else {
	    return null;
	}
    },
    /**
     * Return the term for a given IRI.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be shrunk into a term.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term corresponding to iri, or iri if no matching term is known.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-shrink">TermMap#shrink</a>
     */
    shrink: function(iri) {
	// This is slow!!
	for (var term in this) {
	    // Which term to choose?  For now we pick the first.
	    if (this[term] &&
                this[term].substr &&
                this[term].length == iri.length &&
		this[term] == iri) {
		// This might not be a valid term!
		return term;
	    }
	}
        if (this[''] != undefined &&
            this[''].length < iri.length &&
            this[''] == iri.substr(0, this[''].length)) {
	    return iri.substr(this[''].length);
	}
	return iri;
    },
    /**
     * Set the default IRI prefix to be used when resolving unidentified terms.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be set as the base IRI for terms.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-setDefault">TermMap#setDefault</a>
     */
    setDefault: function(iri) {
	this[''] = iri;
    },
    /**
     * Import the terms from another TermMap into this TermMap.
     * @param terms {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TermMap">TermMap</a>} The TermMap to import.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting terms in the TermMap will be overridden by those in the imported TermMap.
     * @return {IRDFTermMap} The instance on which import was called.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-import">TermMap#import</a>
     */
    import: function(terms, override) {
	for (var term in terms) {
	    if (terms[term] &&
		terms[term].substr &&
		(this[term] == undefined || override)) {
		this[term] = terms[term];
	    }
	}
	
	return this;
    },
    /**
     * Import the terms defined in a Graph into this PrefixMap.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>} A graph containing triples describing term mappings according to the <a href="http://www.w3.org/TR/2010/WD-rdfa-core-20100422/#s_profiles">RDFa Profile</a> specification.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting terms in the TermMap will be overridden by those in the imported Graph.
     * @return {IRDFTermMap} The instance on which importFromGraph was called.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-TermMap-importFromGraph">TermMap#importFromGraph</a>
     */
    importFromGraph: function(graph, override) {
	// Find all triples of the form "?s rdfa:term ?literal"
	var filterTerms = new IRDFTripleFilter(function(triple) {
	    return triple.property.equals(RDFA_TERM) &&
	           triple.object.interfaceName == 'Literal';
	});
	var termGraph = graph.filter(filterTerms);
	
	// Add a mapping if we can also find a unique statement
	// "?s rdfa:uri ?uri"
	var addMapping = function(graph, override) {
	    return new IRDFTripleCallback(function(triple) {
		var mappingResource = triple.subject;
		var term = triple.object.value;
		
		// If the term should be assigned, find the mapping.
		if (this[term] == undefined || override) {
		    var checkUnique = new IRDFTripleFilter(function(triple) {
			return triple.subject.equals(mappingResource) &&
			       triple.predicate.equals(RDFA_URI) &&
			       triple.object.interfaceName == 'NamedNode';
		    });
		    var unique = graph.the(checkUnique);
		    
		    // What if it's not unique?
		    if (unique) {
			var uriGraph = graph.filter(checkUnique);
			
			this[term] = uriGraph.toArray()[0].object.value;
		    }
		}
	    });
	};
	
	termGraph.forEach(addMapping(graph, override));
	
	return this;
    }
};

/**
 * @private
 * @constructor Creates a new IRDFProfile.
 * @param base {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The base IRI of the new profile.
 */
var IRDFProfile = function(base) { IRDFProfile.fn.init.apply(this, [base]); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Profile">Profile</a>.
 * @name IRDFProfile
 */
IRDFProfile.fn = IRDFProfile.prototype = {
    init: function(base) {
	/**
	 * The base IRI used to resolve relative IRIs in the profile.
	 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>
	 * @default null
	 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-base">Profile#base</a>
	 */
	this.base = null;
	if (base !== undefined) {
	    this.base = base;
	}
	
	/**
	 * @private
	 * The IRDFPrefixMap of the profile.
	 * @type IRDFPrefixMap
	 */
	this._prefixes = new IRDFPrefixMap();
	/**
	 * @private
	 * The IRDFTermMap of the profile.
	 * @type IRDFTermMap
	 */
	this._terms = new IRDFTermMap();
    },
    
    /**
     * The mapping of RDF prefix strings to base IRIs in the profile.
     * @field
     * @name IRDFProfile#prefixes
     * @type IRDFPrefixMap, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-prefixes">Profile#prefixes</a>
     */
    get prefixes() {
	return this._prefixes;
    },
    /**
     * The mapping of terms to IRIs in the profile.
     * @field
     * @name IRDFProfile#terms
     * @type IRDFTermMap, readonly
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-terms">Profile#terms</a>
     */
    get terms() {
	return this._terms;
    },
    
    // How does this resolve a relative IRI?  Should prefixes resolve return NU??
    /**
     * Resolve a Term, CURIE, or Relative-IRI into an absolute IRI.
     * @param toresolve {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The Term, CURIE, or Relative-IRI to resolve.
     * @return {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The resolved value of toresolve, or toresolve if no resolution is possible.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-resolve">Profile#resolve</a>
     */
    resolve: function(toresolve) {
	var resolved;
	
	resolved = this.terms.resolve(toresolve);
	if (resolved == null) {
	    resolved = this.prefixes.resolve(toresolve);
	}
	
	if (this.base !== null) {
	    return resolveIRI(this.base, resolved);
	} else {
	    return resolved;
	}
    },
    
    /**
     * Set the default vocabulary to be used to resolve unknown terms.
     * It is identical to calling IRDFProfile#terms#setDefault(iri).
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be used as the default vocabulary.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setDefaultVocabulary">Profile#setDefaultVocabulary</a>
     */
    setDefaultVocabulary: function(iri) {
	this.terms.setDefault(iri);
    },
    /**
     * Set the default prefix to be used to resolve CURIEs which lack one.
     * It is identical to calling IRDFProfile#prefixes#setDefault(iri).
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be used as the default prefix.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setDefaultPrefix">Profile#setDefaultPrefix</a>
     */
    setDefaultPrefix: function(iri) {
	this.prefixes.setDefault(iri)
    },
    /**
     * Associate an IRI with a term.
     * It is identical to calling IRDFProfile#terms#set(term, iri).
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The term to set. Must be a valid NCName.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be associated with the term.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setTerm">Profile#setTerm</a>
     */
    setTerm: function(term, iri) {
	this.terms.set(term, iri);
    },
    /**
     * Associate an IRI with a prefix.
     * It is identical to calling IRDFProfile#prefixes#set(term, iri).
     * @param term {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The prefix to set. Must be a valid NCName.
     * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI to be associated with the prefix.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-setPrefix">Profile#setPrefix</a>
     */
    setPrefix: function(prefix, iri) {
	this.prefixes.set(prefix, iri);
    },
    /**
     * Import the terms and prefixes from another profile into this Profile.
     * @param profile {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Profile">Profile</a>} The Profile to import.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting terms and prefixes in the profile will be overridden by those in the imported Profile.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-importProfile">Profile#importProfile</a>
     */
    importProfile: function(profile, override) {
	this.prefixes.import(profile.prefixes, override);
	this.terms.import(profile.terms, override);
    },
    /**
     * Import the terms and prefixes defined in a Graph into this Profile.
     * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>} A graph containing triples describing term and prefix mappings according to the <a href="http://www.w3.org/TR/2010/WD-rdfa-core-20100422/#s_profiles">RDFa Profile</a> specification.
     * @param override {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>} If true, conflicting terms and prefixes in the profile will be overridden by those in the imported Graph.
     * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-Profile-importProfileFromGraph">Profile#importProfileFromGraph</a>
     */
    importProfileFromGraph: function(graph, override) {
	this.prefixes.importFromGraph(graph, override);
	this.terms.importFromGraph(graph, override);
    }
};

/**
 * @private
 * @constructor Creates a new IRDFEnvironment with the specified indexedDB backing store.
 * @param db {<a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBDatabase">IDBDatabase</a>} The indexedDB database to use as a backing store for the IRDFEnvironment.
 */
var IRDFEnvironment = function(db) { IRDFEnvironment.fn.init.apply(this, [db]); };

/**
 * @class Implements <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFEnvironment">RDFEnvironment</a>.
 * @name IRDFEnvironment
 * @augments IRDFProfile
 */
IRDFEnvironment.prototype = new IRDFProfile();
IRDFEnvironment.prototype.init = function(db) {
    IRDFProfile.prototype.init.apply(this);
    
    /**
     * @private
     * The indexedDB backing store.
     * @type <a href="http://www.w3.org/TR/IndexedDB/#idl-def-IDBDatabase">IDBDatabase</a>
     */
    this.db = db;
    /**
     * @private
     * An internal counter for generating blank node values.
     * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-integer">integer</a>
     */
    this.bnodeCounter = 1;
};

/**
 * The name of the environment's store.
 * @field
 * @name IRDFEnvironment#name
 * @type <a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, readonly
 * @see <a href="http://www.w3.org/TR/IndexedDB/#widl-IDBDatabase-name">IDBDatabase#name</a>
 */
IRDFEnvironment.prototype.__defineGetter__('name', function() {
    return this.db.name;
});

/**
 * Create a new blank node in the environment.
 * @return {IRDFBlankNode} The new blank node.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createBlankNode">RDFEnvironment#createBlankNode</a>
 */
IRDFEnvironment.prototype.createBlankNode = function() {
    return new IRDFBlankNode('bnode' + (this.bnodeCounter++));
};

/**
 * Create a new named node in the environment.
 * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The lexical value of the IRI of the node to create.
 * @return {IRDFNamedNode} The new named node.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createNamedNode">RDFEnvironment#createNamedNode</a>
 */
IRDFEnvironment.prototype.createNamedNode = function(iri) {
    return new IRDFNamedNode(iri);
};

// What are the supported datatypes?
/**
 * Create a new literal in the environment.
 * @param value {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-any">any</a>} The value of the literal.  The value must respond to toString().
 * @param language {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The language code associated with the literal, specified according to <a href="http://tools.ietf.org/rfc/bcp/bcp47.txt">BCP47</a>.
 * @param datatype {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The datatype associated with the literal.  This value may be specified as a full IRI or CURIE.
 * @return {IRDFLiteral} The new literal.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createLiteral">RDFEnvironment#createLiteral</a>
 */
IRDFEnvironment.prototype.createLiteral = function(value, language, datatype) {
    return new IRDFLiteral(value, language, this.createNamedNode(datatype));
};

/**
 * Create a new graph literal in the environment.
 * @param graph {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Graph">Graph</a>, optional} The graph represented by the graph literal.  If not specified, an empty graph will be created.
 * @return {IRDFGraphLiteral} The new graph literal.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createGraphLiteral">RDFEnvironment#createGraphLiteral</a>
 */
IRDFEnvironment.prototype.createGraphLiteral = function(graph) {
    return new IRDFGraphLiteral(graph);
};

/**
 * Create a new triple in the environment.
 * @param subject {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to be used as the subject of the triple.
 * @param property {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to be used as the property of the triple.
 * @param object {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-RDFNode">RDFNode</a>} The node to be used as the object of the triple.
 * @return {IRDFTriple} The new triple.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createTriple">RDFEnvironment#createTriple</a>
 */
IRDFEnvironment.prototype.createTriple = function(subject, property, object) {
    return new IRDFTriple(subject, property, object);
};

/**
 * Create a new graph in the environment.
 * @param triples {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-Triple">[]Triple</a>, optional} An array of Triples to be added to the created graph.
 * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} If specified, the graph will be made persistent with the specified IRI as its name.
 * @return {IRDFGraph} The new graph.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createGraph">RDFEnvironment#createGraph</a>
 */
IRDFEnvironment.prototype.createGraph = function(triples, iri) {
    if (iri == undefined) {
	return new IRDFGraph(this, triples);
    } else {
	return new IRDFGraph(this, triples, this.createNamedNode(iri));
    }
};

/**
 * Create a new action in the environment.
 * @param test {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleFilter">TripleFilter</a>} A filter against which to test Triples.
 * @param action {<a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#idl-def-TripleCallback">TripleCallback</a>} A callback action to run for each Triple which passes the test.
 * @return {IRDFTripleAction} The new triple action.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createAction">RDFEnvironment#createAction</a>
 */
IRDFEnvironment.prototype.createAction = function(test, action) {
    return new IRDFTripleAction(test, action);
};

/**
 * Create a new profile in the environment.
 * @param base {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>, optional} The IRI to use as the base IRI of the new profile.
 * @param empty {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>, optional} If true, then the new profile will contain an empty TermMap and PrefixMap.  Otherwise, the current environment's TermMap and PrefixMaps will be copied to the new profile.
 * @return {IRDFProfile} The new profile.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createProfile">RDFEnvironment#createProfile</a>
 */
IRDFEnvironment.prototype.createProfile = function(base, empty) {
    var profile = new IRDFProfile(base);
    if (empty !== true) {
	profile.importProfile(this, true);
    }
    
    return profile;
};

/**
 * Create a new term map in the environment.
 * @param empty {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>, optional} If true, then an empty TermMap will be returned.  Otherwise, a copy of the current environment's TermMap will be returned.
 * @return {IRDFTermMap} The new term map.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createTermMap">RDFEnvironment#createTermMap</a>
 */
IRDFEnvironment.prototype.createTermMap = function(empty) {
    var map = new IRDFTermMap();
    if (empty !== true) {
	map.import(this.terms);
    }
    
    return map;
};

/**
 * Create a new prefix map in the environment.
 * @param empty {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-boolean">boolean</a>, optional} If true, then an empty PrefixMap will be returned.  Otherwise, a copy of the current environment's PrefixMap will be returned.
 * @return {IRDFPrefixMap} The new prefix map.
 * @see <a href="http://www.w3.org/2010/02/rdfa/sources/rdf-api/#widl-RDFEnvironment-createPrefixMap">RDFEnvironment#createPrefixMap</a>
 */
IRDFEnvironment.prototype.createPrefixMap = function(empty) {
    var map = new IRDFPrefixMap();
    if (empty !== true) {
	map.import(this.prefixes);
    }
    
    return map;
};

/**
 * Retrieve a persistent IRDFGraph having the specified IRI as a name.
 * @param iri {<a href="http://dev.w3.org/2006/webapi/WebIDL/#idl-DOMString">DOMString</a>} The IRI of the persistent IRDFGraph being retrieved.
 * @return {IRDFGraph} The persistent IRDFGraph having iri as its name, or null if iri is not the name of any known graph.
 */
IRDFEnvironment.prototype.retrieveGraph = function(iri) {
    return new IRDFGraph(this, [], this.createNamedNode(iri));
};

/**
 * Close the current environment.
 */
IRDFEnvironment.prototype.close = function() {
    this.db.close();
};

IRDFEnvironment.fn = IRDFEnvironment.prototype;

/**
 * @private
 * @constructor Creates an EventListenerWrapper
 */
var EventListenerWrapper = function() { EventListenerWrapper.fn.init.apply(this); };

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
var IRDFRequest = function(idbRequest) { IRDFRequest.fn.init.apply(this, [idbRequest]); };

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
			    if (typeof listener === 'function') {
				listener(evt);
			    } else if (listener.handleEvent != undefined &&
				       typeof listener.handleEvent === 'function') {
				listener.handleEvent(evt);
			    }
			} catch (exc) {
			}
		    }
		}
		if (this.eventListeners[evt.type][false] != undefined) {
		    for (var i = 0; i < this.eventListeners[evt.type][false].length; i++) {
                        var listener = this.eventListeners[evt.type][false][i];
			try {
			    if (typeof listener === 'function') {
				listener(evt);
			    } else if (listener.handleEvent != undefined &&
				       typeof listener.handleEvent === 'function') {
				listener.handleEvent(evt);
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
	var db = null;
	
	idbRequest.onsuccess = function(evt) {
	    if (db == null) {
		db = idbRequest.result;
	    }
	    
	    if (db.version != '0.1') {
		// Initialize the store.
		var newRequest = db.setVersion('0.1');
		var oldSuccess = idbRequest.onsuccess;
		var oldError = idbRequest.onerror;
		
		newRequest.onsuccess = function(event) {
		    // Create the objectStore for quads.
		    var objectStore = db.createObjectStore('quads', { keyPath: '_trig' });
		    
		    objectStore.createIndex('graph', 'graph', { unique: false });
		    oldSuccess(event);
		}
		newRequest.onerror = function(event) {
		    db.close();
		    oldError(event);
		};
		
		idbRequest = newRequest;
	    } else {
		var irdfEvent = new Object();
		
		irdfEvent.source = irdfRequest;
		irdfEvent.result = new IRDFEnvironment(db);
		
		if (irdfRequest.onsuccess &&
		    typeof(irdfRequest.onsuccess) == 'function') {
		    irdfRequest.onsuccess(irdfEvent);
		} else {
		    irdfEvent.result.close();
		}
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
 * The IRDFEnvironment class (for reference to IRDFEnvironment constants).
 * @name window#IRDFEnvironment
 */
window.IRDFEnvironment = IRDFEnvironment;

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