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

    var ridMin, ridMax, repos, Xobject, Xarray, Pi, ElemReciever, InputElemReciever, Trax;
    ridMin = 100000000000000;
    ridMax = ridMin * 10 - 1;

    function isString(v) {
      return (typeof v) === "string";
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
    }

    function isArray(v) {
      return Array.isArray(v);
    }

    function isFunction(fun) {
      return fun && {}.toString.call(fun) === '[object Function]';
    }

    function isPrimitive(v) {
      if (v == null) return false;
      var t = typeof v;
      return t === "string" || t === "number" || t === "boolean";
    }

    function isInputValue(elem) {
      if (!elem || elem.tagName !== "INPUT") return false;
      if (elem.type && elem.type === "text") return true;
      return false;
    }

    function isXobject(target) {
      var proto;
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Xobject;
    }

    function isXarray(target) {
      var proto;
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Xarray;
    }

    function clone(origin) {
      return JSON.parse(JSON.stringify(origin));
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
      repos[t2._rid] = r3;
      return r3;
    }

    function getRepo(target) {
      return repos[target._rid];
    }

    Xobject = function Xobject(objectDecl) {
      if (!isObject(objectDecl)) throw Error("The parameter was not an object");
      var repo = mergeRepo(this);
      var name;
      repo.object = objectDecl;
      repo.pis = [];
      for (name in objectDecl) {
        if (!objectDecl.hasOwnProperty(name)) continue;
        if (name === "_rid") continue;
        repo.pis[name] = new Pi(name, objectDecl);
      }
    };

    Xobject.prototype = {
      bind: function (propName, rootElem, query) {
        var repo = getRepo(this);
        var pi = repo.pis[propName];
        bindQueriedElemsToPi(rootElem, pi);
      },
    };

    Pi = function Pi(propName, object) {
      var value, convertedValue;
      this.sbscElems = [];
      this.receiverInfos = [];
      this.receiverInfos.push(this);
      this.receiver = this;
      this.propName = propName;
      this.object = object;
      this.casting = false;
      this.onChangeHandler = (function (self) {
        return function (event) {
          if (event && event.target) {
            self.cast(event.target, event.target.value);
          }
        };
      })(this);
      redefineProp(propName, object, this);
    };

    Pi.prototype = {
      setValue: function (value) {
        if (value === this.rawValue) return false;
        if (value === this.value) return false;
        var repo;
        if (isPrimitive(value)) {
          this.rawValue = value;
          this.value = value;
        } else if (isArray(value)) {
          this.rawValue = value;
          this.value = new Xarray(value);
        } else if (isXobject(value)) {
          repo = getRepo(value);
          this.rawValue = repo.object;
          this.value = value;
        } else if (isXarray(value)) {
          repo = getRepo(value);
          this.rawValue = repo.array;
          this.value = value;
        } else {
          this.rawValue = value;
          this.value = new Xobject(value);
        }
        return true;
      },
      addSbscElem: function (elem) {
        var ri;
        ri = this.getReceiverInfoByElement(elem);
        if (ri) return ri;
        if (isInputValue(elem)) {
          ri = new InputElemReciever(elem);
        } else {
          ri = new ElemReciever(elem);
        }
        this.receiverInfos.push(ri);
        return ri;
      },
      getReceiverInfoByElement: function (elem) {
        var ris, i, len;
        ris = this.receiverInfos;
        for (i = 0, len = ris.length; i < len; ++i) {
          if (ris[i].receive === elem) return ris[i];
        }
        return null;
      },
      cast: function (sender, value) {
        var i, len, ris, ri;
        if (this.casting) return;
        this.casting = true;
        try {
          ris = this.receiverInfos;
          for (i = 0, len = ris.length; i < len; ++i) {
            ri = ris[i];
            if (ri.receiver === sender) continue;
            ri.receive(sender, value);
          }
        } finally {
          this.casting = false;
        }
      },
      receive: function (sender, value) {
        this.setValue(value);
      },
    };
        
    function redefineProp(propName, object, pi) {
      (function (self, pi) {
        Object.defineProperty(self, pi.propName, {
          enumerable: true,
          get: function () {
            return pi.value;
          },
          set: function (value) {
            if (pi.setValue(value)) {
              pi.cast(pi, value);
            }
          }
        });
      })(object, pi);
    }

    Xarray = function (arrayDecl) {
      var repo = mergeRepo(this);
      repo.itemDecl = arrayDecl.splice(0, 1)[0];
      repo.array = arrayDecl;
    };

    Xarray.prototype = {
      bind: function (rootElem, query) {
        var repo = getRepo(this);
        var elems, i, len, elem;
        elems = rootElem.querySelectorAll(query);
        for (i = 0, len = elems.length; len < i; ++i) {
          elem = elems.item(i);
          bindElemToXarray(elem, this);
        }
      },
      newItem: function () {
        var repo, cloned;
        repo = getRepo(xarray);
        cloned = clone(repo.itemDecl);
        if (isArray(cloned)) {
          return new Xarray(cloned);
        } else {
          return new Xobject(cloned);
        }
      },
      push: function (item) {
        var repo, rid, sbscRepo;
        this.array.push(item);
        repo = getRepo(xarray);
        for (rid in repo.sbscRepos) {
          sbscRepo = repo.sbscRepos[rid];
          newElem = document.importNode(sbscRepo.elemTempl, /* deep */ true);
          sbscRepo.elem.appendChild(newElem);
          bindElemToXobject(newElem, item);
        }
      },
    };

    function bindElemToXobject(elem, xobject) {
      var repo = getRepo(xobject);
      var name, pi;
      for (name in xobject) {
        if (!xobject.hasOwnProperty(name)) continue;
        pi = repo.pis[name];
        bindQueriedElemsToPi(elem, pi);
      }
    }

    function bindQueriedElemsToPi(elem, pi) {
        var elems, i, len, targetElem;
        elems = queryByPropName(elem, pi.propName);
        for (i = 0, len = elems.length; i < len; ++i) {
          targetElem = elems.item(i);
          bindElemToPi(targetElem, pi);
        }
    }

    function bindElemToPi(elem, pi) {
      if (isInputValue(elem)) {
        elem.addEventListener("change", pi.onChangeHandler);
      }
      pi.addSbscElem(elem);
    }

    function queryByPropName(elem, propName) {
      var ls;
      ls = elem.querySelectorAll("." + propName);
      if (ls.length > 0) return ls;
      return elem.querySelectorAll("#" + propName);
    }

    function bindElemToXarray(elem, xarray) {
      var repo = getRepo(Xarray);
      var parent = elem.parentNode;
      var sbscRepo = getRepo(parent);
      repo.sbscRepos = repo.sbscRepos || [];
      if (!repo.sbscRepos[sbscRepo._rid]) {
        repo.sbscRepos[sbscRepo._rid] = sbscRepo;
      }
      sbscRepo.elem = elem.parentNode;
      sbscRepo.elemTempl = document.importNode(elem, /* deep */ true);
      sbscRepo.elemTempl.removeAttribute("id");
      removeAllChild(parent);
    }

    function removeAllChild(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

    function createTransHandlerByElem(elem) {
      if (isInputValue(elem)) {
        return function (src, value) {
          if (src === this.elem) return;
          this.elem.value = value;
        };
      } else {
        return function (src, value) {
          if (src === this.elem) return;
          this.elem.textContent = value;
        };
      }
    }

    function createElementForSbsc(s, item) {
      var newElem, sbscRepo;
      newElem = document.importNode(s.elemTempl, /* deep */ true);
      s.parentNode.appendChild(newElem);
      s[s.bindType](newElem);
    }

    ElemReciever = function ElemReciever(elem) {
      this.receiver = elem;
    };

    ElemReciever.prototype = {
      receive: function (sender, value) {
        if (sender === this.receiver) return false;
        this.receiver.textContent = value;
        return true;
      },
    };

    InputElemReciever = function InputElemReciever(elem) {
      this.receiver = elem;
    };

    InputElemReciever.prototype = {
      receive: function (sender, value) {
        if (sender === this.receiver) return false;
        this.receiver.value = value;
        return true;
      },
    };

    Trax = {

    };

    Trax.Xobject = Xobject;
    Trax.Xarray = Xarray;

    Trax.release = "0.0.11";

    return Trax;
  })();

});