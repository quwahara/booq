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

    var repos, proxies;
    var Parray, Pi, PropInfo, Aelem, ElemReciever, Trax;
    var Xobject, Xarray;
    var Yarray, YeachElem, Yelem, YinputElem, Yobject, YplainElem, YtreeElem;

    var ridMin, ridMax;
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

    proxies = {};

    function setProxy(target, proxy) {
      proxies[target._rid] = proxy;
      return proxy;
    }

    function getProxy(target) {
      return proxies[target._rid];
    }

    Xobject = function Xobject(objectDecl) {
      if (!isObject(objectDecl)) throw Error("The parameter was not an object");
      xobject_init(this, objectDecl);
    };

    function xobject_init(self, objectDecl) {
      var yo, name, value, parray;
      yo = setProxy(mergeRid(self), new Yobject(self, objectDecl));
      for (name in objectDecl) {
        if (!objectDecl.hasOwnProperty(name)) continue;
        if (name === "_rid") continue;
        if (name === "_bind") continue;
        value = objectDecl[name];
        if (isArray(value)) {
          yo.pis[name] = new PropInfo(self, name, new Xarray(value));
        } else if (isPrimitive(value)) {
          yo.pis[name] = new PropInfo(self, name, value);
        } else {
          throw Error("Not implemented");
        }
      }
      return self;
    }

    Xobject.prototype = {
      _bind: function (prop, rootElem) {
        var yo = getProxy(this);
        var pi = yo.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        rootElem = rootElem || document;
        var elem = rootElem.querySelector("." + prop);
        if (!elem) return null;

        var yelem;
        if (isXarray(pi.value)) {
          var yarray = getProxy(pi.value);
          yelem = setProxy(mergeRid(elem), new YeachElem(elem));
          yarray.addSub(yelem);
        } else if (isXobject(pi.value)) {
          var yobject = getProxy(pi.value);
          yelem = setProxy(mergeRid(elem), new YtreeElem(elem));
          yobject.addSub(yelem);
        } else if (isPrimitive(pi.value)) {
          if (isInputValue(elem)) {
            yelem = setProxy(mergeRid(elem), new YinputElem(elem, pi));
          } else {
            yelem = setProxy(mergeRid(elem), new YplainElem(elem));
          }
          pi.addSub(yelem);
        } else {
          throw Error("not implemented");
        }
        return yelem;
      }
    };

    Xobject.prototype.constructor = Xobject;

    Yobject = function Yobject(xobject, objectDecl) {
      this.xobject = xobject;
      this.objectDecl = objectDecl;
      this.pis = {};
    };

    Yobject.prototype = {
      addSub: function () {

      },
    };

    PropInfo = function PropInfo(subject, name, value) {
      this.init(subject, name, value);
    };

    PropInfo.prototype = {
      init: function (subject, name, value) {
        this.subs = [];
        this.subs.push(this);
        this.subject = subject;
        this.name = name;
        this.value = value;
        (function (self) {
          Object.defineProperty(self.subject, self.name, {
            enumerable: true,
            get: function () {
              return self.value;
            },
            set: function (value) {
              if (self.value === value) return;
              self.value = value;
              self.publish();
            }
          });
        })(this);
      },
      addSub: function (proxy) {
        this.subs.push(proxy);
      },
      publish: function () {
        this.tx(this, this.value);
      },
      tx: function (src, value) {
        for (var i = 0; i < this.subs.length; ++i) {
          var sub = this.subs[i];
          if (sub === src) continue;
          sub.rx(src, value);
        }
      },
      rx: function (src, value) {
        if (src === this) return;
        this.value = value;
      },
    };

    PropInfo.prototype.constructor = PropInfo;

    YeachElem = function YeachElem(parentElem) {
      this.init(parentElem);
    };

    YeachElem.prototype = {
      init: function (parentElem) {
        this.parentElem = parentElem;
        if (parentElem.children.length) {
          var firstChildElem = parentElem.children.item(0);
          this.childElemTempl = document.importNode(firstChildElem, /* deep */ true);
          this.childElemTempl.removeAttribute("id");
        }
        this.eraseChildren();
      },
      each: function (yarray) {
        var xobject, childElem;
        this.eraseChildren();
        for (var i = 0; i < yarray.items.length; ++i) {
          xobject = yarray.items[i];
          childElem = document.importNode(this.childElemTempl, /* deep */ true);
          this.parentElem.appendChild(childElem);
          var name;
          var yobject = getProxy(xobject);
          var yelem = setProxy(mergeRid(childElem), new YtreeElem(childElem));
          var bounds = [];
          var boundYelem;
          for (name in xobject) {
            if (!xobject.hasOwnProperty(name)) continue;
            if (name === "_rid") continue;
            if (name === "_bind") continue;
            boundYelem = xobject._bind(name, childElem);
            if (boundYelem) {
              bounds.push({
                name: name,
                yelem: boundYelem
              });
            }
          }
          for (var j = 0; j < bounds.length; ++j) {
            var bound = bounds[j];
            var pi = yobject.pis[bound.name];
            pi.publish();
          }
        }
      },
      eraseChildren: function () {
        removeAllChild(this.parentElem);
        this.parentElem.innerHTML = "";
      }
    };

    YeachElem.prototype.constructor = YeachElem;

    YtreeElem = function YtreeElem(parentElem) {
      this.init(parentElem);
    };

    YtreeElem.prototype = {
      init: function (parentElem) {
        this.parentElem = parentElem;
      }
    };

    YtreeElem.prototype.constructor = YtreeElem;

    YinputElem = function YinputElem(elem, propInfo) {
      this.init(elem, propInfo);
    };

    YinputElem.prototype = {
      init: function (elem, propInfo) {
        this.elem = elem;
        this.propInfo = propInfo;
        (function (self) {
          self.elem.addEventListener("change", function (e) {
            propInfo.tx(self, e.target.value);
          });
        })(this);
      },
      rx: function (src, value) {
        if (src === this) return;
        this.elem.value = value;
      }
    };

    YinputElem.prototype.constructor = YinputElem;

    YplainElem = function YplainElem(elem) {
      this.init(elem);
    };

    YplainElem.prototype = {
      init: function (elem) {
        this.elem = elem;
      },
      rx: function (src, value) {
        if (src === this) return;
        this.elem.textContent = value;
      }
    };

    YplainElem.prototype.constructor = YplainElem;

    Xarray = function (arrayDecl) {
      var proxy = setProxy(this, new Yarray(this, arrayDecl));
    };

    Xarray.prototype = {
      newItem: function () {
        var proxy, cloned;
        proxy = getProxy(this);
        cloned = clone(proxy.itemDecl);
        if (isObject(cloned)) {
          return new Xobject(cloned);
        } else if (isArray(cloned)) {
          return new Xarray(cloned);
        } else {
          throw Error("Not implemented");
        }
      },
      push: function (item) {
        var proxy;
        proxy = getProxy(this);
        proxy.items.push(mergeRid(item));
        proxy.publish();
      },
    };

    Xarray.prototype.constructor = Xarray;

    Yarray = function Yarray(subject, arrayDecl) {
      this.subs = [];
      this.items = [];
      this.subject = subject;
      this.itemDecl = arrayDecl.splice(0, 1)[0];
      this.arrayDecl = arrayDecl;
    };

    Yarray.prototype = {
      addSub: function (sub) {
        if (-1 === this.subs.indexOf(sub)) {
          this.subs.push(sub);
        }
      },
      publish: function () {
        for (var i = 0; i < this.subs.length; ++i) {
          var yeachElem = this.subs[i];
          yeachElem.each(this);
        }
      },
    };

    Yarray.prototype.constructor = Yarray;

    function removeAllChild(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

    Trax = {

    };

    Trax.Xobject = Xobject;
    Trax.Xarray = Xarray;

    Trax.release = "0.0.11";

    return Trax;
  })();

});
