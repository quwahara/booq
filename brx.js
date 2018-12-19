(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // <script>
    Brx = definition();
    console.log(Brx.release);
  }
})(function () {
  'use strict';
  return (function () {
    var TC_NIL = 0;
    var TC_PIMITIVE = 1;
    var TC_ARRAY = 2;
    var TC_OBJECT = 4;
    var TC_ARX = 2 + 16;
    var TC_BRX = 4 + 16;
    var TC_BOOQD = 2 + 16;
    var TC_ARRQD = 4 + 16;
    var RID_MIN = 100000000000000;
    var RID_MAX = RID_MIN * 10 - 1;

    function toArray(list) {
      var ar = [];
      var len = list.length;
      for (var i = 0; i < len; ++i) {
        ar.push(list.item(i));
      }
      return ar;
    }

    function forEach(list, callback, thisArg) {
      var len = list.length;
      for (var i = 0; i < len; ++i) {
        callback.call(thisArg, list.item(i), i);
      }
    }

    function map(arrayOrList, callback, thisArg) {
      var r = [];
      var i = 0;
      var len = arrayOrList.length;
      if (isArray(arrayOrList)) {
        for (; i < len; ++i) {
          r.push(callback.call(thisArg, arrayOrList[i], i));
        }
      } else {
        for (; i < len; ++i) {
          r.push(callback.call(thisArg, arrayOrList.item(i), i));
        }
      }
      return r;
    }

    function arrayContains(ar, item) {
      for (var i = 0; i < ar.length; ++i) {
        if (ar[i] === item) return true;
      }
      return false;
    }

    var spaceRex = /\s+/;

    function splitBySpace(v) {
      return (v || "").toString().trim().split(spaceRex);
    }

    function isUndefined(v) {
      return typeof v === "undefined";
    }

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

    function isElement(v) {
      return v && v.nodeType === Node.ELEMENT_NODE;
    }

    function isDocument(v) {
      return v === document;
    }

    function isPrimitive(v) {
      if (v == null) return false;
      var t = typeof v;
      return t === "string" || t === "number" || t === "boolean";
    }

    function isInputValue(elem) {
      if (!elem) return false;
      var tn = elem.tagName;
      if (tn === "INPUT" && elem.type) {
        var t = elem.type;
        return t === "text" || t === "password";
      } else if (tn === "SELECT" || tn === "TEXTAREA") {
        return true;
      }
      return false;
    }

    function isBrx(target) {
      var proto;
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Brx;
    }

    function isArx(target) {
      var proto;
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Arx;
    }

    function isBooqd(target) {
      var proto;
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Booqd;
    }

    function typeCode(v) {
      if (isArx(v)) {
        return TC_ARX;
      } else if (isBrx(v)) {
        return TC_BRX;
      } else if (isBooqd(v)) {
        return TC_BOOQD;
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

    /**
     * 
     * @param {*} target 
     * @param {*} varArgs 
     * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
     */
    function objectAssign(target, varArgs) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    }

    function extend(v) {
      if (isObject(v)) {
        return new Brx(v);
      } else if (isArray(v)) {
        return new Arx(v);
      } else if (isPrimitive(v)) {
        return v;
      } else {
        throw Error("Not implemented");
      }
    }

    function rid() {
      return "_" + (Math.floor(Math.random() * (RID_MAX - RID_MIN + 1)) + RID_MIN).toString(10);
    }

    function mergeRid(obj) {
      if (isPrimitive(obj)) {
        return obj;
      }
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


    var Booq = function Booq(structure, elem) {

      if (!isObject(structure)) {
        throw Error("'structure' must be an Object.");
      }

      elem = elem || document;

      var privates = setProxy(mergeRid(this), {
        structure: structure,
        data: new Booqd(this),
      });

      (function (self, privates) {
        Object.defineProperty(self, "data", {
          get: function () {
            return privates.data;
          },
          set: function (value) {
            if (privates.data === value) return;
            var tc = typeCode(value);
            if (!isTypeCodeAssignable(TC_BOOQD, tc)) {
              throw Error("Assigned value type was unmatch.");
            }
            privates.data.replaceWith(value);
          }
        });
      })
      (this, privates);

      for (var name in structure) {
        if (!structure.hasOwnProperty(name)) continue;
        if (name === "_rid") continue;

        var value = structure[name];
        if (isArray(value)) {
          (function (self, name, prop) {
            Object.defineProperty(self, name, {
              get: function () {
                return prop;
              }
            });
          })(this, name, new ArrayProp(this, privates.data, name, value, elem));
        } else if (isObject(value)) {
          var valueBooq = new Booq(value, elem);
          (function (self, name, prop) {
            Object.defineProperty(self, name, {
              get: function () {
                return prop;
              }
            });
          })(this, name, valueBooq);
          new ObjectProp(privates.data, name, valueBooq);

        } else if (isPrimitive(value)) {
          (function (self, name, prop) {
            Object.defineProperty(self, name, {
              get: function () {
                getProxy(prop).ye = null;
                return prop;
              }
            });
          })(this, name, new PrimitiveProp(this, privates.data, name, value, elem));

        } else {
          if (value === null) {
            throw Error("null is not allowed for value.");
          } else if (isUndefined(value)) {
            throw Error("Undefined is not allowed for value.");
          } else {
            throw Error("Not allowed value was supplied.");
          }
        }
      }
    };

    Booq.q = function q(selector) {
      return new Ye(selector);
    };

    Booq.prototype = {};

    Booq.prototype.constructor = Booq;

    var Booqd = function Booqd(booq) {
      setProxy(mergeRid(this), {
        booq: booq
      });
    };

    Booqd.prototype = {
      replaceWith: function (data) {
        for (var name in data) {
          if (!data.hasOwnProperty(name)) continue;
          this[name] = data[name];
        }
      },
    };

    Booqd.prototype.constructor = Booqd;

    function isTypeCodeAssignable(dst, src) {
      if (dst === TC_PIMITIVE) {
        return src === TC_PIMITIVE;
      } else if (dst === TC_BOOQD) {
        return src === TC_OBJECT || src === TC_BOOQD;
      } else if (dst === TC_ARRQD) {
        return src === TC_ARRAY || src === TC_ARRQD;
      } else {
        return false;
      }
    }

    var Linker = function Linker() {};

    Linker.prototype = {
      link: function (selector) {
        var privates = getProxy(this);
        privates.ye = new Ye(privates.elem).q(selector);
        return this;
      },
      linkByClass: function () {
        return this.link("." + getProxy(this).name);
      },
      linkByName: function () {
        return this.link("[name='" + getProxy(this).name + "']");
      },
      linkById: function () {
        return this.link("#" + getProxy(this).name);
      },
      qualify: function (preferredLink) {
        if (getProxy(this).ye != null) {
          return getProxy(this).ye;
        }
        if (preferredLink === "class") {
          this.linkByClass();
          return getProxy(this).ye;
        } else if (preferredLink === "name") {
          this.linkByName();
          return getProxy(this).ye;
        } else if (preferredLink === "id") {
          this.linkById();
          return getProxy(this).ye;
        } else {
          throw Error("requires link() before calling.");
        }
      },
    };

    var PrimitiveProp = function PrimitiveProp(booq, booqd, name, value, elem) {

      (function (self, name, privates) {

        Object.defineProperty(privates.booqd, name, {
          enumerable: true,
          get: function () {
            return privates.value;
          },
          set: function (value) {
            if (privates.value === value) return;
            var tc = typeCode(value);
            if (!isTypeCodeAssignable(privates.typeCode, tc)) {
              throw Error("Assigned value type was unmatch.");
            }
            if (tc === TC_PIMITIVE) {
              privates.value = value;
              self.transmit();
            }
          }
        });

      })(this, name, setProxy(mergeRid(this), {
        booq: booq,
        booqd: booqd,
        name: name,
        value: value,
        typeCode: typeCode(value),
        elem: elem,
        ye: null,
        receivers: []
      }));
    };

    PrimitiveProp.prototype = objectAssign({
        to: function (receiver) {
          var privates = getProxy(this);
          privates.receivers.push(receiver);
          return privates.booq;
        },
        toText: function () {
          var privates = getProxy(this);
          this.qualify("class");
          return this.to((function (privates, ye) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  this.textContent = value;
                });
              }
            };
          })(privates, privates.ye.clone()));
        },
        withValue: function () {
          var privates = getProxy(this);
          var ye = this.qualify("name").clone();
          this.to((function (privates, ye) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  this.value = value;
                });
              }
            };
          })(privates, ye));
          ye.on("change", (function (self) {
            return function (event) {
              self.receive(self, event.target.value);
            };
          })(this));
          return privates.booq;
        },
        transmit: function () {
          var privates = getProxy(this);
          var receivers = privates.receivers;
          for (var i = 0; i < receivers.length; ++i) {
            var receiver = receivers[i];
            if (receiver === privates) continue;
            receiver.receive(privates, privates.value);
          }
        },
        receive: function (src, value) {
          var privates = getProxy(this);
          if (src === privates) return;
          privates.value = value;
          this.transmit(src, value);
        },
      },
      Linker.prototype);

    PrimitiveProp.prototype.constructor = PrimitiveProp;

    var ObjectProp = function ObjectProp(dataBody, name, valueBooq) {

      var valueBooqPrivates = getProxy(valueBooq);
      var data = valueBooqPrivates.data;

      (function (self, dataBody, name, data) {

        Object.defineProperty(dataBody, name, {
          enumerable: true,
          get: function () {
            return data;
          },
          set: function (value) {
            if (data === value) return;
            var tc = typeCode(value);
            if (!isTypeCodeAssignable(TC_BOOQD, tc)) {
              throw Error("Assigned value type was unmatch.");
            }
            data.replaceWith(value);
          }
        });

      })(this, dataBody, name, data);
    };

    ObjectProp.prototype = {};

    ObjectProp.prototype.constructor = ObjectProp;

    var ArrayProp = function ArrayProp(booq, dataBody, name, array, elem) {
      var privates = setProxy(mergeRid(this), {
        booq: booq,
        name: name,
        elem: elem,
        array: [],
        callback: null,
        structure: array[0],
        templates: {},
        ye: null,
      });

      (function (self, dataBody, name, array) {

        Object.defineProperty(dataBody, name, {
          enumerable: true,
          get: function () {
            return array;
          },
          set: function (value) {
            if (array === value) return;
            var tc = typeCode(value);
            if (!isTypeCodeAssignable(TC_ARRQD, tc)) {
              throw Error("Assigned value type was unmatch.");
            }
            self.replaceWith(value);
          }
        });

      })(this, dataBody, name, privates.array);
    };

    ArrayProp.prototype = objectAssign({
        each: function (callback) {
          this.qualify("class");
          var privates = getProxy(this);
          privates.callback = callback;
          privates.ye.each(function () {
            if (!(mergeRid(this) in privates.templates)) {
              if (this.firstElementChild) {
                privates.templates[this._rid] = this.cloneNode(true);
              }
              removeChildAll(this);
            }
          });
          return privates.booq;
        },
        replaceWith: function (array) {
          var privates = getProxy(this);
          var privatesArray = privates.array;
          privatesArray.length = 0;
          var structure = privates.structure;
          var primitive = isPrimitive(structure);
          var i, item;
          var ye = privates.ye;
          if (ye) {
            ye.each(function () {
              removeChildAll(this);
            });
            var templates = privates.templates;
            var callback = privates.callback;
            for (i = 0; i < array.length; ++i) {
              item = array[i];
              ye.each(function () {
                var elem = templates[this._rid].cloneNode(true);
                if (primitive) {
                  callback.call(null, elem, item);
                  privatesArray.push(item);
                } else {
                  var booq = new Booq(structure, elem);
                  callback.call(booq, elem, i);
                  booq.data = item;
                  privatesArray.push(booq.data);
                }
                this.appendChild(elem.removeChild(elem.firstElementChild));
              });
            }

          } else {
            for (i = 0; i < array.length; ++i) {
              item = array[i];
              if (primitive) {
                privatesArray.push(item);
              } else {
                var booq = new Booq(structure, privates.elem);
                booq.data = item;
                privatesArray.push(booq.data);
              }
            }
          }
        }
      },
      Linker.prototype);

    ArrayProp.prototype.constructor = ArrayProp;


    var Brx = function Brx(objectDecl) {
      if (!isObject(objectDecl)) throw Error("The parameter was not an object");
      brx_init(this, objectDecl);
    };

    function brx_init(self, objectDecl) {
      var xy, name, value, parray, attrsNotes = [];
      xy = setProxy(mergeRid(self), new Brxy(self, objectDecl));
      self._ = xy;
      for (name in objectDecl) {
        if (!objectDecl.hasOwnProperty(name)) continue;
        if (name === "_rid") continue;
        if (name === "_bind") continue;

        // It is attributes if the name is ending with "$".
        if (name.indexOf("$") === (name.length - 1)) {
          attrsNotes.push(name.substr(0, name.length - 1));
          continue;
        }

        value = objectDecl[name];
        if (isArray(value)) {
          var arx = new Arx(value);
          var yarray = getProxy(arx);
          xy.pis[name] = new PropInfo(self, name, arx, yarray);
        } else if (isObject(value)) {
          var brx = new Brx(value);
          var brxy = getProxy(brx);
          xy.pis[name] = new PropInfo(self, name, brx, brxy);
        } else if (isPrimitive(value)) {
          xy.pis[name] = new PropInfo(self, name, value, null);
        } else {
          throw Error("Not implemented");
        }
      }

      // Attaching attributes to PropInfo
      for (var i = 0; i < attrsNotes.length; ++i) {
        var attrs = attrsNotes[i];
        var pi = xy.pis[attrs];
        if (pi && pi.proxy && objectDecl[attrs + "$"]) {
          pi.proxy.attrs = objectDecl[attrs + "$"];
        }
      }

      return self;
    }

    function brx_initOpts(ops, prop) {
      opts = opts || {};
      opts.rootElem = opts.rootElem || Brx.ctx.elem;
      var query = opts.query || "." + prop;
      return opts;
    }

    Brx.prototype = {
      // _focus: function (prop) {
      //   return getProxy(this).focus(prop);
      // },

      _bind: function (prop, opts) {
        var xy = getProxy(this);
        var pi = xy.pis[prop];

        if (!pi) throw Error("The property was not found.:" + prop);

        if (!isPrimitive(pi.value)) {
          throw Error("_bind supports only primitive type.");
        }

        opts = opts || {};
        var rootElem = opts.rootElem || Brx.ctx.elem;
        var selector = opts.selector || "[name='" + prop + "']";
        var elem = rootElem.querySelector(selector);
        // var elem = rootElem.querySelector("." + prop);
        if (!elem) return null;

        if (!isInputValue(elem)) {
          throw Error("_bind supports only inputable tags.");
        }

        // Setting attributes that are given with objectDecl.
        var settingAttrs = opts.settingAttrs || true;
        if (settingAttrs && xy.attrs[prop]) {
          var attrs = xy.attrs[prop];
          var name;
          for (name in attrs) {
            if (!attrs.hasOwnProperty(name)) continue;
            elem.setAttribute(name, attrs[name]);
          }
        }

        var yelem = getProxy(elem);
        if (!yelem) {
          yelem = setProxy(mergeRid(elem), (new Yelem()).init(elem).initAsBind());
        }
        opts.eventName = opts.eventName || "change";

        if (opts.validations) {
          var vs = opts.validations;
          opts.validationsOpts = opts.validationsOpts || {};
          var vOpts = opts.validationsOpts;
          vOpts.rootElem = vOpts.rootElem ||
            (elem.parentElement && elem.parentElement.parentElement) ||
            elem.parentElement;
          vOpts.selector = vOpts.selector || (Brx.conf.sbPrefix + prop + Brx.conf.sbPostfix);
          vOpts.elems = [elem].concat(toArray(vOpts.rootElem.querySelectorAll(vOpts.selector)));
          pi.addYelemForValidation(yelem);
        }

        yelem.addBindInfo(pi, opts);

        return this;
      },
      _each: function (prop, callback, opts) {
        var xy = getProxy(this);
        var pi = xy.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        if (!isArx(pi.value)) throw Error("The property was not arx.:" + prop);
        var yarray = getProxy(pi.value);

        opts = opts || {};
        var rootElem = opts.rootElem || Brx.ctx.elem;
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
      _pi: function (prop) {
        var xy = getProxy(this);
        var pi = xy.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        return pi;
      },
      _prepYelems: function (prop, opts) {
        opts = opts || {};
        var rootElem = opts.rootElem || Brx.ctx.elem;
        var query = opts.query || ("." + prop);
        var elemLs = rootElem.querySelectorAll(query);
        if (elemLs.length === 0 && rootElem.classList.contains(prop)) {
          elemLs = [rootElem];
        }
        var yelems = map(elemLs, function (elem) {
          var yelem = getProxy(elem);
          if (!yelem) {
            yelem = setProxy(mergeRid(elem), (new Yelem()).init(elem));
          }
          return yelem.initAsTransmit();
        });
        return yelems;
      },
      _toText: function (prop, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        yelems.forEach(function (yelem) {
          yelem.addCallbackForTransmit(function (value) {
            this.textContent = value;
          });
          pi.addTransmittee(yelem);
        });
      },
      _toAttr: function (prop, attrName, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        var prefix = opts.prefix || "";
        var postfix = opts.postfix || "";
        yelems.forEach(function (yelem) {
          yelem.addCallbackForTransmit(function (value) {
            this.setAttribute(attrName, prefix + value + postfix);
          });
          pi.addTransmittee(yelem);
        });
      },
      _toData: function (prop, dataName, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        var prefix = opts.prefix || "";
        var postfix = opts.postfix || "";
        yelems.forEach(function (yelem) {
          yelem.addCallbackForTransmit(function (value) {
            this.dataset[dataName] = prefix + value + postfix;
          });
          pi.addTransmittee(yelem);
        });
      },
      _toHtml: function (prop, callback, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        yelems.forEach(function (yelem) {
          yelem.addCallbackForTransmit(function (value) {
            this.innerHTML = value;
          });
          pi.addTransmittee(yelem);
        });
      },
      _showOn: function (prop, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        yelems.forEach(function (yelem) {
          yelem.initAsShowOn();
          yelem.addCallbackForTransmit(function (value) {
            var yelem = getProxy(this);
            this.style.display = value ? yelem.originalDisplay : "none";
          });
          pi.addTransmittee(yelem);
        });
      },
      _addClassOn: function (prop, className, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        yelems.forEach(function (yelem) {
          yelem.initAsTransmitToClass();
          yelem.addCallbackForTransmit(function (value) {
            var yelem = getProxy(this);
            var classArray = [].concat(yelem.originalClass);
            if (value) {
              classArray.push(className);
            }
            this.className = classArray.join(" ");
          });
          pi.addTransmittee(yelem);
        });
      },
      _toClass: function (prop, opts) {
        var yelems = this._prepYelems(prop, opts);
        var pi = this._pi(prop);
        yelems.forEach(function (yelem) {
          yelem.initAsTransmitToClass();
          yelem.addCallbackForTransmit(function (value) {
            var yelem = getProxy(this);
            var classArray = [].concat(yelem.originalClass);
            if (isString(value) && value.length) {
              classArray.push(value);
            }
            this.className = classArray.join(" ");
          });
          pi.addTransmittee(yelem);
        });
      },
      _after: function (prop, fnc) {
        this._pi(prop).afters.push(fnc);
      },
      _validate: function () {
        var xy = getProxy(this);
        var resultAcc = [];
        for (var name in xy.pis) {
          if (!xy.pis.hasOwnProperty(name)) continue;
          var pi = xy.pis[name];
          if (pi.typeCode === TC_PIMITIVE) {
            resultAcc = resultAcc.concat(pi.validate());
          } else if (pi.typeCode === TC_BRX) {
            resultAcc = resultAcc.concat(pi.value._validate());
          } else if (pi.typeCode === TC_ARX) {
            resultAcc = resultAcc.concat(pi.value._validate());
          } else {
            throw Error("Not implemented");
          }
        }
        return resultAcc;
      }
    };

    Brx.prototype.constructor = Brx;

    var Brxy = function Brxy(brx, objectDecl) {
      this.brx = brx;
      this.objectDecl = objectDecl;
      this.pis = {};

      // Attributes are to be set to element.
      // This property will be attached later in brx_init().
      // Because the source value is located in same level of parent object. 
      this.attrs = {};

      // this.ctxMgr = {
      //   stack: [],
      //   push: function (ye, index, item) {
      //     this.stack.push({
      //       ye: ye,
      //       index: index,
      //       item: item
      //     });
      //   },
      //   pop: function () {
      //     this.stack.pop();
      //   }
      // };

      this.focusingPi = null;
      this.ctx = null;
      this.focusingYe = null;
      this.childrenForEach = [];
    };

    Brxy.prototype = {
      replaceWith: function (object) {
        var name;
        var decl = this.objectDecl;
        var brx = this.brx;
        for (name in decl) {
          if (!decl.hasOwnProperty(name)) continue;
          brx[name] = object[name];
        }
      },
      focus: function (prop) {
        var pi = this.pis[prop];
        if (!pi) throw Error("The property was not found.:" + prop);
        this.focusingPi = pi;
        this.ctx = Brx.ctx;
        this.focusingYe = null;
        return this;
      },
      query: function (selector) {
        this.focusingYe = new Ye(this.ctx.elem).q(selector);
        return this;
      },
      queryByClass: function () {
        if (this.focusingPi === null) throw Error("requires focus() before calling.");
        return this.query("." + this.focusingPi.name);
      },
      queryByName: function () {
        if (this.focusingPi === null) throw Error("requires focus() before calling.");
        return this.query("[name='" + this.focusingPi.name + "']");
      },
      queryById: function () {
        if (this.focusingPi === null) throw Error("requires focus() before calling.");
        return this.query("#" + this.focusingPi.name);
      },
      qualify: function (preferredQuery) {
        if (this.focusingPi === null) throw Error("requires focus() before calling.");
        if (this.focusingYe === null) {
          if (preferredQuery === "class") {
            this.queryByClass();
          } else if (preferredQuery === "name") {
            this.queryByName();
          } else if (preferredQuery === "id") {
            this.queryById();
          } else {
            throw Error("requires query() before calling.");
          }
        }
        return this;
      },
      makeEffect: function (opts) {
        var effect = opts.effect;
        if (!effect) {
          effect = (function (prefix, suffix) {
            return function (value) {
              return prefix + value + suffix;
            };
          })(opts.prefix || "", opts.suffix || "");
        }
        return effect;
      },
      makeTransmeitee: function (self, effect, coreCallback) {
        return {
          handleTransmit: (function (self, effect, coreCallback) {
            return function (src, value) {
              if (src === self) return;
              coreCallback.call(self, effect(value));
            };
          })(self, effect, coreCallback)
        };
      },
      transmitteeBase: function (preferredQuery, opts, coreCallback) {
        this.qualify(preferredQuery);
        this.focusingPi.addTransmittee(
          this.makeTransmeitee(
            this.focusingYe.clone(), // to be 'this'
            this.makeEffect(opts || {}),
            coreCallback
          )
        );
        return this;
      },
      attr: function (attrName, opts) {
        return this.transmitteeBase("class", opts,
          (function (attrName) {
            return function (value) {
              this.attr(attrName, value);
            };
          })(attrName));
      },
      text: function (attrName, opts) {
        return this.transmitteeBase("class", opts,
          function (value) {
            this.text(value);
          });
      },
      bind: function (eventName, opts) {
        this.qualify("name");

        opts = opts || {};

        // input value to propInfo
        this.focusingYe.on(
          eventName,
          (function (self) {
            return function (event) {
              self.transmit(self, e.target.value);
            };
          })(this.focusingPi),
          opts.evtOpts
        );

        // propInfo value to input
        this.focusingPi.addTransmittee(
          this.makeTransmeitee(
            this.focusingYe.clone(), // to be 'this'
            this.makeEffect(opts),
            function (value) {
              this.value = value;
            }
          )
        );
        return this;
      },
      on: function (eventName, listener, opts) {
        if (this.focusingYe === null) {
          throw Error("requires query() before calling.");
        }
        this.focusingYe.on(eventName, listener, opts);
        return this;
      },
      storeChildIntoMap: function (parent) {
        if (!parent.firstChild) return;
        mergeRid(parent);
        if (!(prent._rid in parent.childrenForEach)) {
          this.childrenForEach[prent._rid] = prent.firstChild.cloneNode(true);
        }
        removeChildAll(parent);
      },
      each: function (callback) {
        this.qualify("class");

        // stock child element to clone in iteration
        this.focusingYe.each(function (params) {
          self.storeChildIntoMap(this);
        });

        this.focusingPi.addTransmittee({
          handleTransmit: (function (self, callback) {
            return function (src, items) {
              if (src === self) return;
              self.each(function () {
                var child = self.childrenForEach[this._rid].cloneNode(true);
                this.appendChild(child);
                for (var i = 0; i < items.length; ++i) {
                  //TODO generate context
                  callback.call(items[i], child, i);
                }
              });
            };
          })(this.focusingYe.clone(), callback)
        });

        return this;
      },
    };

    var Arx = function (arrayDecl) {
      var proxy = setProxy(mergeRid(this), new Yarray(this, arrayDecl));
    };

    Arx.prototype = {
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
      },
      _validate: function () {
        var proxy = getProxy(this);
        var resultAcc = [];
        for (var i = 0; i < proxy.items.length; ++i) {
          var item = proxy.items[i];
          if (typeCode(item) !== TC_BRX) continue;
          resultAcc = resultAcc.concat(item._validate());
        }
        return resultAcc;
      }
    };

    Arx.prototype.constructor = Arx;

    // Proxy array
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

    /**
     * 
     * @param {Brx} subject The Brx object that is having property of name in second argument. 
     * @param {String} name property name.
     * @param {*} value initial property value.
     * @param {*} proxy The proxy object for the Brx/Arx object in third argument. This is null if third argument is a primitive value.
     */
    var PropInfo = function PropInfo(subject, name, value, proxy) {
      this.init(subject, name, value, proxy);
    };

    PropInfo.prototype = {
      init: function (subject, name, value, proxy) {
        this.transmittees = [];
        this.transmittees.push(this);
        this.yelemsForValidation = [];
        this.afters = [];

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
              } else if (self.typeCode === TC_BRX) {
                if (typeCode(value) !== TC_OBJECT)
                  throw Error("Type unmatch");
                self.proxy.replaceWith(value);
              } else if (self.typeCode === TC_ARX) {
                if (typeCode(value) !== TC_ARRAY)
                  throw Error("Type unmatch");
                self.proxy.replaceWith(value);
              } else {
                throw Error("Not implemented");
              }
              self.callAfters();
            }
          });
        })(this);
      },
      addTransmittee: function (proxyElem) {
        if (-1 === this.transmittees.indexOf(proxyElem)) {
          this.transmittees.push(proxyElem);
        }
        proxyElem.handleTransmit(this, this.value);
      },
      publish: function () {
        this.transmit(this, this.value);
      },
      transmit: function (src, value) {
        for (var i = 0; i < this.transmittees.length; ++i) {
          var transmittee = this.transmittees[i];
          if (transmittee === src) continue;
          transmittee.handleTransmit(src, value);
        }
      },
      handleTransmit: function (src, value) {
        if (src === this) return;
        this.value = value;
      },
      addYelemForValidation: function (yelem) {
        this.yelemsForValidation.push(yelem);
      },
      validate: function () {
        var resultAcc = [];
        for (var i = 0; i < this.yelemsForValidation.length; ++i) {
          var yelem = this.yelemsForValidation[i];
          resultAcc = resultAcc.concat(yelem.validate());
        }
        return resultAcc;
      },
      callAfters: function () {
        for (var i = 0; i < this.afters.length; ++i) {
          this.afters[i].call(this, this.value);
        }
      }
    };

    PropInfo.prototype.constructor = PropInfo;

    var Ye = function Ye(arg) {
      this.elems_ = [];
      Object.defineProperty(this, "elems", {
        get: function () {
          return this.elems_;
        }
      });
      Object.defineProperty(this, "length", {
        get: function () {
          return this.elems_.length;
        }
      });
      Object.defineProperty(this, "elem", {
        get: function () {
          return this.elems_.length > 0 ? this.elems_[0] : null;
        }
      });

      if (isString(arg)) {
        this.elems.push(document);
        return this.q(arg);
      } else if (isDocument(arg) || isElement(arg)) {
        this.elems.push(arg);
        return this;
      } else if (arg === null) {
        return this;
      }

      return this;
    };

    Ye.prototype = {
      size: function () {
        return this.length;
      },
      clone: function () {
        var c = new Ye(null);
        c.elems_ = [].concat(this.elems_);
        c.lastSelector = this.lastSelector;
        return c;
      },
      q: function (selector) {
        if (!selector) {
          return this;
        }
        var elems = this.elems_;
        var newElems = [];
        for (var i = 0; i < elems.length; ++i) {
          newElems = newElems.concat(toArray(elems[i].querySelectorAll(selector)));
        }
        this.elems_ = newElems;
        this.lastSelector = selector;
        return this;
      },
      first: function () {
        if (this.length > 0) {
          this.elems.splice(1, this.length - 1);
        }
        return this;
      },
      each: function (callback) {
        for (var i = 0; i < this.length; ++i) {
          if (false === callback.call(this.elems[i], i, this.elems[i])) {
            break;
          }
        }
        return this;
      },
      firstMatchParent: function (predicate) {
        var found = null;
        this.each(function (i, elem) {
          if (elem.parentElement != null) {
            if (predicate(elem.parentElement)) {
              found = new Ye(null, elem.parentElement);
            } else {
              found = new Ye(null, elem.parentElement).firstMatchParent(predicate);
            }
          }
          // null means not found and continues each
          return found === null;
        });
        return found === null ? new Ye(null, null) : found;
      },
      add: function (ye) {
        this.elems = this.elems.concat(ye.elems);
        return this;
      },
      removeChildAll: function () {
        this.each(function () {
          while (this.firstChild) {
            this.removeChild(this.firstChild);
          }
        });
        return this;
      },
      text: function (value) {
        this.each(function () {
          if (!isUndefined(this.textContent)) {
            this.textContent = value;
          }
        });
        return this;
      },
      attr: function (attrName, value) {
        this.each(function () {
          this.setAttribute(attrName, value);
        });
        return this;
      },
      on: function (eventName, listener, opts) {
        this.each(function () {
          this.addEventListener(eventName, listener, opts);
        });
        return this;
      },
    };

    Ye.prototype.constructor = Ye;

    var Yelem = function Yelem() {};

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
        var brx, childElem;
        this.eraseChildren();
        for (var i = 0; i < yarray.items.length; ++i) {
          brx = yarray.items[i];
          childElem = document.importNode(this.childElemTempl, /* deep */ true);
          this.elem.appendChild(childElem);
          for (var j = 0; j < this.callbacksForEach.length; ++j) {
            newCtx(childElem, i, brx);
            var f = this.callbacksForEach[j];
            f.call(childElem, brx);
            releaseCtx();
          }
        }
      },
      eraseChildren: function () {
        removeChildAll(this.elem);
        this.elem.innerHTML = "";
      },
      // Transmit functions
      initAsTransmit: function () {
        if (this.callbacksForTrnasmit) return this;
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
      // ShowOn functions
      initAsShowOn: function () {
        var elem = this.elem;
        if (this.originalDisplay != null) return this;
        this.originalDisplay = elem.style.display;
        if (this.originalDisplay === "none") {
          this.originalDisplay = "";
        } else {
          elem.style.display = "none";
        }
        return this;
      },
      // TransmitToClass functions
      initAsTransmitToClass: function () {
        var elem = this.elem;
        if (this.originalClass) return this;
        this.originalClass = splitBySpace(elem.getAttribute("class"));
        return this;
      },
      // Bind functions
      initAsBind: function () {
        this.initAsTransmit();
        this.addCallbackForTransmit(function (value) {
          this.value = value;
        });
        this.bindInfos = [];
        this.optsForBind = [];
        return this;
      },
      bindCallback: function (value) {
        this.value = value;
      },
      addBindInfo: function (propInfo, opts) {

        this.bindInfos.push({
          "propInfo": propInfo,
          "opts": opts
        });

        // Send value
        (function (self, propInfo, eventName) {
          self.elem.addEventListener(eventName, function (e) {
            propInfo.transmit(self, e.target.value);
          });
        })(this, propInfo, opts.eventName);

        // Receive value
        this.addCallbackForTransmit(this.bindCallback);
        propInfo.addTransmittee(this);

        if (opts) {
          this.optsForBind.push(opts);
          if (opts.validationsOpts) {
            var vOpts = opts.validationsOpts;
            vOpts.statusYelems = [];
            for (var i = 0; i < vOpts.elems.length; ++i) {
              var elem = vOpts.elems[i];
              var yelem = setProxy(mergeRid(elem), (new Yelem()).init(elem).initAsStatus());
              vOpts.statusYelems.push(yelem);
            }
          }
        }

        return this;
      },
      validate: function () {
        var results = [];
        for (var i = 0; i < this.bindInfos.length; ++i) {
          var bi = this.bindInfos[i];
          if (!bi.opts.validations) continue;
          var pi = bi.propInfo;
          var vs = bi.opts.validations;
          var vOpts = bi.opts.validationsOpts;
          for (var j = 0; j < vs.length; ++j) {
            var v = vs[0];
            var result = {
              status: [],
            };
            results.push(result);
            v.call(pi.subject, result, pi.value, pi.name, vOpts.elems);
            for (var k = 0; k < vOpts.statusYelems.length; ++k) {
              var statusYelem = vOpts.statusYelems[k];
              statusYelem.applyStatus(result.status);
            }
          }
        }
        return results;
      },
      // Status functions
      initAsStatus: function () {
        var elem = this.elem;
        this.hasSetClassOn = !!elem.getAttribute("set-class-on");
        if (this.hasSetClassOn) {
          this.originalClass = splitBySpace(elem.getAttribute("class"));
          this.setClassOn = splitBySpace(elem.getAttribute("set-class-on"));
        }
        this.hasShowOn = !!elem.getAttribute("show-on");
        if (this.hasShowOn) {
          this.originalDisplay = elem.style.display;
          if (this.originalDisplay === "none") {
            this.originalDisplay = "";
          } else {
            elem.style.display = "none";
          }
          this.showOn = splitBySpace(elem.getAttribute("show-on"));
        }
        return this;
      },
      applyStatus: function (status) {
        if (isString(status)) status = splitBySpace(status);
        var i, s, elem;
        if (this.hasSetClassOn) {
          var statusForClassOn = [].concat(this.originalClass);
          for (i = 0; i < status.length; ++i) {
            s = status[i];
            if (arrayContains(this.setClassOn, s)) {
              statusForClassOn.push(s);
            }
          }
          elem = this.elem;
          elem.className = statusForClassOn.join(" ");
        }
        if (this.hasShowOn) {
          var statusForShowOn = [];
          for (i = 0; i < status.length; ++i) {
            s = status[i];
            if (arrayContains(this.showOn, s)) {
              statusForShowOn.push(s);
            }
          }
          elem = this.elem;
          elem.style.display = statusForShowOn.length ? this.originalDisplay : "none";
        }
        return this;
      },
    };

    Yelem.prototype.constructor = Yelem;

    function removeChildAll(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

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

    Object.defineProperty(Brx, "ctx", {
      enumerable: true,
      get: function () {
        return ctxStack[ctxStack.length - 1];
      }
    });

    Brx.conf = {
      sbPrefix: "._",
      sbPostfix: ""
    };

    Brx.Arx = Arx;

    Brx.validations = {
      empty: function (result, value, name, elems) {
        if ((value || "").trim() === "") {
          result.status = ["error", "empty"];
        }
      },
      lengthMinMax: function (opts) {
        return (function (opts) {
          return function (result, value, name, elems) {
            value = (value || "").trim();
            var len = value.length;
            if (len < opts.min || opts.max < len) {
              result.status = ["error", "length-min-max"];
              result.opts = opts;
            }
          };
        })(opts);
      },
      isOk: function (results) {
        if (!isArray(results)) {
          throw Error("The results must be Array.");
        }
        var ok = true;
        for (var i = 0; i < results.length; ++i) {
          var status = results[i].status;
          ok &= status.length == 0 || arrayContains(status, "ok");
        }
        return ok;
      }
    };

    Brx.on = function (eventType, query, listener, opts) {
      var rootElem;
      if (opts && opts.rootElem) {
        rootElem = opts.rootElem;
        delete opts.rootElem;
      } else {
        rootElem = this.ctx.elem;
      }
      var elems = map(rootElem.querySelectorAll(query), function (elem) {
        elem.addEventListener(eventType, listener, opts);
        return elem;
      });
      return elems;
    };

    Brx.q = function (selectors) {
      return document.querySelector(selectors);
    };

    function goUpParent(element, predicate) {
      if (element == null) {
        return null;
      }
      if (predicate(element)) {
        return element;
      }
      return goUpParent(element.parentElement, predicate);
    }

    Brx.goUpParent = goUpParent;

    function goUpParentByTagName(element, tagName) {
      return goUpParent(element.parentElement, function (elem) {
        return elem.tagName === tagName.toUpperCase();
      });
    }

    Brx.goUpParentByTagName = goUpParentByTagName;
    Booq.goUpParentByTagName = goUpParentByTagName;

    Brx.querySelectorAllMap = function (selector, callback /* [, arg1[, arg2[, ...]]] */ ) {
      var r = [];
      var args = Array.prototype.slice.call(arguments);
      if (args.length >= 3) {
        args.splice(0, 2);
      } else {
        args.splice(0, args.length);
      }
      var elms = document.querySelectorAll(selector);
      var i;
      if (isString(callback)) {
        for (i = 0; i < elms.length; ++i) {
          var elm = elms.item(i);
          var cb = elm[callback];
          r.push(cb.apply(elm, args));
        }
      } else {
        for (i = 0; i < elms.length; ++i) {
          r.push(callback.apply(elms.item(i), args));
        }
      }
      return r;
    };

    Brx.release = "0.0.18";

    Brx.Booq = Booq;

    return Brx;
  })();

});