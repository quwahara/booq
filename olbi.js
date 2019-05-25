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

    // Object.defineProperty property
    var dp = Object.defineProperty.bind(Object);

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

    var Lbi = function Lbi() {

      dp(this, "___r", (function (privates) {
        return {
          enumerable: false,
          get: function () {
            return privates;
          }
        };
      })(
        // privates instance
        {
          self: this,
          chain: this,
          ecol: null,
        }));
    };

    // Link bind
    Lbi.prototype = {
      link: function (selector) {
        var privates = this.___r;
        privates.ecol = new Ecol(selector);
        return privates.chain;
      },
    };

    Lbi.prototype.constructor = Lbi;

    // Object link bind
    var Olbi = function Olbi(structure, opts) {
      this.___lbi();

    };

    Olbi.prototype = objectAssignDeep({
      ___lbi: Lbi.prototype.constructor,
    },
      Lbi.prototype);

    Olbi.prototype.constructor = Olbi;

    Olbi.objectAssignDeep = objectAssignDeep;

    return Olbi;
  })();

});