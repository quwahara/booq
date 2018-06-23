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
    var RID_MIN = 100000000000000;
    var RID_MAX = RID_MIN * 10 - 1;

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
      return "_" + (Math.floor(Math.random() * (RID_MAX - RID_MIN + 1)) + RID_MIN).toString(10);
    }

    function mergeRid(obj) {
      if (!obj._rid) {
        Object.defineProperty(obj, '_rid', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: rid()
        });
      }
      return obj;
    }

    var proxies = {};

    function setProxy(target, proxy) {
      proxies[target._rid] = proxy;
      return proxy;
    }

    function getProxy(target) {
      if (target._rid) {
        return proxies[target._rid];
      } else {
        return null;
      }
    }

    var Xobject = function Xobject(objectDecl) {
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
        } else if (isObject(value)) {
          var xobject = new Xobject(value);
          var yobject = getProxy(xobject);
          yo.pis[name] = new PropInfo(self, name, xobject, yobject);
        } else if (isPrimitive(value)) {
          yo.pis[name] = new PropInfo(self, name, value, null);
        } else {
          throw Error("Not implemented");
        }
      }
      return self;
    }

    Xobject.prototype = {
      _bind: function (prop, opts) {
        var yo = getProxy(this);
        var pi = yo.pis[prop];

        if (!pi) throw Error("The property was not found.:" + prop);

        if (!isPrimitive(pi.value)) {
          throw Error("_bind supports only primitive type.");
        }

        opts = opts || {};
        var rootElem = opts.rootElem || Trax.ctx.elem;
        var elem = rootElem.querySelector("." + prop);
        if (!elem) return null;

        if (!isInputValue(elem)) {
          throw Error("_bind supports only inputable tags.");
        }

        var yelem = getProxy(elem);
        if (!yelem) {
          yelem = setProxy(mergeRid(elem), (new Yelem()).init(elem).initAsBind());
        }
        var eventName = opts.eventName || "change";
        yelem.addPropInfoForBind(pi, eventName);

        return this;
      },
      _each: function (prop, callback, opts) {
        var yo = getProxy(this);
        var pi = yo.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        if (!isXarray(pi.value)) throw Error("The property was not xarray.:" + prop);
        var yarray = getProxy(pi.value);

        opts = opts || {};
        var rootElem = opts.rootElem || Trax.ctx.elem;
        var query = opts.query || ("." + prop);
        var elem = rootElem.querySelector(query);
        if (!elem) return null;

        var yelem = getProxy(elem);
        if (!yelem) {
          yelem = setProxy(mergeRid(elem), (new Yelem()).init(elem).initAsEach());
        }
        yelem.addCallbackForEach(callback);
        yarray.addSub(yelem);
      },
      _transmit: function (prop, callback, opts) {
        var yo = getProxy(this);
        var pi = yo.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);

        opts = opts || {};
        var rootElem = opts.rootElem || Trax.ctx.elem;
        var query = opts.query || ("." + prop);
        var elem = rootElem.querySelector(query);
        if (!elem) return null;

        var yelem = getProxy(elem);
        if (!yelem) {
          yelem = setProxy(mergeRid(elem), (new Yelem()).init(elem).initAsTransmit());
        }
        if (!callback) {
          callback = (function (elem) {
            return function (value) {
              elem.textContent = value;
            };
          })(yelem.elem);
        }
        yelem.addCallbackForTransmit(callback);
        pi.addBindee(yelem);
      },
    };

    Xobject.prototype.constructor = Xobject;

    var Yobject = function Yobject(xobject, objectDecl) {
      this.xobject = xobject;
      this.objectDecl = objectDecl;
      this.pis = {};
    };

    Yobject.prototype = {
      replaceWith: function (object) {
        var name;
        var decl = this.objectDecl;
        var xobject = this.xobject;
        for (name in decl) {
          if (!decl.hasOwnProperty(name)) continue;
          xobject[name] = object[name];
        }
      }
    };

    var Xarray = function (arrayDecl) {
      var proxy = setProxy(mergeRid(this), new Yarray(this, arrayDecl));
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

    var Yarray = function Yarray(subject, arrayDecl) {
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
          var yelem = this.subs[i];
          yelem.each(this);
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

    var PropInfo = function PropInfo(subject, name, value, proxy) {
      this.init(subject, name, value, proxy);
    };

    PropInfo.prototype = {
      init: function (subject, name, value, proxy) {
        this.bindees = [];
        this.bindees.push(this);

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
              } else if (self.typeCode === TC_XOBJECT) {
                if (typeCode(value) !== TC_OBJECT)
                  throw Error("Type unmatch");
                self.proxy.replaceWith(value);
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
          proxyElem.handleTransmit(this, this.value);
        }
      },
      publish: function () {
        this.transmit(this, this.value);
      },
      transmit: function (src, value) {
        for (var i = 0; i < this.bindees.length; ++i) {
          var bindee = this.bindees[i];
          if (bindee === src) continue;
          bindee.handleTransmit(src, value);
        }
      },
      handleTransmit: function (src, value) {
        if (src === this) return;
        this.value = value;
      },
    };

    PropInfo.prototype.constructor = PropInfo;

    var Yelem = function Yelem() {
    };

    Yelem.prototype = {
      init: function (elem) {
        this.elem = elem;
        return this;
      },
      // Each functions
      initAsEach: function () {
        var elem = this.elem;
        this.callbacksForEach = [];
        if (elem.children.length) {
          var firstChildElem = elem.children.item(0);
          this.childElemTempl = document.importNode(firstChildElem, /* deep */ true);
          this.childElemTempl.removeAttribute("id");
        }
        this.eraseChildren();
        return this;
      },
      addCallbackForEach: function (callback) {
        if (-1 === this.callbacksForEach.indexOf(callback)) {
          this.callbacksForEach.push(callback);
        }
        return this;
      },
      each: function (yarray) {
        var xobject, childElem;
        this.eraseChildren();
        for (var i = 0; i < yarray.items.length; ++i) {
          xobject = yarray.items[i];
          childElem = document.importNode(this.childElemTempl, /* deep */ true);
          this.elem.appendChild(childElem);
          for (var j = 0; j < this.callbacksForEach.length; ++j) {
            newCtx(childElem, i, xobject);
            var f = this.callbacksForEach[j];
            f.call(childElem, xobject);
            releaseCtx();
          }
        }
      },
      eraseChildren: function () {
        removeAllChild(this.elem);
        this.elem.innerHTML = "";
      },
      // Transmit functions
      initAsTransmit: function () {
        this.callbacksForTrnasmit = [];
        return this;
      },
      addCallbackForTransmit: function (callback) {
        if (-1 === this.callbacksForTrnasmit.indexOf(callback)) {
          this.callbacksForTrnasmit.push(callback);
        }
        return this;
      },
      handleTransmit: function (src, value) {
        if (src === this) return;
        for (var i = 0; i < this.callbacksForTrnasmit.length; ++i) {
          var callback = this.callbacksForTrnasmit[i];
          newCtx(this.elem, -1, value);
          callback.call(this.elem, value);
          releaseCtx();
        }
      },
      // Bind functions
      initAsBind: function () {
        this.initAsTransmit();
        this.addCallbackForTransmit(function (value) {
          this.value = value;
        });
        this.propInfosForInput = [];
        return this;
      },
      bindCallback: function (value) {
        this.value = value;
      },
      addPropInfoForBind: function (propInfo, eventName) {
        if (-1 === this.propInfosForInput.indexOf(propInfo)) {
          this.propInfosForInput.push(propInfo);
        }

        // Send value
        (function (self, propInfo, eventName) {
          self.elem.addEventListener(eventName, function (e) {
            propInfo.transmit(self, e.target.value);
          });
        })(this, propInfo, eventName);

        // Receive value
        this.addCallbackForTransmit(this.bindCallback);
        propInfo.addBindee(this);

        return this;
      },
    };

    Yelem.prototype.constructor = Yelem;

    function removeAllChild(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

    var Trax = {

    };

    var ctxStack = [];
    
    function newCtx(elem, index, item) {
      var ctx = {
        elem: elem,
        index: index,
        item: item
      };
      ctxStack.push(ctx);
      return ctx;
    }

    function releaseCtx() {
      return ctxStack.pop();
    }

    // Root context
    newCtx(document, -1, null);

    Object.defineProperty(Trax, "ctx", {
      enumerable: true,
      get: function () {
        return ctxStack[ctxStack.length - 1];
      }
    });

    Trax.Xobject = Xobject;
    Trax.Xarray = Xarray;

    Trax.release = "0.0.17";

    return Trax;
  })();

});