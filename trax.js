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
    console.log(">>");
    console.log(Trax);
  }
})(function () {
  'use strict';
  return (function () {

    var ridMin, ridMax, repos, Trax;
    ridMin = 100000000000000;
    ridMax = ridMin * 10 - 1;

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
            for (var i = 0; i < len; ++i) {
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

      P.rx = function (propName, elemId) {
        var elem, elemRid, elemSi, r, pi;
        r = repos[this._rid];
        elem = r.doc.getElementById(elemId);
        if (!elem) return false;

        elemRid = mergeRid(elem)._rid;
        elemSi = {
          _rid: elemRid,
          elem: elem,
        };
        // Switch setterFunction depending on the elemnt type
        if (isInputValue(elem)) {
          elemSi.setter = function (event) {
            this.elem.value = event.target.value;
          };
        } else {
          elemSi.setter = function (event) {
            this.elem.textContent = event.target.value;
          };
        }
        pi = r.pis[propName];
        if (pi) {
          pi.addSetterInfo(elemSi);
        }
      }

      P.trxOn = function (eventType, propName) {
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
          elem.addEventListener(eventType, function (event) {
            pi.cast(event);
          });
        })(pi);
      };

    })(Trax.prototype);

    return Trax;
  })();

});