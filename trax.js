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
    var TC_NIL = 0;
    var TC_PIMITIVE = 1;
    var TC_ARRAY = 2;
    var TC_OBJECT = 4;
    var TC_XARRAY = 2 + 16;
    var TC_XOBJECT = 4 + 16;

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
      if (!elem) return false;
      var tn = elem.tagName;
      if (tn === "INPUT") {
        if (elem.type && elem.type === "text") return true;
      } else if (tn === "SELECT") {
        return true;
      }
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

    function typeCode(v) {
      if (isXarray(v)) {
        return TC_XARRAY;
      } else if (isXobject(v)) {
        return TC_XOBJECT;
      } else if (isPrimitive(v)) {
          return TC_PIMITIVE;
      } else if (isArray(v)) {
        return TC_ARRAY;
      } else if (isObject(v)) {
        return TC_OBJECT;
      } else {
        return TC_NIL;
      }
    }

    function clone(origin) {
      return JSON.parse(JSON.stringify(origin));
    }

    function extend(v) {
      if (isObject(v)) {
        return new Xobject(v);
      } else if (isArray(v)) {
        return new Xarray(v);
      } else {
        throw Error("Not implemented");
      }
    }

    function rid() {
      return "_" + (Math.floor(Math.random() * (ridMax - ridMin + 1)) + ridMin).toString(10);
    }

    function mergeRid(obj) {
      if (!obj._rid) {
        // obj._rid = rid();
        Object.defineProperty(obj, '_rid', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: rid()
        });
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
          var xarray = new Xarray(value);
          var yarray = getProxy(xarray);
          yo.pis[name] = new PropInfo(self, name, xarray, yarray);
        } else if (isPrimitive(value)) {
          yo.pis[name] = new PropInfo(self, name, value, null);
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
          pi.addBindee(yelem);
        } else {
          throw Error("not implemented");
        }
        return yelem;
      },
      _each: function (prop, callback, opts) {
        
        var yo = getProxy(this);
        var pi = yo.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        if (!isXarray(pi.value))  throw Error("The property was not xarray.:" + prop);
        var yarray = getProxy(pi.value);
        
        opts = opts || {};
        var rootElem = opts.rootElem || document;
        var query = opts.query || ("." + prop);
        var elem = rootElem.querySelector(query);
        if (!elem) return null;
        
        var yeachElem = setProxy(mergeRid(elem), new YeachElem(elem, callback));
        yarray.addSub(yeachElem);
      },
      _listenTo: function (prop, callback) {

        var yo = getProxy(this);
        var pi = yo.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        if (!isPrimitive(pi.value))  throw Error("The property was not primitives.:" + prop);

        pi.addListeners(callback);
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

    PropInfo = function PropInfo(subject, name, value, proxy) {
      this.init(subject, name, value, proxy);
    };

    PropInfo.prototype = {
      init: function (subject, name, value, proxy) {
        // this.subs = [];
        // this.subs.push(this);
        this.bindees = [];
        this.bindees.push(this);
        this.listeners = [];

        this.subject = subject;
        this.name = name;
        this.value = value;
        this.proxy = proxy;
        this.typeCode = typeCode(this.value);

        (function (self) {
          Object.defineProperty(self.subject, self.name, {
            enumerable: true,
            get: function () {
              return self.value;
            },
            set: function (value) {
              if (self.value === value) return;
              if (self.typeCode === TC_PIMITIVE) {
                if (typeCode(value) !== TC_PIMITIVE)
                  throw Error("Type unmatch");
                self.value = value;
                self.publish();
              } else if (self.typeCode === TC_XARRAY) {
                if (typeCode(value) !== TC_ARRAY)
                  throw Error("Type unmatch");
                self.proxy.replaceWith(value);
              } else {
                throw Error("Not implemented");
              }
            }
          });
        })(this);
      },
      addBindee: function (proxyElem) {
        if (-1 === this.bindees.indexOf(proxyElem)) {
          this.bindees.push(proxyElem);
          proxyElem.rx(this, this.value);
        }
      },
      addListeners: function (callback) {
        if (-1 === this.listeners.indexOf(callback)) {
          this.listeners.push(callback);
          callback(this.value);
        }
      },
      // addSub: function (proxyElem) {
      //   this.subs.push(proxyElem);
      // },
      publish: function () {
        this.tx(this, this.value);
      },
      tx: function (src, value) {
        for (var i = 0; i < this.bindees.length; ++i) {
          var bindee = this.bindees[i];
          if (bindee === src) continue;
          bindee.rx(src, value);
        }
      },
      rx: function (src, value) {
        if (src === this) return;
        this.value = value;
      },
    };

    PropInfo.prototype.constructor = PropInfo;

    YeachElem = function YeachElem(parentElem, callback) {
      this.init(parentElem, callback);
    };

    YeachElem.prototype = {
      init: function (parentElem, callback) {
        this.parentElem = parentElem;
        this.callback = callback;
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
          this.callback(childElem, xobject);
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
        return extend(cloned);
      },
      push: function (item) {
        var proxy;
        proxy = getProxy(this);
        proxy.items.push(mergeRid(item));
        proxy.publish();
      },
      toJSON: function () {
        var proxy = getProxy(this);
        return proxy.items;
      }
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
      replaceWith: function (array) {
        var items = [];
        for (var i = 0; i < array.length; i++) {
          items.push(extend(array[i]));
        }
        this.items = items;
        this.publish();
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
