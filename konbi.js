;
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

    var inherits = function (base, ctor) {
      ctor.prototype = Object.create(base.prototype);
      ctor.prototype.constructor = ctor;
      return ctor;
    };



    var Event = inherits(Object, function (type, target) {
      this.type = type;
      this.target = target;
    });

    var Dispatcher, List, Dict, ListProperty, DictProperty, PrimitiveProperty;



    Dispatcher = inherits(Object, function () {
      (function (self) {

        // listener repository
        // Holding event listener lists by event name as key.
        var _r;
        
        self._r = _r = {};

        self.on = function (eventType, fun) {
          var listeners = _r[eventType];
          if (!listeners) {
            _r[eventType] = listeners = [];
          }
          listeners.push(fun);
        };

        self.dispatch = function (event, args) {

          var eventType;
          if (isString(event)) {
            eventType = event;
          } else if (event && event.prototype.constructor === Event) {
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

        function prepareProp(name, value) {

          var value2, type = getType(value);

          if (type === "primitive") {
            value2 = value;
          } else if (type === "array") {
            value2 = new List(value);
          } else if (type === "object") {
            value2 = new Dict(value);
          } else {
            throw new Error("Unspported type");
          }

          (function (name, value, type) {
            Object.defineProperty(self, name, {
              get: function () {
                return value;
              },
              set: function (value_) {

                var type_ = getType(value_),
                  args;

                if (type_ != type) {
                  throw new Error("Type of Value must be same");
                }

                if (type === "primitive") {
                  if (value === value_) return;
                  value = value_;
                  self.dispatch("change");
                } else if (type === "array") {
                  args = {
                    value: new List(value_),
                    oldValue: value
                  };
                  value = args.value;
                  self.dispatch("change", args);
                } else if (type === "object") {
                  args = {
                    value: new Dict(value_),
                    oldValue: value
                  };
                  value = args.value;
                  self.dispatch("change", args);
                } else {
                  throw new Error("Unspported type");
                }

              }
            });
          })(name, value2, type);

        }
        // end of prepareProp

        for (var name in object) {
          if (!object.hasOwnProperty(name)) continue;
          prepareProp(name, object[name]);
        }

      })(this, object);
    });
    // end of Dict

    // ListProperty = inherits(Dispatcher, function (object, prop) {
    //   this.object = object;
    //   this.prop = prop;
    //   this.value = new List(object[prop]);
    //   (function (self) {
    //     Object.defineProperty(object, prop, {
    //       get: function () {
    //         return self.value;
    //       },
    //       set: function (value) {
    //         if (!(value && (Array.isArray(value) || value.constructor === List))) {
    //           throw new Error("Unspported type");
    //         }
    //         if (self.value === value) return;
    //         self.value.handoverTo(value);
    //         self.dispatch(new Event("change", self));
    //       }
    //     });
    //   })(this);
    // });

    // DictProperty = inherits(Dispatcher, function (object, prop) {
    //   this.object = object;
    //   this.prop = prop;
    //   this.value =  new Dict(object[prop]);
    //   (function (self) {
    //     Object.defineProperty(object, prop, {
    //       get: function () {
    //         return self.value;
    //       },
    //       set: function (value) {
    //         if (!(value && (Array.isArray(value) || value.constructor === List))) {
    //           throw new Error("Unspported type");
    //         }
    //         if (self.value === value) return;
    //         self.value.handoverTo(value);
    //         self.dispatch(new Event("change", self));
    //       }
    //     });
    //   })(this);
    // });

    // PrimitiveProperty = inherits(Dispatcher, function (object, prop) {
    //   (function (self, object, prop, value) {
    //     Object.defineProperty(object, prop, {
    //       get: function () {
    //         return value;
    //       },
    //       set: function (value_) {
    //         if (value === value_) return;
    //         value = value_;
    //         dispatch(new Event("change", object));
    //       }
    //     });
    //   })(this, object, prop, object[prop]);
    // });

    // function toDispacher(subject) {
    //   if (isObject(subject)) {
    //     return new Dict(subject);
    //   } else if (Array.isArray(subject)) {
    //     return new List(subject);
    //   }
    //   throw new Error("Unspported type");
    // }

    var Konbi = function Konbi(options) {

      if (!isObject(options.entities)) {
        throw new Error("The entities parameter must be an Object");
      }

      (function (self, options) {

        self.entities = new Dict(options.entities);

        self.getEntity = function (hint) {
          return null;
        };

        self.getElement = function (hint) {
          var elm;
          if (isString(hint)) {
            if (hint.substr(0, 1) === "#") {
              elm = document.getElementById(hint.substr(1, hint.length - 1));
            }
          }
          return elm;
        };

        self.on = function (element, type, fun, options) {
          var elm;
          if (isString(element)) {
            if (element.substr(0, 1) === "#") {
              elm = document.getElementById(element.substr(1, element.length - 1));
            }
            if (elm == null) {
              throw new Error("The element was not found");
            }
          } else {
            elm = element;
          }
          elm.addEventListener(type, fun.bind(self), options);
        }

      })(this, options);
    };

    return Konbi;
  })();

});