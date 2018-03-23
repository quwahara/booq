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
    console.log(Trax.release);
  }
})(function () {
  'use strict';
  return (function () {

    var ridMin, ridMax, repos, Trax, List, arrayByDecl;
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

    function map(ary, fun) {
      var i, len, ary2 = [];
      for (i = 0, len = ary.length; i < len; i++) {
        ary2.push(fun(ary[i]));
      }
      return ary2;
    }

    function mapByProp(target, fun, thisArg) {
      var name;
      for (name in target) {
        if (!target.hasOwnProperty(name)) continue;
        fun.call(thisArg, name, target[name], target);
      }
      return target;
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

    function parseQryOrElems(qryOrElems) {
      var i, ees, qryEvtSpls, qryEvt, elem2, qry, evt, tmpElems;

      // element and eventType
      function ee(elem, eventType) {
        eventType = eventType || "change";
        return {
          elem: elem,
          eventType: eventType,
        };
      }

      // element and eventType callback
      function eec(eventType) {
        return function (elem) {
          return ee(elem, eventType);
        };
      }
      
      if (qryOrElems instanceof HTMLElement) {
        return [ee(qryOrElems)];
      }

      if (qryOrElems instanceof HTMLCollection) {
        return map(toArray(qryOrElems), ee);
      }

      if (!isString(qryOrElems)) {
        throw Error("The elems was not supported type");
      }

      ees = [];
      qryEvtSpls = qryOrElems.trim().split(/\s/);
      for (i = 0; i < qryEvtSpls.length; i++) {
        qryEvt = qryEvtSpls[i].split("@", 2);
        qry = qryEvt[0];
        evt = qryEvt[1];
        if (qry.indexOf("#") == 0) {
          elem2 = document.getElementById(qry.substr(1));
          if (elem2) {
            ees.push(ee(elem2, evt));
          }
        } else if (qry.indexOf(".") === 0) {
          tmpElems = document.getElementsByClassName(qry.substr(1));
          if (tmpElems) {
            ees = [].concat(ees, map(toArray(tmpElems), eec(evt)));
          }
        } else if ((/[\w]+/).test(qry)) {
          tmpElems = document.getElementsByTagName(qry);
          if (tmpElems) {
            ees = [].concat(ees, map(toArray(tmpElems), eec(evt)));
          }
        } else {
          throw Error("The query was not supported format");
        }
      }
      return ees;
    }

    repos = {};

    function setRepo(target, repo) {
      repos[target._rid] = repo;
      return repo;
    }

    function mergeRepo(target, repo) {
      var t2, r2, r3;
      t2 = mergeRid(target);
      r2 = repos[t2._rid];
      if (r2) return r2;
      r3 = repo || {};
      repos[ t2._rid] = r3;
      return r3;
    }

    function getRepo(target) {
      return repos[target._rid];
    }

    List = function (arrayHasDecl) {
      var decl, r;
      decl = arrayHasDecl.splice(0, arrayHasDecl.length)[0];
      r = repos[mergeRid(this)._rid] = {
        sis: [],
        cast: function (event) {
          var sis, si, i, len;
          sis = this.sis;
          len = sis.length;
          console.log("casted");
          // for (i = 0; i < len; ++i) {
          //   si = sis[i];
          //   if (si._rid === event.target._rid) continue;
          //   si.setter(event);
          // }
        },
        setValue: function (v) {
          // this.value = v;
          // this.decl[this.propName] = v;
        },
        setter: function (event) {
          console.log(event);
          // this.setValue(event.target.value);
        },
        addSetterInfo: function (si) {
          this.sis.push(si);
        },
        decl: decl,
        value: arrayHasDecl,
      };
      this.initDecl(r);
    };
    (function (P) {

      P.initDecl = function (r) {
      };

      P.createItem = function () {
        var r;
        r = repos[mergeRid(this)._rid];
        return new Trax(deepClone(r.decl));
      };

      P.push = function (item) {
        var r;
        r = repos[mergeRid(this)._rid];
        r.value.push(item);
        console.log("List push");
        r.pi.cast({ target: this });
      };

    })(List.prototype);

    Trax = function Trax(decl) {
      var r;
      if (!isObject(decl)) {
        throw Error("decl must be an Object");
      }
      r = repos[mergeRid(this)._rid] = {};
      r.doc = document;
      r.decl = decl;
      // property infos
      r.pis = {};
      this.initDecl(r);
    };
    (function (P) {

      P.initDecl = function (r) {
        var decl, name, v, pi, ls;
        decl = r.decl;
        for (name in decl) {
          if (!decl.hasOwnProperty(name)) continue;
          v = decl[name];
          if (isPrimitive(v)) {
            pi = preparePropInfo(r, name);
            preparePrimitiveProp(this, pi);
          } else if (Array.isArray(v)) {
            ls = new List(v);
            pi = prepareListPropInfo(r, name, ls);
            preparePrimitiveProp(this, pi);
          }
        }
      };

      function preparePropInfo(r, propName) {
        var pi = mergeRid({
          isPrimitive: true,
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
            enumerable: true,
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

      function prepareListPropInfo(r, propName, value) {
        var pi, listRepo;
        pi = mergeRid({
          isArray: true,
          decl: r.decl,
          propName: propName,
          value: value,
          // setter infos
          sis: [],
          cast: function (event) {
            console.log("cast in listPropInfo");
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
            console.log("setValue in listPropInfo");
          },
          setter: function (event) {
            console.log("setter in listPropInfo");
          },
          addSetterInfo: function (si) {
            this.sis.push(si);
          },
        });
        pi.addSetterInfo(pi);
        r.pis[propName] = pi;
        listRepo = repos[value._rid];
        listRepo.pi = pi;
        
        return pi;
      }

      function setterInfo(elem) {
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

      function removeAllChild(parent) {
        while (parent.firstChild) {
          parent.removeChild(parent.firstChild);
        }
        return parent;
      }

      function setterInfoForArray(elem) {
        console.log("setterInfoForArray call");
        var r, si, parentNode, importNode, setter;

        parentNode = elem.parentNode;
        importNode = document.importNode(elem, /* deep */ true);
        importNode.removeAttribute("id");
        removeAllChild(parentNode);
        parentNode.innerHTML = ""; 

        // Switch setterFunction depending on the elemnt type
        if (isInputValue(importNode)) {
          setter = function (event) {
            console.log("setterInfoForArray");
          };
        } else {
          setter = function (event) {
            console.log("setterInfoForArray", event);
            var r, ar, i, item, importNode, editElem;
            r = getRepo(event.target);
            ar = r.value;
            removeAllChild(this.parentNode);
            editElem = function(name, value, object) {
              var selected, e2;
              e2 = importNode.querySelector("." + name);
              if (!e2) return;
              if (isInputValue(e2)) {
                e2.value = value;
              } else {
                e2.textContent = value;
              }
            };
            for (i = 0; i < ar.length; i++) {
              item = ar[i];
              console.log(i, item, item.milk);
              importNode = document.importNode(this.importNode, /* deep */ true);
              mapByProp(item, editElem, importNode);
              this.parentNode.appendChild(importNode);
            }
          };
        }
        si = mergeRid({
          parentNode: parentNode,
          importNode: importNode,
          setter: setter,
        });

        return si;
      }

      function loadPropertyInfo(r, propName) {
        var pi;
        pi = r.pis[propName];
        if (!pi) {
          throw new Error("No property of '" + propName + "'");
        }
        return pi;
      }

      // transmit object property value to DOM element
      P.tx = function (propName, qryOrElems) {
        var pi = loadPropertyInfo(repos[this._rid], propName);
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        map(parseQryOrElems(qryOrElems), function (ee) {
          var si;
          if (pi.isPrimitive) {
            si = setterInfo(ee.elem);
          } else if (pi.isArray) {
            si = setterInfoForArray(ee.elem);
          } else {
            si = null;
          }
          if (si) {
            pi.addSetterInfo(si);
          }
        });
      };

      // receive value to object property from Dom element
      P.rx = function (propName, qryOrElems) {
        var pi = loadPropertyInfo(repos[this._rid], propName);
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        map(parseQryOrElems(qryOrElems), function (ee) {
          (function (ee, pi) {
            ee.elem.addEventListener(ee.eventType, function (event) {
              pi.cast(event);
            });
          })(ee, pi);
        });
      };

      // transmit object property value to DOM element
      // receive value to object property from Dom element
      P.trx = function (propName, qryOrElems) {
        var pi = loadPropertyInfo(repos[this._rid], propName);
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        map(parseQryOrElems(qryOrElems), function (ee) {
          pi.addSetterInfo(setterInfo(ee.elem));
          (function (ee, pi) {
            ee.elem.addEventListener(ee.eventType, function (event) {
              pi.cast(event);
            });
          })(ee, pi);
        });
      };

    })(Trax.prototype);

    function deepClone(target, memories) {
      var name, v, cloneObj, cloneAry, i, len;
      memories = memories || [];
      if (isObject(target)) {
        memories.push(target);
        cloneObj = {};
        for (name in target) {
          if (!target.hasOwnProperty(name)) continue;
          v = target[name];
          if (memories.indexOf(v) > 0) continue;
          cloneObj[name] = deepClone(v, memories);
        }
        return cloneObj;
      } else if (Array.isArray(target)) {
        memories.push(target);
        cloneAry = [];
        for (i = 0, len = target.length; i < len; ++i) {
          v = target[i];
          if (memories.indexOf(v) > 0) continue;
          cloneAry.push(deepClone(v, memories));
        }
      } else {
        return target;
      }
    }

    // arrayByDecl create an array that cat create array item 
    // consist of declearation object
    //
    // arrayByDecl is introduced to support in the case of:
    //  * You want to declare a structure of an item in array.
    //  * But in th beging of page loading, the array must be empty.
    //
    // The parameter must be an Object.
    // The Object is to represent decl for Trax.
    // The returned array will be modified to:
    //  * add _createItem method. The method create new Trax consists of the Object.
    arrayByDecl = Trax.arrayByDecl = function arrayByDecl(decl) {
      if (decl == null) throw Error("The parameter was null");
      if (!isObject(decl)) throw Error("The parameter was not an object");

      var array = [];
      array._createItem = (function (decl) {
        return function() {
          return new Trax(deepClone(decl));
        };
      })(decl);
      
      return array;
    };

    Trax.release = "0.0.9";

    return Trax;
  })();

});