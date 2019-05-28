(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // script
    Olbi = definition();
  }
})(function () {
  'use strict';
  return (function () {


    function isArray(v) {
      return Array.isArray(v);
    }

    function isInt(v) {
      return v === parseInt(v, 10);
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
    }

    function isPrimitive(v) {
      if (v == null) return false;
      var t = typeof v;
      return t === "string" || t === "number" || t === "boolean";
    }

    function isString(v) {
      return typeof v === "string";
    }

    function clone(value) {

      if (isObject(value)) {
        return cloneObject(value);
      }

      if (isArray(value)) {
        return cloneArray(value);
      }

      return value;
    }

    function argumentsToArray(args) {
      return (args.length === 1 ? [args[0]] : Array.apply(null, args));
    }

    function superConstructorOf(instance) {
      return Object.getPrototypeOf(Object.getPrototypeOf(instance)).constructor;
    }

    function callSuperConstructorOf(instance, varArguments) {
      var args = argumentsToArray(arguments);
      args.shift();
      return superConstructorOf(instance).apply(instance, args);
    }


    function cloneArray(array) {
      return array.map(clone);
    }

    function cloneObject(object) {
      var theClone = {};
      for (var key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) {
          continue;
        }
        theClone[key] = clone(object[key]);
      }
      return theClone;
    }

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

    /**
     * 
     * @param {Object} target 
     * @param {Array} sources 
     * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
     * @see https://github.com/saikojosh/Object-Assign-Deep
     */
    function objectAssignDeep(target, sources) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var target2 = Object(target);

      for (var i = 1; i < arguments.length; ++i) {
        var source = arguments[i];

        if (source == null) {
          continue;
        }

        for (var key in source) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (!Object.prototype.hasOwnProperty.call(source, key)) {
            continue;
          }

          var sVal = source[key];
          var tVal = target2[key];
          var sValClone;

          if (isObject(sVal)) {
            sValClone = cloneObject(sVal);
            if (isObject(tVal)) {
              target2[key] = objectAssignDeep(tVal, sValClone);
            } else {
              target2[key] = sValClone;
            }
            continue;
          }

          if (isArray(sVal)) {
            sValClone = cloneArray(sVal);
            if (isArray(tVal)) {
              target2[key] = tVal.concat(sValClone);
            } else {
              target2[key] = sValClone;
            }
            continue;
          }

          target2[key] = sVal;
        }

      }
      return target2;
    }

    function removeChildAll(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      return parent;
    }

    function stackTraceString(error) {
      var stack = error.stack;
      if (isString(stack)) {
        stack = stack.split("\n");
      }
      return stack;
    }

    // Object.defineProperty alias
    var dp = Object.defineProperty.bind(Object);

    // Define read only property
    function dpReadOnly(object, name, value, enumerable) {
      dp(object, name, {
        enumerable: !!enumerable,
        get: (function (value) {
          return function () {
            return value;
          };
        })(value),
      });
    }

    function toArray(elementList) {
      return Array.prototype.slice.call(elementList);
    }

    // Element collection
    var Ecol = function Ecol(arg) {

      dpReadOnly(this, "___r", {
        queried: false,
      }, false);

      this.elems = [];
      this.clear();

      if (isString(arg)) {
        this.query(arg);
      }

    };

    Ecol.prototype = {

      clear: function () {
        this.___r.queried = false;
        this.lastSelector = "";
        this.elems.length = 0;
        return this;
      },

      clone: function () {
        var clone = new Ecol();
        clone.elems.length = 0;
        for (var i = 0; i < this.elems.length; ++i) {
          clone.elems.push(this.elems[i]);
        }
        return clone;
      },

      each: function (callback, args) {
        args = args || [];
        for (var i = 0; i < this.elems.length; ++i) {
          if (false === callback.apply(null, ([this.elems[i], i]).concat(args))) {
            break;
          }
        }
        return this;
      },

      on: function (eventName, listener, opts) {
        this.each(function (element) {
          element.addEventListener(eventName, listener, opts);
        });
        return this;
      },

      query: function (selector) {

        this.lastSelector = selector;

        var sourceElems;
        if (this.___r.queried) {
          sourceElems = this.elems.splice(0);
        } else {
          sourceElems = [document];
        }

        for (var i = 0; i < sourceElems.length; ++i) {
          var selected = sourceElems[i].querySelectorAll(selector);
          for (var j = 0; j < selected.length; ++j) {
            this.elems.push(selected.item(j));
          }
        }

        this.___r.queried = true;

        return this;
      },
    };

    var preferreds = {
      get CLASS() { return "CLASS"; },
      get ID() { return "ID"; },
      get NAME() { return "NAME"; },
      get NTH_CHILD() { return "NTH_CHILD"; },
      get DOWN_AND_CLASS() { return "DOWN_AND_CLASS"; },
      get DOWN_AND_ID() { return "DOWN_AND_ID"; },
      get DOWN_AND_NAME() { return "DOWN_AND_NAME"; },
      get DOWN_AND_NTH_CHILD() { return "DOWN_AND_NTH_CHILD"; },
    };



    //
    // Link bind
    //
    var Lbi = function Lbi(struct, opts, name, index, parent) {

      // privates
      dpReadOnly(this, "___r",
        objectAssign(
          {
            self: this,
            chain: this,
            collected: false,
            ecol: new Ecol(),
            struct: struct,
            name: name || "",
            index: isInt(index) ? index : null,
            parent: parent || null,
            toPreferred: preferreds.CLASS,
            withPreferred: preferreds.NAME,
            traceLink: null,
          },
          opts
        ),
      /* enumerable */ false);

      dp(this, "elemCollection",
        {
          enumerable: false,
          get: function () {
            return this.___r.ecol.elems;
          }
        });

    };

    Lbi.prototype = {

      ___fullName: function () {
        var privates = this.___r;
        var fn = "";
        if (privates.parent) {
          fn = privates.parent.___fullName();
        }
        var me;
        var type = Object.getPrototypeOf(this).constructor.name.substring(0, 1);
        if (isInt(privates.index)) {
          me = privates.index;
        } else if (isString(privates.name)) {
          me = privates.name;
        } else {
          me = "(anon)";
        }
        fn += "/" + type + ":" + me;
        return fn;
      },

      setToPreferred: function (preferred) {
        this.___r.toPreferred = preferred;
        return this;
      },
      getToPreferred: function () {
        return this.___r.toPreferred;
      },
      setWithPreferred: function (preferred) {
        this.___r.withPreferred = preferred;
        return this;
      },
      getWithPreferred: function () {
        return this.___r.withPreferred;
      },

      preferredSelector: function (preferred, appending) {

        var privates = this.___r;
        var p = preferred;
        var ps = preferreds;
        var a = appending || "";

        var name = privates.name;

        if (p === ps.CLASS) {
          if (!name) return a;
          return "." + name + a;
        }

        if (p === ps.ID) {
          if (!name) return a;
          return "#" + name + a;
        }

        if (p === ps.NAME) {
          if (!name) return a;
          return "[name='" + name + "']" + a;
        }

        if (p === ps.NTH_CHILD) {
          if (!isInt(privates.index) || privates.index < 0) {
            return a;
          }
          return ">*:nth-child(" + (privates.index + 1) + ")" + a;
        }

        if (p === ps.DOWN_AND_CLASS) {
          if (!name) return a;
          return " ." + name + a;
        }

        if (p === ps.DOWN_AND_ID) {
          if (!name) return a;
          return " #" + name + a;
        }

        if (p === ps.DOWN_AND_NAME) {
          if (!name) return a;
          return " [name='" + name + "']" + a;
        }

        if (p === ps.DOWN_AND_NTH_CHILD) {
          if (!isInt(privates.index) || privates.index < 0) {
            return a;
          }
          return " >*:nth-child(" + (privates.index + 1) + ")" + a;
        }

        throw Error("Unsupported preferred");

      },

      toPreferredSelector: function (appending) {
        return this.preferredSelector(this.getToPreferred(), appending);
      },

      withPreferredSelector: function (appending) {
        return this.preferredSelector(this.getWithPreferred(), appending);
      },

      fullPreferredSelector: function (preferred, appending) {

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

          selector += parent.toPreferredSelector();
        }

        selector += this.preferredSelector(preferred, appending);

        return selector;
      },

      link: function (selector) {
        var privates = this.___r;
        privates.ecol.query(selector);
        privates.collected = true;

        if (Olbi.conf.traceLink) {
          privates.traceLink = [privates.ecol.clone().elems, privates.ecol.lastSelector, this.___fullName(), stackTraceString(Error())];
        }

        return this;
      },

      preferredLink: function (preferred, appending) {
        var selector = this.fullPreferredSelector(preferred, appending);
        return this.link(selector);
      },

      linkByToPreferred: function (appending) {
        return this.preferredLink(this.getToPreferred(), appending);
      },

      linkByWithPreferred: function (appending) {
        return this.preferredLink(this.getWithPreferred(), appending);
      },

      clearElemCollection: function () {
        var privates = this.___r;
        privates.ecol.clear();
        privates.collected = false;
      },

      traceLink: function () {
        if (!Olbi.conf.traceLink) {
          console.log("@traceLink", "Call 'Olbi.configure({traceLink: true});' to activate traceLink()");
        } else {
          if (this.___r.traceLink === null) {
            console.log("@traceLink", "Trace was empty");
          } else {
            console.log("@traceLink", this.___r.traceLink);
          }
        }
        return this.___r.chain;
      },

    };

    Lbi.prototype.constructor = Lbi;



    //
    // Object link bind
    //
    var Olbi = function Olbi(struct, opts, name, index, parent) {

      callSuperConstructorOf(this, struct, opts, name, index, parent);

      for (var propName in struct) {

        // ignore "___", because of reserved word
        if (propName === "___") {
          continue;
        }

        if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
          continue;
        }

        var value = struct[propName];

        if (isObject(value)) {
          dpReadOnly(this, propName, new Olbi(value, opts, propName, /* index */ null, this), /* enumerable */ true);
          continue;
        }

        if (isArray(value)) {
          dpReadOnly(this, propName, new Albi(value, opts, propName, /* index */ null, this), /* enumerable */ true);
          continue;
        }

        dpReadOnly(this, propName, new Plbi(value, opts, propName, /* index */ null, this), /* enumerable */ true);
      }

    };

    Olbi.prototype = objectAssign(
      Object.create(Lbi.prototype),
      {
        setData: function (data, src) {
          var privates = this.___r;

          src = src || this;

          var struct = privates.struct;
          var self = privates.self;

          for (var propName in data) {

            // ignore "___", because of reserved word
            if (propName === "___") {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(data, propName)) {
              continue;
            }

            if (!Object.prototype.hasOwnProperty.call(struct, propName)) {
              continue;
            }

            self[propName].setData(data[propName]);
          }

          return this;
        },

      });

    Olbi.prototype.constructor = Olbi;

    dpReadOnly(Olbi, "preferreds", preferreds, /* enumerable */ true);



    //
    // Primitive link bind
    //
    var Plbi = function Plbi(struct, opts, name, index, parent) {

      callSuperConstructorOf(this, struct, opts, name, index, parent);

      var privates = this.___r;
      objectAssign(
        privates,
        {
          chain: parent,
          toPreferred: preferreds.DOWN_AND_CLASS,
          withPreferred: preferreds.DOWN_AND_NAME,
          data: null,
          receivers: [],
        },
        opts
      );

    };

    Plbi.prototype = objectAssign(
      Object.create(Lbi.prototype),
      {
        setData: function (data, src) {
          var privates = this.___r;
          privates.data = data;
          src = src || this;

          for (var i = 0; i < privates.receivers.length; ++i) {
            privates.receivers[i](data, src);
          }

          return this;
        },

        withValue: function (opts) {

          var privates = this.___r;

          opts = objectAssign({
            eventName: "change",
          }, opts);

          if (!this.collected) {
            this.linkByWithPreferred();
          }

          var ecol = privates.ecol.clone();

          ecol.on(opts.eventName, (function (self) {
            return function (event) {
              self.setData(event.target.value, event.target);
            };
          })(this));

          var receiver = (function (ecol) {
            return function (data, src) {
              ecol.each(function (element) {
                if (src !== element) {
                  element.value = data;
                }
              });
            };
          })(ecol);

          privates.receivers.push(receiver);

          privates.parent.___r.traceLink = privates.traceLink;

          this.clearElemCollection();

          return privates.chain;
        },
      }
    );

    Plbi.prototype.constructor = Plbi;



    //
    // Array link bind
    //
    var Albi = function Albi(struct, opts, name, index, parent) {

      callSuperConstructorOf(this, struct, opts, name, index, parent);

      if (!isArray(struct)) {
        throw Error("The struct must be an Array");
      }

      if (struct.length !== 1) {
        throw Error("The struct array must have only one item");
      }

      var privates = this.___r;
      objectAssign(privates, {
        itemStruct: struct[0],
        eachSets: [],
        data: [],
      });

    };

    Albi.prototype = objectAssign(
      Object.create(Lbi.prototype),
      {
        each: function (callback, opts) {

          /*
          The element that is linked on each method, must be the parent that is for automatically generated element.
          each で link される Element は、each メソッドによって自動で生成される element の親であることを前提にしている。
          For example, if there is a HTML as below,
          例えば、次のようなHTMLがあったとする。
          ```
          <tbody>
            <tr>
            </tr>
          </tbody>
          ```
          and you want to generate `<tr>` tag by each item in an array.
          この `<tr>` タグを、配列の要素ごとに自動で生成したいとする。
          Then linked tag by each method must be `<tbody>`
          そのとき、linkされる each メソッドで link されるタグは、`<tbody>` でなければならない。
       
          eachSets[]
            eachSet
              itemReceiver
              templateSets[]
                templateSet
                  target
                  template
       
          */

          var privates = this.___r;
          var eachSet = {
            itemReceiver: null,
            templateSets: [],
            callback: callback,
          };

          if (privates.itemStruct == null || isPrimitive(privates.itemStruct)) {
            eachSet.itemReceiver = (function (self, privates) {
              return function (src, value, name, index) {

                var eachSet = this;
                var templateSetIndex, templateSet;

                // create element
                for (templateSetIndex = 0; templateSetIndex < eachSet.templateSets.length; ++templateSetIndex) {
                  templateSet = eachSet.templateSets[templateSetIndex];

                  var childElem = null;
                  if (templateSet.template) {
                    childElem = templateSet.template.cloneNode(true);
                    templateSet.target.appendChild(childElem);
                  }

                  // create Plbi
                  templateSet.xlbi = new Plbi(privates.itemStruct, null, null, index, self);

                  eachSet.callback.call(templateSet.xlbi, index, childElem);
                }

                // Set value to data
                for (templateSetIndex = 0; templateSetIndex < eachSet.templateSets.length; ++templateSetIndex) {
                  templateSet = eachSet.templateSets[templateSetIndex];
                  templateSet.xlbi.setData(value);
                }

              };
            })(this, privates);
          }
          else {
            // TODO not implemented
            throw Error("not implemented");
          }

          if (!this.collected) {
            this.linkByToPreferred();
          }

          // prepare template element
          privates.ecol.each(function (elem) {

            var firstElementChild = null;
            if (elem.firstElementChild) {
              firstElementChild = elem.firstElementChild.cloneNode(true);
            }

            removeChildAll(elem);
            var templateSet = {
              target: elem,
              template: firstElementChild,
              xlbi: null,
            };
            eachSet.templateSets.push(templateSet);
          });

          privates.eachSets.push(eachSet);

          this.clearElemCollection();

          return this;
        },

        setData: function (data) {

          var privates = this.___r;
          if (privates.data === data) {
            return this;
          }

          // copy data into privates.data
          privates.data.length = 0;
          for (var dataIndex = 0; dataIndex < data.length; ++dataIndex) {
            privates.data.push(data[dataIndex]);
          }

          // clear element
          var eachSetIndex, eachSet, templateSetIndex, templateSet;
          for (eachSetIndex = 0; eachSetIndex < privates.eachSets.length; ++eachSetIndex) {

            eachSet = privates.eachSets[eachSetIndex];

            for (templateSetIndex = 0; templateSetIndex < eachSet.templateSets.length; ++templateSetIndex) {
              templateSet = eachSet.templateSets[templateSetIndex];
              removeChildAll(templateSet.target);
            }
          }

          // call itemReceiver by each item
          for (var index = 0; index < privates.data.length; ++index) {
            var item = privates.data[index];

            for (eachSetIndex = 0; eachSetIndex < privates.eachSets.length; ++eachSetIndex) {

              eachSet = privates.eachSets[eachSetIndex];
              eachSet.itemReceiver(this, item, /* name */null, index);
            }
          }

          // TODO call onReceive

          return this;
        },

      }
    );

    Albi.prototype.constructor = Albi;



    Olbi.objectAssign = objectAssign;
    Olbi.objectAssignDeep = objectAssignDeep;


    //
    // Global configuration
    //

    var defaultConf = {
      traceLink: false,
    };

    Olbi.configure = (function () {

      var holder = {
        conf: objectAssign({}, defaultConf)
      };

      dp(Olbi, "conf", {
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

    return Olbi;
  })();

});