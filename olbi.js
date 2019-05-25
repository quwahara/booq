(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // script
    Olbi = definition();
  }
})(function () {
  'use strict';
  return (function () {


    function isArray(v) {
      return Array.isArray(v);
    }

    function isInt(v) {
      return v === parseInt(v, 10);
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
    }

    function isString(v) {
      return typeof v === "string";
    }

    function clone(value) {

      if (isObject(value)) {
        return cloneObject(value);
      }

      if (isArray(value)) {
        return cloneArray(value);
      }

      return value;
    }

    function cloneArray(array) {
      return array.map(clone);
    }

    function cloneObject(object) {
      var theClone = {};
      for (var key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) {
          continue;
        }
        theClone[key] = clone(object[key]);
      }
      return theClone;
    }

    /**
     * 
     * @param {Object} target 
     * @param {Array} sources 
     * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
     * @see https://github.com/saikojosh/Object-Assign-Deep
     */
    function objectAssignDeep(target, sources) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var target2 = Object(target);

      for (var i = 1; i < arguments.length; ++i) {
        var source = arguments[i];

        if (source == null) {
          continue;
        }

        for (var key in source) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (!Object.prototype.hasOwnProperty.call(source, key)) {
            continue;
          }

          var sVal = source[key];
          var tVal = target2[key];
          var sValClone;

          if (isObject(sVal)) {
            sValClone = cloneObject(sVal);
            if (isObject(tVal)) {
              target2[key] = objectAssignDeep(tVal, sValClone);
            } else {
              target2[key] = sValClone;
            }
            continue;
          }

          if (isArray(sVal)) {
            sValClone = cloneArray(sVal);
            if (isArray(tVal)) {
              target2[key] = tVal.concat(sValClone);
            } else {
              target2[key] = sValClone;
            }
            continue;
          }

          target2[key] = sVal;
        }

      }
      return target2;
    }

    // Object.defineProperty alias
    var dp = Object.defineProperty.bind(Object);

    // Define read only property
    function dpReadOnly(object, name, value, enumerable) {
      dp(object, name, {
        enumerable: !!enumerable,
        get: (function (value) {
          return function () {
            return value;
          };
        })(value),
      });
    }

    function toArray(elementList) {
      return Array.prototype.slice.call(elementList);
    }

    // Element collection
    var Ecol = function Ecol(arg) {
      this.elems = [document];

      if (isString(arg)) {
        this.query(arg);
      }

    };

    Ecol.prototype = {
      query: function (selector) {
        var newElems = [];
        for (var i = 0; i < this.elems.length; ++i) {
          newElems = newElems.concat(toArray(this.elems[i].querySelectorAll(selector)));
        }
        this.elems = newElems;
        return this;
      },
    };

    var preferreds = {
      get CLASS() { return "CLASS"; },
      get ID() { return "ID"; },
      get NAME() { return "NAME"; },
      get NTH_CHILD() { return "NTH_CHILD"; },
      get DOWN_AND_CLASS() { return "DOWN_AND_CLASS"; },
      get DOWN_AND_ID() { return "DOWN_AND_ID"; },
      get DOWN_AND_NAME() { return "DOWN_AND_NAME"; },
      get DOWN_AND_NTH_CHILD() { return "DOWN_AND_NTH_CHILD"; },
    };



    //
    // Link bind
    //
    var Lbi = function Lbi(struct, opts, name, parent) {

      // privates
      dpReadOnly(this, "___r",
        objectAssignDeep(
          {
            self: this,
            chain: this,
            collected: false,
            ecol: new Ecol(),
            struct: struct,
            name: name || "",
            parent: parent || null,
            toPreferred: preferreds.CLASS,
            withPreferred: preferreds.NAME,
          },
          opts
        ),
      /* enumerable */ false);

      dp(this, "elems",
        {
          enumerable: false,
          get: function () {
            return this.___r.ecol.elems;
          }
        });

    };

    Lbi.prototype = {

      setToPreferred: function (preferred) {
        this.___r.toPreferred = preferred;
        return this;
      },
      getToPreferred: function () {
        return this.___r.toPreferred;
      },
      setWithPreferred: function (preferred) {
        this.___r.withPreferred = preferred;
        return this;
      },
      getWithPreferred: function () {
        return this.___r.withPreferred;
      },

      preferredSelector: function (preferred, appending) {

        var privates = this.___r;
        var p = preferred;
        var ps = preferreds;
        var a = appending || "";

        var name = privates.name;

        if (p === ps.CLASS) {
          if (!name) return a;
          return "." + name + a;
        }

        if (p === ps.ID) {
          if (!name) return a;
          return "#" + name + a;
        }

        if (p === ps.NAME) {
          if (!name) return a;
          return "[name='" + name + "']" + a;
        }

        if (p === ps.NTH_CHILD) {
          if (!isInt(privates.index) || privates.index < 0) {
            return a;
          }
          return ">*:nth-child(" + (privates.index + 1) + ")" + a;
        }

        if (p === ps.DOWN_AND_CLASS) {
          if (!name) return a;
          return " ." + name + a;
        }

        if (p === ps.DOWN_AND_ID) {
          if (!name) return a;
          return " #" + name + a;
        }

        if (p === ps.DOWN_AND_NAME) {
          if (!name) return a;
          return " [name='" + name + "']" + a;
        }

        if (p === ps.DOWN_AND_NTH_CHILD) {
          if (!isInt(privates.index) || privates.index < 0) {
            return a;
          }
          return " >*:nth-child(" + (privates.index + 1) + ")" + a;
        }

        throw Error("Unsupported preferred");

      },

      fullPreferredSelector: function (preferred, appending) {

        var privates = this.___r;

        // collect all parents
        var parents = [];
        var parent = privates.parent;
        while (parent) {
          parents.splice(0, 0, parent);
          parent = parent.___r.parent;
        }

        var selector = "";

        for (var i = 0; i < parents.length; ++i) {

          parent = parents[i];

          selector += parent.preferredSelector(parent.___r.toPreferred);
        }

        selector += this.preferredSelector(preferred, appending);

        return selector;
      },

      link: function (selector) {
        var privates = this.___r;
        privates.ecol.query(selector);
        privates.collected = true;
        return this;
      },

      preferredLink: function (preferred, appending) {
        var selector = this.fullPreferredSelector(preferred, appending);
        return this.link(selector);
      },

    };

    Lbi.prototype.constructor = Lbi;



    //
    // Object link bind
    //
    var Olbi = function Olbi(struct, opts, name, parent) {
      this.___lbi(struct, opts, name, parent);

      for (var propName in struct) {
        if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
          continue;
        }

        // ignore "___", because of reserved word
        if (propName === "___") continue;

        var value = struct[propName];

        if (isObject(value)) {
          dpReadOnly(this, propName, new Olbi(value, opts, propName, this), /* enumerable */ true);
          continue;
        }

        dpReadOnly(this, propName, new Plbi(value, opts, propName, this), /* enumerable */ true);


      }

    };

    Olbi.prototype = objectAssignDeep({
      ___lbi: Lbi.prototype.constructor,
    },
      Lbi.prototype);

    Olbi.prototype.constructor = Olbi;

    dpReadOnly(Olbi, "preferreds", preferreds, /* enumerable */ true);



    //
    // Primitive link bind
    //
    var Plbi = function Plbi(struct, opts, name, parent) {

      var popts = objectAssignDeep(
        {
          toPreferred: preferreds.DOWN_AND_CLASS,
          withPreferred: preferreds.DOWN_AND_NAME,
        },
        opts
      );

      this.___lbi(struct, popts, name, parent);
    };

    Plbi.prototype = objectAssignDeep({
      ___lbi: Lbi.prototype.constructor,
    },
      Lbi.prototype);

    Plbi.prototype.constructor = Plbi;



    Olbi.objectAssignDeep = objectAssignDeep;

    return Olbi;
  })();

});