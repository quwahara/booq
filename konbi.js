(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // <script>
    console.log("script xx");
    Konbi = definition();
    console.log(Konbi);
  }
})(function () {
  'use strict';
  return (function () {

    var ridMin, ridMax;
    ridMin = 100000000000000;
    ridMax = ridMin * 10 - 1;

    function rid() {
      return "_" + (Math.floor(Math.random() * (ridMax - ridMin + 1)) + ridMin).toString(10);
    }

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

    var inherits = function (super_, ctor) {
      ctor.prototype = Object.create(super_.prototype);
      ctor.prototype._super = super_;
      ctor.prototype.constructor = ctor;
      return ctor;
    };

    var isInstanceOf = function isInstanceOf(target, expectedCtor) {
      var targetCtor, super_;
      if (target == null) return false;
      targetCtor = target.constructor;
      if (targetCtor === expectedCtor) return true;
      if (targetCtor.prototype && targetCtor.prototype._super) {
        super_ = targetCtor.prototype._super;
      } else {
        super_ = null;
      }
      while (super_) {
        if (super_ === expectedCtor) return true;
        if (super_.prototype && super_.prototype._super) {
          super_ = super_.prototype._super;
        } else {
          super_ = null;
        }
      }
      return false;
    };


    var Event, PrimitivePropEvent, Dispatcher, List, Dict, ListProperty,
      DictProperty, PrimitiveProperty;


    Event = inherits(Object, function (type, target) {
      this.type = type;
      this.target = target;
    });


    PrimitivePropEvent = inherits(Event, function (type, target, propName, value) {
      Event.call(this, type, target);
      this.propName = propName;
      this.value = value;
    });


    Dispatcher = inherits(Object, function () {
      (function (self) {

        // listener repository
        // Holding event listener lists by event name as key.
        var _r;

        self._r = _r = {};

        self.on = function (eventType, fun) {
          var listeners, listener;
          listeners = _r[eventType];
          if (!listeners) {
            _r[eventType] = listeners = [];
          }
          for (var i = 0; i < listeners.length; i++) {
            listener = listeners[i];
            if (listener === fun) return false;
          }
          listeners.push(fun);
          return true;
        };

        self.off = function (eventType, fun) {
          var listeners, listener;
          listeners = _r[eventType];
          if (!listeners) return false;
          for (var i = 0; i < listeners.length; i++) {
            listener = listeners[i];
            if (listener === fun) {
              listeners.splice(0, 1);
              return true;
            }
          }
          return false;
        };

        self.dispatch = function (event, args) {

          var eventType;
          if (isString(event)) {
            eventType = event;
          } else if (event && isInstanceOf(event, Event)) {
            eventType = event.type;
          } else {
            throw new Error("event parameter was bad");
          }

          var listeners = _r[eventType];
          if (!listeners) return;

          var args2 = [].concat(event, args);
          for (var i = 0; i < listeners.length; i++) {
            listeners[i].apply(self, args2);
          }
        };

      })(this);
    });

    List = inherits(Dispatcher, function (array, listenerRepo) {

      Dispatcher.call(this, listenerRepo);

      (function (self, array) {

        self.push = function (item) {
          array.push(item);
          self.dispatch(new Event("push", self));
          self.dispatch(new Event("change", self));
        };

        self.handoverTo = function (newArray) {
          array = newArray.splice(0, newArray.length);
        };

      })(this, array.splice(0, array.length));
    });

    function getType(v) {
      if (v == null || isPrimitive(v)) {
        return "primitive";
      } else if (Array.isArray(v)) {
        return "array";
      } else if (isObject(v)) {
        return "object";
      } else {
        return null;
      }
    }

    Dict2 = inherits(Object, function (object) {

      Dispatcher.call(this);

      var self = this;

      self._rid = rid();

      Object.defineProperty(this, "_meta", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: {
          origin: object,
          props: {},
        },
      });

      self.set = function (src, propName, value) {
        var propInfo, listener, setter;
        if (this._meta.origin[propName] === value) return;
        this._meta.origin[propName] = value;
        propInfo = this._meta.props[propName];
        if (!propInfo) return;
        for (var i = 0; i < propInfo.listeners.length; i++) {
          listener = propInfo.listeners[i];
          if (listener === src) continue;
          setter = propInfo.setters[listener._rid];
          if (!setter) continue;
          setter(value);
        }
      };
      
      function prepareProp(self, object, name) {
        var rid_, propInfo;
        rid_ = rid();
        propInfo = {
          rid: rid_,
          type_: getType(object[name]),
          setters: {},
        };

        self._meta.props[name] = propInfo;
        preparePrimitiveProp(self, object, name);
      }

      function preparePrimitiveProp(self, object, name) {
        (function (self, object, name) {
          Object.defineProperty(self, name, {
            get: function () {
              return object[name];
            },
            set: function (value_) {
              var type_ = getType(value_);
              if (type_ != "primitive") {
                throw new Error("Value type must be primitive");
              }
              if (object[name] === value_) return;
              object[name] = value_;
            }
          });
        })(self, object, name);
      }

      for (var name in object) {
        if (!object.hasOwnProperty(name)) continue;
        prepareProp(this, object, name);
      }

    });

    Dict = inherits(Dispatcher, function (object) {

      Dispatcher.call(this);

      (function (self, object) {

        var 
        // element repository
        // Holding element lists by event name as key.
        _elr,
        // Dispatching context repository
        _dcr,
        // property event listener repository
        _plr;

        self._elr = _elr = {};
        self._dcr = _dcr = {};
        self._plr = _plr = {};

        function prepareProp(name, value) {

          var value2, type = getType(value);

          function preparePrimitiveProp(name, value) {
            (function (name, value) {
              Object.defineProperty(self, name, {
                get: function () {
                  return value;
                },
                set: function (value_) {
                  var type_ = getType(value_);
                  if (type_ != "primitive") {
                    throw new Error("Value type must be primitive");
                  }
                  if (value === value_) return;
                  value = value_;
                  self.dispatch(new PrimitivePropEvent(name + "@change", self, name, value));
                }
              });
            })(name, value);
          }

          if (type === "primitive") {
            preparePrimitiveProp(name, value);
          } else if (type === "array") {
            value2 = new List(value);
          } else if (type === "object") {
            value2 = new Dict(value);
          } else {
            throw new Error("Unspported type");
          }
        }
        // end of prepareProp

        for (var name in object) {
          if (!object.hasOwnProperty(name)) continue;
          prepareProp(name, object[name]);
        }

      })(this, object);
    });
    // end of Dict
    // begin of Dict.prototype
    (function (P) {

      P.assignRid = function (elem) {
        if (!elem.dataset._rid) elem.dataset._rid = rid();
      };

      P.concatPropNameAndEventType = function (propName, eventType) {
        return propName + "@" + eventType;
      };

      P.holdElement = function (propNameAndEventType, elem) {
        var elements = this.getElements(propNameAndEventType),
          element;
        for (var i = 0; i < elements.length; i++) {
          element = elements[i];
          if (element.dataset._rid === elem.dataset._rid) return false;
        }
        elements.push(elem);
        return true;
      };

      P.getElements = function (propNameAndEventType) {
        var elements = this._elr[propNameAndEventType];
        if (!elements) {
          this._elr[propNameAndEventType] = elements = [];
        }
        return elements;
      };

      P.getDispatchingCtx = function (propNameAndEventType) {
        var dispatchingCtx = this._dcr[propNameAndEventType];
        if (!dispatchingCtx) {
          this._dcr[propNameAndEventType] = dispatchingCtx = {
            propNameAndEventType: null,
            targetElement: null,
            targetObject: null,
            targetPropName: null,
          };
        }
        return dispatchingCtx;
      };

      P.preparePropEventListener = function (propNameAndEventType) {
        var listener, dispatchingCtx;
        listener = this._plr[propNameAndEventType];
        if (!listener) {
          dispatchingCtx = this.getDispatchingCtx(propNameAndEventType);
          listener = (function (self, propNameAndEventType, ctx) {
            var isHandling = false;
            return function (event) {
              if (isHandling) return;
              isHandling = true;
              var elements, element;
              elements = self.getElements(propNameAndEventType);
              for (var i = 0; i < elements.length; i++) {
                element = elements[i];
                if (ctx.targetElement === element) continue;
                if (element.value != null) {
                  elemPropName = "value";
                } else if (element.textContent != null) {
                  elemPropName = "textContent";
                }
                if (elemPropName) {
                  element[elemPropName] = event.value;
                }
              }
              isHandling = false;
            };
          })(this, propNameAndEventType, dispatchingCtx);
          this._plr[propNameAndEventType] = listener;
          this.on(propNameAndEventType, listener);
        }
      };

      P.transmit = function (propName, eventType, elem) {

        var propNameAndEventType;

        this.assignRid(elem.dataset);
        propNameAndEventType = this.concatPropNameAndEventType(propName, eventType);
        this.holdElement(propNameAndEventType, elem);

        (function (self, propName, eventType, propNameAndEventType, elem) {
          var propListner, onPropListner, offPropListner,
            master;
          propListner = function (event) {
            var elements, element, elemPropName;
            if (master === elem) return;
            offPropListner();
            master = self;
            elements = self.getElements(propNameAndEventType);
            for (var i = 0; i < elements.length; i++) {
              element = elements[i];
              if (element.value != null) {
                elemPropName = "value";
              } else if (element.textContent != null) {
                elemPropName = "textContent";
              }
              if (elemPropName) {
                element[elemPropName] = event.value;
              }
            }
            master = null;
            onPropListner();
          };
          onPropListner = function () {
            self.on(propNameAndEventType, propListner);
          };
          offPropListner = function () {
            self.off(propNameAndEventType, propListner);
          };
          onPropListner();
        })(this, propName, eventType, propNameAndEventType, elem);
      };

      P.transceive = function (propName, eventType, elem) {

        var propNameAndEventType;

        this.assignRid(elem.dataset);

        propNameAndEventType = this.concatPropNameAndEventType(propName, eventType);
        this.holdElement(propNameAndEventType, elem);

        (function (self, propName, eventType, propNameAndEventType, elem) {
          var propListner, onPropListner, offPropListner,
            elemListener, addElemListener, removeElemListener,
            masterObject, masterPropName, masterElem;
          propListner = function (event) {
            offPropListner();
            masterObject = event.target;
            masterPropName = event.propName;
            elements = self.getElements(propNameAndEventType);
            for (var i = 0; i < elements.length; i++) {
              element = elements[i];
              if (masterElem === element) continue;
              if (element.value != null) {
                elemPropName = "value";
              } else if (element.textContent != null) {
                elemPropName = "textContent";
              }
              if (elemPropName) {
                element[elemPropName] = event.value;
              }
            }
            masterPropName = null;
            masterObject = null;
            onPropListner();
          };
          elemListener = function (event) {
            removeElemListener();
            masterElem = event.target;
            if (!(self === masterObject && propName === masterPropName)) {
              self[propName] = event.target.value;
            }
            masterElem = null;
            addElemListener();
          };
          onPropListner = function () {
            self.on(propNameAndEventType, propListner);
          };
          offPropListner = function () {
            self.off(propNameAndEventType, propListner);
          };
          addElemListener = function () {
            elem.addEventListener(eventType, elemListener);
          };
          removeElemListener = function () {
            elem.removeEventListener(eventType, elemListener);
          };
          onPropListner();
          addElemListener();
        })(this, propName, eventType, propNameAndEventType, elem);
      };


    })(Dict.prototype);

    var Konbi = function Konbi(options) {

      if (!isObject(options.entities)) {
        throw new Error("The entities parameter must be an Object");
      }

      (function (self, options) {

        self.entities = new Dict(options.entities);

      })(this, options);
    };

    return Konbi;
  })();

});