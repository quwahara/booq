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

    function funcVoid() {}

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
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Booq;
    }

    function isBooqd(target) {
      var proto;
      if (target == null) return;
      proto = Object.getPrototypeOf(target);
      return proto && proto.constructor === Booqd;
    }

    function isPrimitiveProp(target) {
      var proto;
      if (target == null) return;
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
        } else if (preferredLink != null) {
          this.link(preferredLink);
          return getProxy(this).ye;
        } else {
          throw Error("requires link() before calling.");
        }
      },
      /**
       * Copy status from src.
       * This actually clones and copies ye from src.
       * 
       * @param {(Link|Booq|PrimitiveProp)} src 
       */
      copyLink: function (src) {
        getProxy(this).ye = getProxy(src).ye.clone();
        return this;
      },
    };

    var Booq = function Booq(structure, elem, parent, name) {

      if (!isObject(structure)) {
        throw Error("'structure' must be an Object.");
      }

      elem = elem || document;

      var privates = setProxy(mergeRid(this), {
        self: this,
        structure: structure,
        data: new Booqd(this),
        parent: parent || null,
        name: name || null,
        elem: elem,
        ye: null,
        receivers: [],
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

      (function (self, privates) {
        Object.defineProperty(self, "data", {
          get: function () {
            return privates.data;
          },
          set: function (value) {
            self.setData(value);
          }
        });
        Object.defineProperty(self, "also", {
          get: function () {
            var prop = privates.also;
            if (prop) {
              getProxy(prop).ye = null;
              return prop;
            } else {
              return null;
            }
          },
        });
        Object.defineProperty(self, "end", {
          get: function () {
            return privates.parent;
          },
        });
      })
      (this, privates);

      for (var propName in structure) {
        if (!structure.hasOwnProperty(propName)) continue;
        if (propName === "_rid") continue;

        var value = structure[propName];
        if (isArray(value)) {
          setUpReadOnlyProperty(this, propName, new ArrayProp(this, privates.data, propName, value, elem));
        } else if (isObject(value)) {
          var valueBooq = new Booq(value, elem, this, propName);
          setUpReadOnlyProperty(this, propName, valueBooq);
          setUpBooqdProperty(privates.data, propName, getProxy(valueBooq).data);
        } else if (isPrimitive(value)) {
          setUpPrimitiveProperty(this, propName, new PrimitiveProp(this, privates.data, propName, value, elem));
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
        fullname: function () {
          var privates = getProxy(this);
          var fn = "";
          if (privates.parent) {
            fn = privates.parent.fullname();
          }
          if (privates.name) {
            fn += "/" + privates.name;
          }
          return fn;
        },
        setData: function (value) {
          var privates = getProxy(this);
          if (privates.data === value) return;
          var tc = typeCode(value);
          if (!isTypeCodeAssignable(TC_BOOQD, tc)) {
            throw Error("Assigned value type was unmatch.");
          }
          privates.data.replaceWith(value);
          this.transmit();
          return this;
        },
        /**
         * Set structure to data.
         * The structure is a parameter of constructor.
         */
        setStructureAsData: function () {
          return this.setData(getProxy(this).structure);
        },
        update: function () {
          getProxy(this).update();
          return this;
        },
        setUpdate: function (updater) {
          getProxy(this).updater = updater;
          return this;
        },
        to: function (receiver) {
          var privates = getProxy(this);
          privates.receivers.push(receiver);
          return this;
        },
        toHref: function (arg) {
          var privates = getProxy(this);
          this.qualify("class");

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

          return this.to((function (ye, valueCallback) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  this.href = valueCallback(value);
                });
              }
            };
          })(privates.ye.clone(), callback));
        },
        /**
         * Write-to-binding that is all properties to attributes.
         */
        toAttrs: function () {
          var privates = getProxy(this);
          this.qualify("class");

          for (var name in this) {
            if (!this.hasOwnProperty(name)) continue;
            var prop = this[name];
            if (isPrimitiveProp(prop)) {
              prop.copyLink(this).toAttr(name);
            } else {
              throw Error("toAttrs() does not support property of Object.");
            }
          }

          return privates.parent;
        },
        transmit: function () {
          let privates = getProxy(this);
          var receivers = privates.receivers;
          for (var i = 0; i < receivers.length; ++i) {
            var receiver = receivers[i];
            if (receiver === privates) continue;
            receiver.receive(privates, privates.data);
          }
        },
        receive: function (src, value) {
          var privates = getProxy(this);
          if (src === privates) return;
          privates.value = value;
          this.transmit();
        },
      },
      Linker.prototype);

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
        getProxy(this).booq.transmit();
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
              throw Error("Assigned value type was unmatch. Path:" + valueBooq.fullname());
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
      })(booq, getProxy(booq), name, prop, getProxy(prop));
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

    var PrimitiveProp = function PrimitiveProp(booq, booqd, name, value, elem) {

      (function (self, name, privates) {

        Object.defineProperty(privates.booqd, name, {
          enumerable: true,
          get: function () {
            return privates.value;
          },
          set: function (value) {
            if (value == null || typeCode(value) === TC_PIMITIVE) {
              privates.value = value;
              self.transmit();
            } else {
              throw Error("Assigned value type was unmatch.");
            }
          }
        });

      })(this, name, setProxy(mergeRid(this), {
        booq: booq,
        booqd: booqd,
        self: this,
        name: name,
        value: value,
        typeCode: typeCode(value),
        elem: elem,
        ye: null,
        receivers: [],
        updater: funcVoid,
        update: function () {
          this.updater.call(this.self, this.value);
        }
      }));
    };

    PrimitiveProp.prototype = objectAssign({
        update: function () {
          getProxy(this).update();
          return this;
        },
        setUpdate: function (updater) {
          getProxy(this).updater = updater;
          return this;
        },
        onReceive: function (fun) {
          var privates = getProxy(this);
          privates.receivers.push((function (fun, privates) {
            return {
              receive: function (src, value) {
                fun.call(privates.booq, value, privates.booqd);
              }
            };
          })(fun, privates));
          return privates.booq;
        },
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
        toAttr: function (attrName, valueCallback) {
          var privates = getProxy(this);
          this.qualify("class");
          return this.to((function (ye, attrName, valueCallback) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  this.setAttribute(attrName, valueCallback(value));
                });
              }
            };
          })(privates.ye.clone(), attrName, orPassthrough(valueCallback)));
        },
        toHref: function (arg) {
          var privates = getProxy(this);
          this.qualify("class");

          var callback;
          if (isUndefined(arg)) {
            callback = passthrough;
          } else if (isString(arg)) {
            callback = valueReplace(arg, new RegExp(":" + privates.name + "\\b", "g"));
          } else if (isFunction(arg)) {
            callback = arg;
          } else {
            throw Error("Unsupported type of argument");
          }

          return this.to((function (ye, valueCallback) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  this.href = valueCallback(value);
                });
              }
            };
          })(privates.ye.clone(), callback));
        },
        togglesAttr: function (attrName, attrValue) {
          var privates = getProxy(this);
          this.qualify("class");
          return this.to((function (ye, attrName, attrValue) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  if (value) {
                    this.setAttribute(attrName, attrValue);
                  } else {
                    this.removeAttribute(attrName);
                  }
                });
              }
            };
          })(privates.ye.clone(), attrName, attrValue));
        },
        antitogglesAttr: function (attrName, attrValue) {
          var privates = getProxy(this);
          this.qualify("class");
          return this.to((function (ye, attrName, attrValue) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  if (!value) {
                    this.setAttribute(attrName, attrValue);
                  } else {
                    this.removeAttribute(attrName);
                  }
                });
              }
            };
          })(privates.ye.clone(), attrName, attrValue));
        },
        togglesClass: function (className) {
          var privates = getProxy(this);
          this.qualify("class");
          return this.to((function (ye, className) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  if (value) {
                    this.classList.add(className);
                  } else {
                    this.classList.remove(className);
                  }
                });
              }
            };
          })(privates.ye.clone(), className));
        },
        antitogglesClass: function (className) {
          var privates = getProxy(this);
          this.qualify("class");
          return this.to((function (ye, className) {
            return {
              receive: function (src, value) {
                ye.each(function () {
                  if (this === src) return;
                  if (!value) {
                    this.classList.add(className);
                  } else {
                    this.classList.remove(className);
                  }
                });
              }
            };
          })(privates.ye.clone(), className));
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
        addClass: function (className) {
          var privates = getProxy(this);
          var name = privates.name;
          var selector = "." + name + ", " +
            "[name='" + name + "'], " +
            "#" + name;
          this.qualify(selector).addClass(className);
        },
        on: function (eventName, listener, opts) {
          var privates = getProxy(this);
          var ye = this.qualify("name").clone();
          ye.on(eventName, (function (self, listener) {
            return function (event) {
              listener.call(self, event);
            };
          })(this, listener), opts);
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
          this.transmit();
        },
      },
      Linker.prototype);

    PrimitiveProp.prototype.constructor = PrimitiveProp;

    var ArrayProp = function ArrayProp(booq, dataBody, name, array, elem) {
      var privates = setProxy(mergeRid(this), {
        booq: booq,
        name: name,
        elem: elem,
        array: [],
        receivers: [],
        structure: array[0],
        templates: {},
        eachSets: {},
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

      (function (self, parent) {
        Object.defineProperty(self, "end", {
          get: function () {
            return parent;
          },
        });
      })
      (this, booq);
    };

    ArrayProp.prototype = objectAssign({
        fullname: function () {
          var privates = getProxy(this);
          var fn = "";
          if (privates.parent) {
            fn = privates.parent.fullname();
          }
          if (privates.name) {
            fn += "/" + privates.name;
          }
          return fn;
        },
        each: function (callback) {
          this.qualify("class");
          var privates = getProxy(this);
          privates.ye.each(function () {
            var eachSet;
            if (mergeRid(this)._rid in privates.eachSets) {
              eachSet = privates.eachSets[this._rid];
              eachSet.callbacks.push(callback);
            } else {
              if (this.firstElementChild) {
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
                    receive: function (src, item) {
                      var elem = eachSet.template.cloneNode(true);
                      var booq = null;
                      if (!isPrimitive(privates.structure)) {
                        booq = new Booq(privates.structure, elem, privates.booq, privates.name + "[]");
                      }
                      for (var i = 0; i < eachSet.callbacks.length; ++i) {
                        var callback = eachSet.callbacks[i];
                        if (booq) {
                          callback.call(booq, elem, i);
                        } else {
                          callback.call(null, elem, item);
                        }
                      }
                      if (booq) {
                        booq.data = item;
                        privates.array.push(booq.data);
                      } else {
                        privates.array.push(item);
                      }
                      eachSet.targetElement.appendChild(elem.removeChild(elem.firstElementChild));
                    }
                  };
                })(privates, eachSet));
              }
            }
          });
          return privates.booq;
        },
        callFunctionWithThis: function (fun) {
          fun(this);
          return getProxy(this).booq;
        },
        replaceWith: function (array) {
          var privates = getProxy(this);
          privates.array.length = 0;
          var receivers = privates.receivers;
          for (var i = 0; i < array.length; ++i) {
            var item = array[i];
            for (var ii = 0; ii < receivers.length; ++ii) {
              receivers[ii].receive(this, item);
            }
          }
        }
      },
      Linker.prototype);

    ArrayProp.prototype.constructor = ArrayProp;

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

    return Booq;
  })();

});