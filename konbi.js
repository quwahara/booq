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
      return (Math.floor(Math.random() * (ridMax - ridMin + 1)) + ridMin).toString(10);
    }

    function isString(v) {
      return (typeof v) === "string";
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
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



    Dict = inherits(Dispatcher, function (object) {

      Dispatcher.call(this);

      (function (self, object) {


        // element repository
        // Holding element lists by event name as key.
        var _e;

        self._e = _e = {};
        
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

          // (function (name, value, type) {
          //   Object.defineProperty(self, name, {
          //     get: function () {
          //       return value;
          //     },
          //     set: function (value_) {

          //       var type_ = getType(value_),
          //         args;

          //       if (type_ != type) {
          //         throw new Error("Type of Value must be same");
          //       }

          //       if (type === "primitive") {
          //         if (value === value_) return;
          //         value = value_;
          //         self.dispatch("change");
          //       } else if (type === "array") {
          //         args = {
          //           value: new List(value_),
          //           oldValue: value
          //         };
          //         value = args.value;
          //         self.dispatch("change", args);
          //       } else if (type === "object") {
          //         args = {
          //           value: new Dict(value_),
          //           oldValue: value
          //         };
          //         value = args.value;
          //         self.dispatch("change", args);
          //       } else {
          //         throw new Error("Unspported type");
          //       }

          //     }
          //   });
          // })(name, value2, type);

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
      
      P.getElements = function (eventType) {
        var elements = this._e[eventType];
        if (!elements) {
          this._e[eventType] = elements = [];
        }
        return elements;
      };

      P.holdElement = function (eventType, elem) {
        var elements = this.getElements(eventType), element;
        for (var i = 0; i < elements.length; i++) {
          element = elements[i];
          if (element.dataset._rid === elem.dataset._rid) return false;
        }
        elements.push(elem);
        return true;
      };

      P.transmit = function (propName, eventType, elem) {

        this.assignRid(elem);
        this.holdElement(eventType, elem);

        (function (self, propName, eventType, elem) {
          var propListner, onPropListner, offPropListner,
            master;
          propListner = function (event) {
            var elements, element, elemPropName;
            if (master === elem) return;
            offPropListner();
            master = self;
            elements = self.getElements(eventType);
            for (var i = 0; i < elements.length; i++) {
              element = elements[i];
              if (element.value != null) {
                elemPropName  = "value";
              } else if (element.textContent != null) {
                elemPropName  = "textContent";
              }
              if (elemPropName) {
                element[elemPropName] = event.value;
              }
            }
            master = null;
            onPropListner();
          };
          onPropListner = function () {
            self.on(propName + "@" + eventType, propListner);
          };
          offPropListner = function () {
            self.off(propName + "@" + eventType, propListner);
          };
          onPropListner();
        })(this, propName, eventType, elem);
      };
      P.transceive = function (propName, eventType, elem) {

        this.assignRid(elem);
        this.holdElement(eventType, elem);

        (function (self, propName, eventType, elem) {
          var propListner, onPropListner, offPropListner,
            elemListener, addElemListener, removeElemListener,
            master;
          propListner = function (event) {
            if (master === elem) return;
            offPropListner();
            master = self;
            elements = self.getElements(eventType);
            for (var i = 0; i < elements.length; i++) {
              element = elements[i];
              if (element.value != null) {
                elemPropName  = "value";
              } else if (element.textContent != null) {
                elemPropName  = "textContent";
              }
              if (elemPropName) {
                element[elemPropName] = event.value;
              }
            }
            master = null;
            onPropListner();
          };
          elemListener = function (event) {
            if (master === self) return;
            removeElemListener();
            master = event.target;
            self[propName] = event.target.value;
            master = null;
            addElemListener();
          };
          onPropListner = function () {
            self.on(propName + "@" + eventType, propListner);
          };
          offPropListner = function () {
            self.off(propName + "@" + eventType, propListner);
          };
          addElemListener = function () {
            elem.addEventListener(eventType, elemListener);
          };
          removeElemListener = function () {
            elem.removeEventListener(eventType, elemListener);
          };
          onPropListner();
          addElemListener();
        })(this, propName, eventType, elem);
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