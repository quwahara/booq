(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // <script>
    Trax = definition();
    console.log(">3");
    console.log(Trax);
  }
})(function () {
  'use strict';
  return (function () {

    var ridMin, ridMax, repos, Trax;
    ridMin = 100000000000000;
    ridMax = ridMin * 10 - 1;

    function isString(v) {
      return (typeof v) === "string";
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
    }

    function isFunction(fun) {
      return fun && {}.toString.call(fun) === '[object Function]';
    }

    function isPrimitive(v) {
      if (v == null) return false;
      var t = typeof v;
      return t === "string" || t === "number" || t === "boolean";
    }

    function rid() {
      return "_" + (Math.floor(Math.random() * (ridMax - ridMin + 1)) + ridMin).toString(10);
    }

    function mergeRid(obj) {
      if (!obj._rid) {
        obj._rid = rid();
      }
      return obj;
    }

    function isInputValue(elem) {
      if (!elem || elem.tagName !== "INPUT") return false;
      if (elem.type && elem.type === "text") return true;
      return false;
    }

    function toArray(arrayLike) {
      var i, array = [];
      for (i = 0; i < arrayLike.length; i++) {
        if (arrayLike.item) {
          array.push(arrayLike.item(0));
        } else {
          array.push(arrayLike[i]);
        }
      }
      return array;
    }

    function ensureElements(queryOrElems) {
      var i, elems2, spls, spl, elem2, tmpElems;
      
      if (queryOrElems instanceof HTMLElement) {
        return [queryOrElems];
      }

      if (queryOrElems instanceof HTMLCollection) {
        return toArray(queryOrElems);
      }

      if (!isString(queryOrElems)) {
        throw Error("The elems was not supported type");
      }

      elems2 = [];
      spls = queryOrElems.trim().split(/\s/);
      for (i = 0; i < spls.length; i++) {
        spl = spls[i];
        if (spl.indexOf("#") == 0) {
          elem2 = document.getElementById(spl.substr(1));
          if (elem2) {
            elems2.push(elem2);
          }
        } else if (spl.indexOf(".") === 0) {
          tmpElems = document.getElementsByClassName(spl.substr(1));
          if (tmpElems) {
            elems2 = [].concat(elems2, toArray(tmpElems));
          }
        } else if ((/[\w]+/).text(spl)) {
          tmpElems = document.etElementsByTagName(spl);
          if (tmpElems) {
            elems2 = [].concat(elems2, toArray(tmpElems));
          }
        } else {
          throw Error("The elems was not supported format");
        }
      }
      return elems2;
    }

    repos = {};

    Trax = function Trax(decl) {
      var r;
      r = repos[mergeRid(this)._rid] = {};
      r.doc = document;
      r.decl = decl;
      // property infos
      r.pis = {};
      this.initDecl(r);
    };
    (function (P) {

      P.initDecl = function (r) {
        var decl, pi;
        decl = r.decl;
        for (var name in decl) {
          if (!decl.hasOwnProperty(name)) continue;
          pi = preparePropInfo(r, name);
          preparePrimitiveProp(this, pi);
        }
      };

      function preparePropInfo(r, propName) {
        var pi = mergeRid({
          decl: r.decl,
          propName: propName,
          value: r.decl[propName],
          // setter infos
          sis: [],
          cast: function (event) {
            var sis, si, i, len;
            sis = this.sis;
            len = sis.length;
            for (i = 0; i < len; ++i) {
              si = sis[i];
              if (si._rid === event.target._rid) continue;
              si.setter(event);
            }
          },
          setValue: function (v) {
            this.value = v;
            this.decl[this.propName] = v;
          },
          setter: function (event) {
            this.setValue(event.target.value);
          },
          addSetterInfo: function (si) {
            this.sis.push(si);
          },
        });
        pi.addSetterInfo(pi);
        r.pis[propName] = pi;
        return pi;
      }

      function preparePrimitiveProp(self, pi) {
        (function (self, pi) {
          Object.defineProperty(self, pi.propName, {
            get: function () {
              return pi.value;
            },
            set: function (value) {
              if (pi.value === value) return;
              pi.setValue(value);
              pi.cast({ target: pi });
            }
          });
        })(self, pi);
      }

      // transmit object property value to DOM element
      P.tx = function (propName, qryOrElems) {
        var r, pi, elems, i;
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        r = repos[this._rid];
        pi = r.pis[propName];
        if (!pi) {
          throw new Error("No property of '" + propName + "'");
        }
        elems = ensureElements(qryOrElems);
        for (i = 0; i < elems.length; i++) {
          pi.addSetterInfo(prepareSetterInfo(elems[i]));
        }
      };

      function prepareSetterInfo(elem) {
        var setter;
        // Switch setterFunction depending on the elemnt type
        if (isInputValue(elem)) {
          setter = function (event) {
            this.elem.value = event.target.value;
          };
        } else {
          setter = function (event) {
            this.elem.textContent = event.target.value;
          };
        }
        return {
          _rid: mergeRid(elem)._rid,
          elem: elem,
          setter: setter,
        };
      }

      P.trx = function (propName) {
        var self = this, doc, elem, elemRid, elemSi, r, pi;
        r = repos[self._rid];
        if (!r || !r.doc) return false;
        doc = r.doc;
        elem = doc.getElementById(propName);
        if (!elem) return false;

        elemRid = mergeRid(elem)._rid;
        // Switch setterFunction depending on the elemnt type
        if (isInputValue(elem)) {
          elemSi = {
            _rid: elemRid,
            elem: elem,
            setter: function (event) {
              this.elem.value = event.target.value;
            },
          };
        } else {
          elemSi = {
            _rid: elemRid,
            elem: elem,
            setter: function (event) {
              this.elem.textContent = event.target.value;
            },
          };
        }
        if (true) {
          elemSi = {
            _rid: elemRid,
            elem: elem,
            setter: function (event) {
              this.elem.value = event.target.value;
            },
          };
        }
        pi = r.pis[propName];
        if (elemSi && pi) {
          pi.addSetterInfo(elemSi);
        }
        (function (pi) {
          elem.addEventListener("change", function (event) {
            pi.cast(event);
          });
        })(pi);
      };

    })(Trax.prototype);

    return Trax;
  })();

});