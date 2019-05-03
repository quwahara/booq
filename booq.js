(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // <script>
    Booq = definition();
  }
})(function () {
  'use strict';
  return (function () {
    var TC_NIL = 0;
    var TC_PIMITIVE = 1;
    var TC_ARRAY = 2;
    var TC_OBJECT = 4;
    var TC_BOOQD = 2 + 16;
    var TC_ARRQD = 4 + 16;
    var RID_MIN = 100000000000000;
    var RID_MAX = RID_MIN * 10 - 1;

    function stackTraceString(error) {
      var stack = error.stack;
      if (isString(stack)) {
        stack = stack.split("\n");
      }
      return stack;
    }

    function funcVoid() { }

    function passthrough(v) {
      return v;
    }

    function orPassthrough(func) {
      return isUndefined(func) ? passthrough : func;
    }

    function valueReplace(template, re) {
      return function (value) {
        return template.replace(re, value);
      };
    }

    function toArray(list) {
      var ar = [];
      var len = list.length;
      for (var i = 0; i < len; ++i) {
        ar.push(list.item(i));
      }
      return ar;
    }

    function setUpReadOnlyProperty(body, name, value) {
      (function (value) {
        Object.defineProperty(body, name, {
          enumerable: true,
          get: function () {
            return value;
          }
        });
      })(value);
    }

    // function forEach(list, callback, thisArg) {
    //   var len = list.length;
    //   for (var i = 0; i < len; ++i) {
    //     callback.call(thisArg, list.item(i), i);
    //   }
    // }

    // function map(arrayOrList, callback, thisArg) {
    //   var r = [];
    //   var i = 0;
    //   var len = arrayOrList.length;
    //   if (isArray(arrayOrList)) {
    //     for (; i < len; ++i) {
    //       r.push(callback.call(thisArg, arrayOrList[i], i));
    //     }
    //   } else {
    //     for (; i < len; ++i) {
    //       r.push(callback.call(thisArg, arrayOrList.item(i), i));
    //     }
    //   }
    //   return r;
    // }

    // function arrayContains(ar, item) {
    //   for (var i = 0; i < ar.length; ++i) {
    //     if (ar[i] === item) return true;
    //   }
    //   return false;
    // }

    // var spaceRex = /\s+/;

    // function splitBySpace(v) {
    //   return (v || "").toString().trim().split(spaceRex);
    // }

    function goUpParent(element, predicate) {
      if (element == null) {
        return null;
      }
      if (predicate(element)) {
        return element;
      }
      return goUpParent(element.parentElement, predicate);
    }

    function goUpParentByTagName(element, tagName) {
      return goUpParent(element.parentElement, function (elem) {
        return elem.tagName === tagName.toUpperCase();
      });
    }

    function removeChildAll(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

    function isInt(v) {
      return v === parseInt(v, 10);
    }

    function isNullOrUndefined(v) {
      return isUndefined(v) || v === null;
    }

    function isUndefined(v) {
      return typeof v === "undefined";
    }

    function isString(v) {
      return typeof v === "string";
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

    // function isInputValue(elem) {
    //   if (!elem) return false;
    //   var tn = elem.tagName;
    //   if (tn === "INPUT" && elem.type) {
    //     var t = elem.type;
    //     return t === "text" || t === "password";
    //   } else if (tn === "SELECT" || tn === "TEXTAREA") {
    //     return true;
    //   }
    //   return false;
    // }

    function isBooq(target) {
      var proto;
      if (target == null) return false;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Booq;
    }

    function isBooqd(target) {
      var proto;
      if (target == null) return false;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Booqd;
    }

    function isArrayProp(target) {
      var proto;
      if (target == null) return false;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === ArrayProp;
    }

    function isPrimitiveProp(target) {
      var proto;
      if (target == null) return false;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === PrimitiveProp;
    }

    function typeCode(v) {
      if (isBooqd(v)) {
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

      for (var i = 1; i < arguments.length; ++i) {
        var nextSource = arguments[i];

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

    var Base = function Base() {

      (function (self, privates) {
        Object.defineProperty(self, "___r", {
          get: function () {
            return privates;
          },
        });

      })(this,
        // privates
        {
          toPreferred: "class",
          withPreferred: "name",
          receivers: [],
          traceQualify: null,
          traceSetData: null,
        });
    };

    Base.prototype = {

      /**
       * Extends selector string
       * 
       * Selector string is generated from property name automatically.
       * The argument, extentSeletor string appends to genereted
       * selector string.
       * For example, the generated selector string will be ".prop_name",
       * if the paroperty name is "prop_name".
       * The selector string will be ".prop_name.extent",
       * if the extentSeletor argument is ".extent";
       * The selector string will be ".prop_name .extent",
       * if the extentSeletor argument is " .extent";
       * You can put a space if you want to select lower tag.
       * 
       * @param {string} extentSelector It is a selector string that you want to extend 
       *                                for generated selector.
       */
      extent: function (extentSelector) {
        this.___r.extentSelector = extentSelector;
        return this;
      },
      preferredSelector: function (preferred) {
        var privates = this.___r;

        var nameSelector = "";
        var name;
        if (privates.name) {
          name = privates.name;
        } else {
          name = "";
        }

        if (preferred === "class" || preferred === "down_and_class") {
          if (preferred === "down_and_class") {
            nameSelector = " ";
          }
          if (name) {
            nameSelector += "." + name;
          }
        } else if (preferred === "name" || preferred === "down_and_name") {
          if (preferred === "down_and_name") {
            nameSelector = " ";
          }
          if (name) {
            nameSelector += "[name='" + name + "']";
          }
        } else if (preferred === "nth_child" || preferred === "down_and_nth_child") {
          if (preferred === "down_and_nth_child") {
            nameSelector = " ";
          }
          if (isInt(privates.index)) {
            nameSelector = ">*:nth-child(" + (privates.index + 1) + ")";
          }
        } else if (preferred === "id") {
          if (name) {
            nameSelector = "#" + name;
          }
        } else {
          throw Error("Unsupported preferred");
        }

        if (isString(privates.extentSelector)) {
          if (preferred === "id") {
            // don't add extent if selector has id selector
            // because id selector is expected to be able to select unique element
            if (name === "") {
              nameSelector += privates.extentSelector;
            }
          } else if (preferred === "name" || preferred === "down_and_name") {
            nameSelector += privates.extentSelector;
          } else if (preferred === "class" || preferred === "down_and_class") {
            nameSelector += privates.extentSelector;
          } else {
            throw Error("Unsupported preferred");
          }
        }

        return nameSelector;
      },
      fullPathSelector: function (preferred) {

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

        selector += this.preferredSelector(preferred);

        return selector;
      },
      linkExtra: function (extra) {
        return this.linkPreferred(this.___r.toPreferred, extra);
      },
      linkPreferred: function (prferred, extra) {
        this.___r.ye = new Ye(this.fullPathSelector(prferred) + (isString(extra) ? extra : ""));
        return this;
      },
      qualify: function (preferred) {
        var privates = this.___r;
        if (privates.ye === null) {
          this.linkPreferred(preferred);
        }

        if (Booq.conf.traceQualify) {
          privates.traceQualify = [privates.ye.elems, privates.ye.lastSelector, this.___fullName(), stackTraceString(Error())];
        }

        return this;
      },
      traceQualify: function () {
        if (!Booq.conf.traceQualify) {
          console.log("@traceQualify", "Call 'Booq.configure({traceQualify: true});' to activate traceQualify()");
        } else {
          if (this.___r.traceQualify === null) {
            console.log("@traceQualify", "Trace was empty");
          } else {
            console.log("@traceQualify", this.___r.traceQualify);
          }
        }
        return this;
      },
      traceSetData: function () {
        if (!Booq.conf.traceSetData) {
          console.log("@traceSetData", "Call 'Booq.configure({traceSetData: true});' to activate traceSetData()");
        } else {
          if (this.___r.traceSetData === null) {
            console.log("@traceSetData", "Trace was empty");
          } else {
            console.log("@traceSetData", this.___r.traceSetData);
          }
        }
        return this;
      },
      selector: function (preferred) {
        this.qualify(preferred);
        var privates = this.___r;
        var ye = privates.ye;
        return ye ? ye.lastSelector : "";
      },
      callFunctionWithThis: function (fun) {
        fun(this);
        if (Booq.conf.traceQualify && privates.chains && privates.chains != this) {
          privates.chains.___r.traceQualify = privates.traceQualify;
        }
        return this.___r.chains;
      },
      to: function (srcValueCallback) {
        var privates = this.___r;
        this.qualify(privates.toPreferred);
        privates.receivers.push((function (ye, srcValueCallback) {
          return {
            receive: function (src, value) {
              ye.each(function () {
                if (this === src) return;
                srcValueCallback.call(this, src, value);
              });
            }
          };
        })(privates.ye.clone(), srcValueCallback));
        privates.ye = null;

        if (Booq.conf.traceQualify && privates.chains && privates.chains != this) {
          privates.chains.___r.traceQualify = privates.traceQualify;
        }

        return privates.chains;
      },

      on: function (eventName, listener, opts) {
        var privates = this.___r;
        this.qualify("name");
        var ye = privates.ye;
        privates.ye = null;
        ye.on(eventName, (function (self, listener) {
          return function (event) {
            listener.call(self, event);
          };
        })(this, listener), opts);

        if (Booq.conf.traceQualify && privates.chains && privates.chains != this) {
          privates.chains.___r.traceQualify = privates.traceQualify;
        }

        return privates.chains;
      },
      /**
       * Copy status from src.
       * This actually clones and copies ye from src.
       * 
       * @param {(Link|Booq|PrimitiveProp)} src 
       */
      copyLink: function (src) {
        this.___r.ye = src.___r.ye.clone();
        return this;
      },
    };

    Base.prototype.constructor = Base;

    var Booq = function Booq(structure, elem, parent, index, name) {

      this.___base();

      if (!isObject(structure)) {
        throw Error("'structure' must be an Object.");
      }

      elem = elem || document;

      var privates = this.___r;

      objectAssign(privates, {
        self: this,
        structure: structure,
        data: new Booqd(this),
        parent: parent || null,
        index: isInt(index) ? index : null,
        name: isString(name) ? name : null,
        elem: elem,
        chains: this,
        ye: null,
        also: null,
        updater: funcVoid,
        update: function () {
          if (!this.updater.call(this.self, this.data)) {
            var self = this.self;
            for (var name in self) {
              if (!self.hasOwnProperty(name)) continue;
              if (name === "_rid") continue;
              var booqy = self[name];
              if (isBooq(booqy)) {
                booqy.update();
              }
              //TODO supports ArrayProp and PrimitiveProp
            }
          }
        }
      });

      if (isInt(index)) {
        privates.toPreferred = "down_and_nth_child";
        privates.withPreferred = "down_and_nth_child_and_name";
      }

      (function (self) {
        Object.defineProperty(self, "data", {
          get: function () {
            return self.___r.data;
          },
          set: function (value) {
            self.setData(value);
          }
        });
        Object.defineProperty(self, "also", {
          get: function () {
            var prop = self.___r.also;
            if (prop) {
              prop.___r.ye = null;
              return prop;
            } else {
              return null;
            }
          },
        });
        Object.defineProperty(self, "end", {
          get: function () {
            self.___r.extentSelector = null;
            return self.___r.parent;
          },
        });
        if (self.___r.name) {
          var n = self.___r.name;
          Object.defineProperty(self, "end" + n.slice(0, 1).toUpperCase() + n.slice(1), {
            get: function () {
              self.___r.extentSelector = null;
              return self.___r.parent;
            },
          });
        }
        // property for indent
        Object.defineProperty(self, "___", {
          get: function () {
            return self;
          },
        });
      })
        (this);

      for (var propName in structure) {
        if (!structure.hasOwnProperty(propName)) continue;
        if (propName === "_rid") continue;

        // ignore "___", because of reserved word
        if (propName === "___") continue;

        var value = structure[propName];
        if (isArray(value)) {
          setUpReadOnlyProperty(this, propName, new ArrayProp(this, this.___r.data, propName, value, elem));
        } else if (isObject(value)) {
          var valueBooq = new Booq(value, elem, this, /* index */ null, propName);
          setUpReadOnlyProperty(this, propName, valueBooq);
          setUpBooqdProperty(this.___r.data, propName, valueBooq.___r.data);
        } else if (isPrimitive(value)) {
          setUpPrimitiveProperty(this, propName, new PrimitiveProp(this, this.___r.data, propName, value, elem));
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

    Booq.prototype = objectAssign({
      ___base: Base.prototype.constructor,
      ___fullName: function () {
        var fn = "";
        if (this.___r.parent) {
          fn = this.___r.parent.___fullName();
        }
        var me;
        if (isInt(this.___r.index)) {
          me = this.___r.index;
        } else if (isString(this.___r.name)) {
          me = this.___r.name;
        } else {
          me = "(anon)";
        }
        fn += "/(Booq)" + me;
        return fn;
      },
      setData: function (value) {
        if (this.___r.data === value) {
          return;
        }
        var tc = typeCode(value);
        if (!isTypeCodeAssignable(TC_BOOQD, tc)) {
          throw Error("Assigned value type was unmatch.");
        }

        if (Booq.conf.traceSetData) {
          this.___r.traceSetData = [value, stackTraceString(Error())];
        }

        this.___r.data.replaceWith(value);
        this.transmit();
        return this;
      },
      /**
       * Set structure to data.
       * The structure is a parameter of constructor.
       */
      setStructureAsData: function () {
        return this.setData(this.___r.structure);
      },
      update: function () {
        this.___r.update();
        return this;
      },
      setUpdate: function (updater) {
        this.___r.updater = updater;
        return this;
      },
      toHref: function (arg) {
        var callback;
        if (isUndefined(arg)) {
          callback = passthrough;
        } else if (isString(arg)) {
          callback = (function (template) {
            return function (data) {
              var href = template;
              for (var name in data) {
                var v = data[name];
                if (v == null) {
                  v = "";
                }
                if (!isPrimitive(v)) {
                  continue;
                }
                href = href.replace(new RegExp(":" + name + "\\b", "g"), v);
              }
              return href;
            };
          })(arg);
        } else if (isFunction(arg)) {
          callback = arg;
        } else {
          throw Error("Unsupported type of argument");
        }

        return this.to((function (valueCallback) {
          return function (src, value) {
            this.href = valueCallback(value);
          };
        })(callback));
      },
      /**
       * Write-to-binding that is all properties to attributes.
       */
      toAttrs: function () {
        this.qualify(this.___r.toPreferred);
        for (var name in this) {
          if (!this.hasOwnProperty(name)) continue;
          var prop = this[name];
          if (isPrimitiveProp(prop)) {
            prop.copyLink(this).toAttr(name);
          } else {
            throw Error("toAttrs() does not support property of Object.");
          }
        }

        return this.___r.parent;
      },
      transmit: function () {
        var receivers = this.___r.receivers;
        for (var i = 0; i < receivers.length; ++i) {
          var receiver = receivers[i];
          if (receiver === this.___r) continue;
          receiver.receive(this.___r, this.___r.data);
        }
      },
      receive: function (src, value) {
        if (src === this.___r) return;
        this.___r.value = value;
        this.transmit();
      },
    },
      Base.prototype);

    Booq.prototype.constructor = Booq;

    var Booqd = function Booqd(booq) {

      Object.defineProperty(this, '___r', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: {
          booq: booq
        }
      });
    };

    Booqd.prototype = {
      replaceWith: function (data) {
        for (var name in data) {
          if (!data.hasOwnProperty(name)) continue;
          this[name] = data[name];
        }
        this.___r.booq.transmit();
      },
    };

    Booqd.prototype.constructor = Booqd;

    /**
     * 
     * @param {Booqd} bodyBooqd 
     * @param {String} name 
     * @param {Booqd} data 
     */
    function setUpBooqdProperty(body, name, data) {
      (function (body, name, data) {
        Object.defineProperty(body, name, {
          enumerable: true,
          get: function () {
            return data;
          },
          set: function (value) {
            if (data === value) return;
            var tc = typeCode(value);
            if (!isTypeCodeAssignable(TC_BOOQD, tc)) {
              throw Error("Assigned value type was unmatch. Path:" + valueBooq.___fullName());
            }
            data.replaceWith(value);
          }
        });
      })(body, name, data);
    }

    function setUpPrimitiveProperty(booq, name, prop) {
      (function (self, booqPrivates, name, prop, propPrivates) {
        Object.defineProperty(self, name, {
          enumerable: true,
          get: function () {
            propPrivates.ye = null;
            booqPrivates.also = prop;
            return prop;
          }
        });
      })(booq, booq.___r, name, prop, prop.___r);
    }

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

    var PrimitiveProp = function PrimitiveProp(parent, booqd, name, value, elem) {

      this.___base();

      var privates = this.___r;

      objectAssign(privates, {
        parent: parent,
        booqd: booqd,
        self: this,
        name: name,
        value: value,
        typeCode: typeCode(value),
        elem: elem,
        chains: parent,
        conditional: null,
        ye: null,
        updater: funcVoid,
        update: function () {
          this.updater.call(this.self, this.value);
        }
      });

      privates.toPreferred = "down_and_class";
      privates.withPreferred = "down_and_name";

      (function (self, name) {

        Object.defineProperty(self.___r.booqd, name, {
          enumerable: true,
          get: function () {
            return self.___r.value;
          },
          set: function (value) {
            if (value == null || typeCode(value) === TC_PIMITIVE) {
              self.___r.value = value;
              self.transmit();
            } else {
              throw Error("Assigned value type was unmatch.");
            }
          }
        });

      })(this, name);
    };

    PrimitiveProp.prototype = objectAssign({
      ___base: Base.prototype.constructor,
      ___fullName: function () {
        var privates = this.___r;
        var fn = "";
        if (privates.parent) {
          fn = privates.parent.___fullName();
        }
        if (privates.name) {
          fn += "/(PrimitiveProp)" + privates.name;
        }
        return fn;
      },
      update: function () {
        this.___r.update();
        return this;
      },
      setUpdate: function (updater) {
        this.___r.updater = updater;
        return this;
      },
      onReceive: function (fun) {
        var privates = this.___r;
        privates.receivers.push((function (fun, privates) {
          return {
            receive: function (src, value) {
              fun.call(privates.parent, value, privates.booqd);
            }
          };
        })(fun, privates));
        return privates.parent;
      },
      eq: function (condition) {
        var privates = this.___r;
        this.qualify("down_and_class");
        var predicate = (function (condition) {
          return function (value) {
            return condition === value;
          };
        })(condition);
        privates.conditional = new Conditional(privates.parent, privates.ye.clone(), predicate);
        privates.receivers.push(privates.conditional);
        privates.ye = null;
        return privates.conditional;
      },
      isTruthy: function () {
        var privates = this.___r;
        this.qualify("down_and_class");
        var predicate = function (value) {
          return !!value;
        };
        privates.conditional = new Conditional(privates.parent, privates.ye.clone(), predicate);
        privates.receivers.push(privates.conditional);
        privates.ye = null;
        return privates.conditional;
      },
      isFalsy: function () {
        var privates = this.___r;
        this.qualify("down_and_class");
        var predicate = function (value) {
          return !value;
        };
        privates.conditional = new Conditional(privates.parent, privates.ye.clone(), predicate);
        privates.receivers.push(privates.conditional);
        privates.ye = null;
        return privates.conditional;
      },
      toText: function () {
        return this.to(function (src, value) {
          this.textContent = value;
        });
      },
      toAttr: function (attrName, valueCallback) {
        return this.to((function (attrName, valueCallback) {
          return function (src, value) {
            this.setAttribute(attrName, valueCallback(value));
          };
        })(attrName, orPassthrough(valueCallback)));
      },
      toHref: function (arg) {
        var callback;
        if (isUndefined(arg)) {
          callback = passthrough;
        } else if (isString(arg)) {
          callback = valueReplace(arg, new RegExp(":" + this.___r.name + "\\b", "g"));
        } else if (isFunction(arg)) {
          callback = arg;
        } else {
          throw Error("Unsupported type of argument");
        }

        return this.to((function (callback) {
          return function (src, value) {
            this.href = callback(value);
          };
        })(orPassthrough(callback)));
      },
      togglesAttr: function (attrName, attrValue) {
        return this.to((function (attrName, attrValue) {
          return function (src, value) {
            if (value) {
              this.setAttribute(attrName, attrValue);
            } else {
              this.removeAttribute(attrName);
            }
          };
        })(attrName, attrValue));
      },
      antitogglesAttr: function (attrName, attrValue) {
        return this.to((function (attrName, attrValue) {
          return function (src, value) {
            if (!value) {
              this.setAttribute(attrName, attrValue);
            } else {
              this.removeAttribute(attrName);
            }
          };
        })(attrName, attrValue));
      },
      togglesClass: function (className) {
        return this.to((function (className) {
          return function (src, value) {
            if (value) {
              this.classList.add(className);
            } else {
              this.classList.remove(className);
            }
          };
        })(className));
      },
      antitogglesClass: function (className) {
        return this.to((function (className) {
          return function (src, value) {
            if (!value) {
              this.classList.add(className);
            } else {
              this.classList.remove(className);
            }
          };
        })(className));
      },
      withValue: function () {
        this.qualify("down_and_name");
        this.___r.ye.on("change", (function (self) {
          return function (event) {
            self.receive(self, event.target.value);
          };
        })(this));
        return this.to(function (src, value) {
          this.value = value;
        });
      },
      transmit: function () {
        var privates = this.___r;
        var receivers = privates.receivers;
        for (var i = 0; i < receivers.length; ++i) {
          var receiver = receivers[i];
          if (receiver === privates) continue;
          receiver.receive(privates, privates.value);
        }
      },
      receive: function (src, value) {
        var privates = this.___r;
        if (src === privates) return;
        privates.value = value;
        this.transmit();
      },
    },
      Base.prototype);

    PrimitiveProp.prototype.constructor = PrimitiveProp;

    var ArrayProp = function ArrayProp(parent, dataBody, name, array, elem) {

      this.___base();

      objectAssign(this.___r, {
        parent: parent,
        name: name,
        elem: elem,
        chains: parent,
        array: [],
        structure: array[0],
        templates: {},
        eachSets: {},
        ye: null,
      });

      (function (self, dataBody, name) {

        Object.defineProperty(dataBody, name, {
          enumerable: true,
          get: function () {
            return self.___r.array;
          },
          set: function (value) {
            if (self.___r.array === value) return;
            var tc = typeCode(value);
            if (!isTypeCodeAssignable(TC_ARRQD, tc)) {
              throw Error("Assigned value type was unmatch.");
            }
            self.replaceWith(value);
          }
        });

      })(this, dataBody, name);

      (function (self, parent) {
        Object.defineProperty(self, "end", {
          get: function () {
            self.___r.extentSelector = null;
            return parent;
          },
        });
      })
        (this, parent);
    };

    ArrayProp.prototype = objectAssign({
      ___base: Base.prototype.constructor,
      ___fullName: function () {
        var privates = this.___r;
        var fn = "";
        if (privates.parent) {
          fn = privates.parent.___fullName();
        }
        if (privates.name) {
          fn += "/(ArrayProp)" + privates.name;
        }
        return fn;
      },
      each: function (callback) {
        this.qualify("class");
        var privates = this.___r;
        privates.ye.each((function (self, privates) {
          // closure for ye.each() having self and privates
          return function () {

            // eachSet exists for each element.
            var eachSet;

            // Just add callbakc to eachSet if eachSet already exists.
            // Because one element can have only one eachSet.
            if (mergeRid(this)._rid in privates.eachSets) {
              eachSet = privates.eachSets[this._rid];
              eachSet.callbacks.push(callback);
              return;
            }

            //
            // Create eachSet
            //

            // Required firstElementChild to create eachSet.
            // Becuase firstElementChild is used to clone to create element.
            if (!this.firstElementChild) {
              return;
            }

            eachSet = {
              targetElement: this,
              // Template is parent node because of to query subnodes.
              template: this.cloneNode(true),
              callbacks: [callback]
            };
            removeChildAll(this);
            privates.eachSets[this._rid] = eachSet;

            // Receiver is created by each one element
            privates.receivers.push((function (privates, eachSet) {
              return {
                receive: function (src, item, index) {

                  var elem = eachSet.template.cloneNode(true);
                  var childElem = elem.removeChild(elem.firstElementChild);
                  eachSet.targetElement.appendChild(childElem);

                  var booq = null;
                  if (!isPrimitive(privates.structure)) {
                    // name is null because it is skipped in Link::fullPathSelector
                    booq = new Booq(privates.structure, eachSet.targetElement, self, index, /* name */ null);
                  }
                  if (booq) {
                    privates.array.push(booq.data);
                  } else {
                    privates.array.push(item);
                  }

                  for (var i = 0; i < eachSet.callbacks.length; ++i) {
                    var callback = eachSet.callbacks[i];
                    if (booq) {
                      callback.call(booq, eachSet.targetElement, i);
                    } else {
                      callback.call(null, eachSet.targetElement, i);
                    }
                  }
                  if (booq) {
                    booq.data = item;
                  }
                }
              };
            })(privates, eachSet));
          };
        })(this, privates));
        return privates.chains;
      },
      replaceWith: function (array) {
        var privates = this.___r;
        if (privates.ye) {
          privates.ye.each(function () {
            removeChildAll(this);
          });
        }
        privates.array.length = 0;
        var receivers = privates.receivers;
        for (var index = 0; index < array.length; ++index) {
          var item = array[index];
          privates.array.push(item);
          for (var j = 0; j < receivers.length; ++j) {
            receivers[j].receive(this, item, index);
          }
        }
      }
    },
      Base.prototype);

    ArrayProp.prototype.constructor = ArrayProp;

    var Conditional = function Conditional(chains, ye, predicate) {
      this.chains = chains;
      this.ye = ye;
      this.predicate = predicate;
      this.then_ = funcVoid;
    };

    Conditional.prototype = {
      receive: function (src, value) {
        this.then_(value);
      },
      thenToggle: function (className) {
        this.then_ = (function (self, className) {
          return function (value) {
            self.ye.toggleClassByFlag(className, self.predicate(value));
          };
        })(this, className);
        return this.chains;
      },
      thenUntitoggle: function (className) {
        this.then_ = (function (self, className) {
          return function (value) {
            self.ye.toggleClassByFlag(className, !self.predicate(value));
          };
        })(this, className);
        return this.chains;
      },
    };

    Conditional.prototype.constructor = Conditional;

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
      /**
       * Call callback function with seleceted element.
       * 
       * @param {function} callback a callback will be called with each elment by iterating.
       *                            "this" becomes each elemnt in the callback function.
       */
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
        var elemsNotIn = [];
        for (var i = 0; i < ye.elems_.length; ++i) {
          if (this.elems_.indexOf(ye.elems_[i]) === -1) {
            elemsNotIn.push(ye.elems_[i]);
          }
        }
        if (elemsNotIn.length > 0) {
          this.elems_ = this.elems_.concat(elemsNotIn);
        }
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
      addClass: function (className) {
        this.each(function () {
          this.classList.add(className);
        });
        return this;
      },
      removeClass: function (className) {
        this.each(function () {
          this.classList.remove(className);
        });
        return this;
      },
      toggleClassByFlag: function (className, flag) {
        if (flag) {
          this.addClass(className);
        } else {
          this.removeClass(className);
        }
        return this;
      },
      addAttr: function (attrName, value) {
        this.each(function () {
          this.setAttribute(attrName, value);
        });
        return this;
      },
      removeAttr: function (attrName) {
        this.each(function () {
          this.removeAttribute(attrName);
        });
        return this;
      },
      toggleAttrByFlag: function (attrName, value, flag) {
        if (flag) {
          this.addAttr(attrName);
        } else {
          this.removeAttr(attrName);
        }
        return this;
      },
      on: function (eventName, listener, opts) {
        this.each(function () {
          this.addEventListener(eventName, listener, opts);
        });
        return this;
      },
      containsAll: function (className) {
        var b = true;
        this.each(function () {
          b = b && this.classList.contains(className);
        });
        return b;
      },
      containsSome: function (className) {
        var b = false;
        this.each(function () {
          b = b || this.classList.contains(className);
        });
        return b;
      },
    };

    Ye.prototype.constructor = Ye;

    Booq.goUpParent = goUpParent;
    Booq.goUpParentByTagName = goUpParentByTagName;

    //
    // Global configuration
    //

    var defaultConf = {
      traceQualify: false,
      traceSetData: false,
    };

    Booq.configure = (function () {

      var holder = {
        conf: objectAssign({}, defaultConf)
      };

      Object.defineProperty(Booq, "conf", {
        enumerable: true,
        get: function () {
          return holder.conf;
        }
      });

      return function (conf) {

        if (!conf) {
          return holder.conf;
        }

        var prevConf = holder.conf;
        holder.conf = objectAssign({}, holder.conf, conf);

        return prevConf;
      };
    })();

    return Booq;
  })();

});