(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global['js-go-channels'] = {})));
}(this, (function (exports) { 'use strict';

function unwrapExports (x) {
	return x && x.__esModule ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _addToUnscopables = function () { /* empty */ };

var _iterStep = function (done, value) {
  return { value: value, done: !!done };
};

var _iterators = {};

var toString = {}.toString;

var _cof = function (it) {
  return toString.call(it).slice(8, -1);
};

// fallback for non-array-like ES3 and non-enumerable old V8 strings

// eslint-disable-next-line no-prototype-builtins
var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return _cof(it) == 'String' ? it.split('') : Object(it);
};

// 7.2.1 RequireObjectCoercible(argument)
var _defined = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

// to indexed object, toObject with fallback for non-array-like ES3 strings


var _toIobject = function (it) {
  return _iobject(_defined(it));
};

var _library = true;

var _global = createCommonjsModule(function (module) {
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
});

var _core = createCommonjsModule(function (module) {
var core = module.exports = { version: '2.5.1' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
});

var _aFunction = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

// optional / simple context binding

var _ctx = function (fn, that, length) {
  _aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var _isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

var _anObject = function (it) {
  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

var _fails = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var _descriptors = !_fails(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

var document = _global.document;
// typeof document.createElement is 'object' in old IE
var is = _isObject(document) && _isObject(document.createElement);
var _domCreate = function (it) {
  return is ? document.createElement(it) : {};
};

var _ie8DomDefine = !_descriptors && !_fails(function () {
  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
});

// 7.1.1 ToPrimitive(input [, PreferredType])

// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var _toPrimitive = function (it, S) {
  if (!_isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var dP = Object.defineProperty;

var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  _anObject(O);
  P = _toPrimitive(P, true);
  _anObject(Attributes);
  if (_ie8DomDefine) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var _objectDp = {
	f: f
};

var _propertyDesc = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var _hide = _descriptors ? function (object, key, value) {
  return _objectDp.f(object, key, _propertyDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] : (_global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && key in exports) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? _ctx(out, _global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) _hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
var _export = $export;

var _redefine = _hide;

var hasOwnProperty = {}.hasOwnProperty;
var _has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
var _toInteger = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

// 7.1.15 ToLength

var min = Math.min;
var _toLength = function (it) {
  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;
var _toAbsoluteIndex = function (index, length) {
  index = _toInteger(index);
  return index < 0 ? max(index + length, 0) : min$1(index, length);
};

// false -> Array#indexOf
// true  -> Array#includes



var _arrayIncludes = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = _toIobject($this);
    var length = _toLength(O.length);
    var index = _toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var SHARED = '__core-js_shared__';
var store = _global[SHARED] || (_global[SHARED] = {});
var _shared = function (key) {
  return store[key] || (store[key] = {});
};

var id = 0;
var px = Math.random();
var _uid = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

var shared = _shared('keys');

var _sharedKey = function (key) {
  return shared[key] || (shared[key] = _uid(key));
};

var arrayIndexOf = _arrayIncludes(false);
var IE_PROTO$1 = _sharedKey('IE_PROTO');

var _objectKeysInternal = function (object, names) {
  var O = _toIobject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO$1) _has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (_has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

// IE 8- don't enum bug keys
var _enumBugKeys = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

// 19.1.2.14 / 15.2.3.14 Object.keys(O)



var _objectKeys = Object.keys || function keys(O) {
  return _objectKeysInternal(O, _enumBugKeys);
};

var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  _anObject(O);
  var keys = _objectKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) _objectDp.f(O, P = keys[i++], Properties[P]);
  return O;
};

var document$1 = _global.document;
var _html = document$1 && document$1.documentElement;

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])



var IE_PROTO = _sharedKey('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE$1 = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _domCreate('iframe');
  var i = _enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  _html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE$1][_enumBugKeys[i]];
  return createDict();
};

var _objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE$1] = _anObject(O);
    result = new Empty();
    Empty[PROTOTYPE$1] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : _objectDps(result, Properties);
};

var _wks = createCommonjsModule(function (module) {
var store = _shared('wks');

var Symbol = _global.Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : _uid)('Symbol.' + name));
};

$exports.store = store;
});

var def = _objectDp.f;

var TAG = _wks('toStringTag');

var _setToStringTag = function (it, tag, stat) {
  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

'use strict';



var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_hide(IteratorPrototype, _wks('iterator'), function () { return this; });

var _iterCreate = function (Constructor, NAME, next) {
  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
  _setToStringTag(Constructor, NAME + ' Iterator');
};

// 7.1.13 ToObject(argument)

var _toObject = function (it) {
  return Object(_defined(it));
};

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)


var IE_PROTO$2 = _sharedKey('IE_PROTO');
var ObjectProto = Object.prototype;

var _objectGpo = Object.getPrototypeOf || function (O) {
  O = _toObject(O);
  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

'use strict';









var ITERATOR = _wks('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

var _iterDefine = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  _iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      _setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!_library && !_has(IteratorPrototype, ITERATOR)) _hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!_library || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    _hide(proto, ITERATOR, $default);
  }
  // Plug for library
  _iterators[NAME] = $default;
  _iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) _redefine(proto, key, methods[key]);
    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

'use strict';





// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
  this._t = _toIobject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return _iterStep(1);
  }
  if (kind == 'keys') return _iterStep(0, index);
  if (kind == 'values') return _iterStep(0, O[index]);
  return _iterStep(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
_iterators.Arguments = _iterators.Array;

_addToUnscopables('keys');
_addToUnscopables('values');
_addToUnscopables('entries');

var TO_STRING_TAG = _wks('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = _global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) _hide(proto, TO_STRING_TAG, NAME);
  _iterators[NAME] = _iterators.Array;
}

// true  -> String#at
// false -> String#codePointAt
var _stringAt = function (TO_STRING) {
  return function (that, pos) {
    var s = String(_defined(that));
    var i = _toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

'use strict';
var $at = _stringAt(true);

// 21.1.3.27 String.prototype[@@iterator]()
_iterDefine(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

// getting tag from 19.1.3.6 Object.prototype.toString()

var TAG$1 = _wks('toStringTag');
// ES3 wrong here
var ARG = _cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

var _classof = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG$1)) == 'string' ? T
    // builtinTag case
    : ARG ? _cof(O)
    // ES3 arguments fallback
    : (B = _cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

var ITERATOR$1 = _wks('iterator');

var core_isIterable = _core.isIterable = function (it) {
  var O = Object(it);
  return O[ITERATOR$1] !== undefined
    || '@@iterator' in O
    // eslint-disable-next-line no-prototype-builtins
    || _iterators.hasOwnProperty(_classof(O));
};

var isIterable$2 = core_isIterable;

var isIterable = createCommonjsModule(function (module) {
module.exports = { "default": isIterable$2, __esModule: true };
});

unwrapExports(isIterable);

var ITERATOR$2 = _wks('iterator');

var core_getIteratorMethod = _core.getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR$2]
    || it['@@iterator']
    || _iterators[_classof(it)];
};

var core_getIterator = _core.getIterator = function (it) {
  var iterFn = core_getIteratorMethod(it);
  if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
  return _anObject(iterFn.call(it));
};

var getIterator$2 = core_getIterator;

var getIterator = createCommonjsModule(function (module) {
module.exports = { "default": getIterator$2, __esModule: true };
});

unwrapExports(getIterator);

var slicedToArray = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;



var _isIterable3 = _interopRequireDefault(isIterable);



var _getIterator3 = _interopRequireDefault(getIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = (0, _getIterator3.default)(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if ((0, _isIterable3.default)(Object(arr))) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();
});

var _slicedToArray = unwrapExports(slicedToArray);

// call something on iterator step with safe closing on error

var _iterCall = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(_anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) _anObject(ret.call(iterator));
    throw e;
  }
};

// check on default Array iterator

var ITERATOR$3 = _wks('iterator');
var ArrayProto = Array.prototype;

var _isArrayIter = function (it) {
  return it !== undefined && (_iterators.Array === it || ArrayProto[ITERATOR$3] === it);
};

'use strict';



var _createProperty = function (object, index, value) {
  if (index in object) _objectDp.f(object, index, _propertyDesc(0, value));
  else object[index] = value;
};

var ITERATOR$4 = _wks('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR$4]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  
} catch (e) { /* empty */ }

var _iterDetect = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR$4]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR$4] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};

'use strict';









_export(_export.S + _export.F * !_iterDetect(function (iter) {  }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = _toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = core_getIteratorMethod(O);
    var length, result, step, iterator;
    if (mapping) mapfn = _ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && _isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        _createProperty(result, index, mapping ? _iterCall(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = _toLength(O.length);
      for (result = new C(length); length > index; index++) {
        _createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

var from$2 = _core.Array.from;

var from = createCommonjsModule(function (module) {
module.exports = { "default": from$2, __esModule: true };
});

unwrapExports(from);

var toConsumableArray = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;



var _from2 = _interopRequireDefault(from);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  } else {
    return (0, _from2.default)(arr);
  }
};
});

var _toConsumableArray = unwrapExports(toConsumableArray);

var newArrowCheck = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

exports.default = function (innerThis, boundThis) {
  if (innerThis !== boundThis) {
    throw new TypeError("Cannot instantiate an arrow function");
  }
};
});

var _newArrowCheck = unwrapExports(newArrowCheck);

// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
_export(_export.S + _export.F * !_descriptors, 'Object', { defineProperty: _objectDp.f });

var $Object = _core.Object;
var defineProperty$2 = function defineProperty(it, key, desc) {
  return $Object.defineProperty(it, key, desc);
};

var defineProperty = createCommonjsModule(function (module) {
module.exports = { "default": defineProperty$2, __esModule: true };
});

unwrapExports(defineProperty);

var createClass = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;



var _defineProperty2 = _interopRequireDefault(defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
});

var _createClass = unwrapExports(createClass);

var classCallCheck = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
});

var _classCallCheck = unwrapExports(classCallCheck);

var BufferItem = function BufferItem(data, next) {
  _classCallCheck(this, BufferItem);

  this.data = data;
  this.next = next;
};

var LinkedListBuffer = function () {
  function LinkedListBuffer() {
    _classCallCheck(this, LinkedListBuffer);

    this.head = undefined;
    this.tail = undefined;
  }

  _createClass(LinkedListBuffer, [{
    key: 'add',
    value: function add(item) {
      var bufferItem = new BufferItem(item);
      // first item ever
      if (!this.head) {
        this.head = bufferItem;
        this.tail = bufferItem;
        return;
      }
      this.tail.next = bufferItem;
    }
  }, {
    key: 'pop',
    value: function pop() {
      if (!this.head) {
        return undefined;
      }
      var item = this.head;
      this.head = this.head.next;
      return item.data;
    }
  }]);

  return LinkedListBuffer;
}();

var id$1 = 0;

function uuid() {
  // Note that we're not using generators to avoid having generators
  // as a libary dependency.
  return id$1++;
}

function checkGenerator(generator) {
  // check if generator
  if (!generator || typeof generator !== 'function') {
    throw new Error('Need a generator');
  }
  var iterator = generator();
  if (!iterator || typeof iterator[Symbol.iterator] !== 'function') {
    throw new Error('Need an iterator');
  }
  return iterator;
}

var _this = undefined;

var initialStateFn = function () {
  _newArrowCheck(this, _this);

  return {
    /**
     * map of active channels
     */
    channels: {},
    dataProducers: {},
    dataConsumers: {},
    /**
     * map of last selected channels
     */
    lastSelected: {},
    /**
     * array of range requests
     */
    rangeRequests: []
  };
}.bind(undefined);

var state = initialStateFn();

var cTakeRequest = 'take';
var cPutRequest = 'put';
var cSelectRequest = 'select';

var putCloseError = new Error('Cannot put on a closed channel');

var dummyIterator = function () {
  _newArrowCheck(this, _this);

  return {
    next: function next() {
      _newArrowCheck(this, _this);

      return { value: undefined, done: true };
    }.bind(this),
    throw: function _throw() {
      _newArrowCheck(this, _this);

      return { value: undefined, done: true };
    }.bind(this),
    return: function _return() {
      _newArrowCheck(this, _this);

      return { value: undefined, done: true };
    }.bind(this)
  };
}.bind(undefined);

/**
 * Does what it says. Need to take into account the case when the
 * consumer is a pending select, pending take. `select`s have a
 * different signature.
 * @param {Object} consumer - the consumer and message that was queued
 * @param {Iterator} consumer.iterator
 * @param {string} consumer.type - the consumer's message type
 * @param {Object} consumer.payload - the consumer's message payload
 * @param {Object} message - the message to give to the consumer
 * @param {Object} extraArgs
 * @param {string} extraArgs.chanId
 * @returns {[Iterator, Message]}
 */
function _createConsumerMessage(consumer, message, _ref) {
  var chanId = _ref.chanId;
  var consumerIterator = consumer.iterator,
      requestType = consumer.type,
      payload = consumer.payload;

  if (requestType === cSelectRequest) {
    var selectedChanIds = payload.selectedChanIds;

    var i = selectedChanIds.indexOf(chanId);
    var response = new Array(selectedChanIds.length);
    response[i] = message;
    return [consumerIterator, response];
  } else if (requestType === cTakeRequest) {
    return [consumerIterator, message];
  }
  throw new Error('Unknown request type ' + String(requestType));
}

function _addConsumer(_ref2) {
  var dataConsumers = _ref2.dataConsumers,
      chanId = _ref2.chanId,
      _ref2$consumer = _ref2.consumer,
      iterator = _ref2$consumer.iterator,
      requestType = _ref2$consumer.requestType,
      payload = _ref2$consumer.payload;

  dataConsumers[chanId].add({
    iterator: iterator,
    type: requestType,
    payload: payload
  });
}

function scheduler(_ref3) {
  var _this2 = this;

  var _ref3$state = _ref3.state,
      dataProducers = _ref3$state.dataProducers,
      dataConsumers = _ref3$state.dataConsumers,
      channels = _ref3$state.channels,
      lastSelected = _ref3$state.lastSelected,
      _ref3$generator = _ref3.generator,
      iterator = _ref3$generator.iterator,
      request = _ref3$generator.request,
      stopScheduler = _ref3.stopScheduler;

  // Give the iterator the iteratorMessage and pass the result to the
  // scheduler
  var nextTick = function (iterator, iteratorMessage) {
    _newArrowCheck(this, _this2);

    var _iterator$next = iterator.next(iteratorMessage),
        request = _iterator$next.value,
        stopScheduler = _iterator$next.done;

    setTimeout(function () {
      _newArrowCheck(this, _this2);

      return scheduler({
        state: { dataProducers: dataProducers, dataConsumers: dataConsumers, channels: channels, lastSelected: lastSelected },
        generator: {
          iterator: iterator,
          request: request
        },
        stopScheduler: stopScheduler
      });
    }.bind(this), 0);
  }.bind(this);
  // Give the iterator the error and pass the result to the scheduler
  var nextTickThrow = function (iterator, error) {
    _newArrowCheck(this, _this2);

    var _iterator$throw = iterator.throw(error),
        request = _iterator$throw.value,
        stopScheduler = _iterator$throw.done;

    setTimeout(function () {
      _newArrowCheck(this, _this2);

      return scheduler({
        state: { dataProducers: dataProducers, dataConsumers: dataConsumers, channels: channels, lastSelected: lastSelected },
        generator: {
          iterator: iterator,
          request: request
        },
        stopScheduler: stopScheduler
      });
    }.bind(this), 0);
  }.bind(this);
  // if no request, then at start of generator, so get one
  if (!request && !stopScheduler) {
    return nextTick(iterator);
  }
  // if this generator is done, then goodbye
  if (stopScheduler) {
    return;
  }
  var requestType = request.type,
      chanId = request.chanId,
      payload = request.payload;

  switch (requestType) {
    case cTakeRequest:
      {
        // check if the channel is closed
        if (!channels[chanId]) {
          // if the channel is closed (buffer doesn't exist), then pass
          // back undefined, done = true to the iterator.
          return nextTick(iterator, { value: undefined, done: true });
        }
        // do we have any sleeping data producers?
        var producer = dataProducers[chanId].pop();
        if (producer) {
          var producerIterator = producer.iterator,
              msg = producer.payload.msg;
          // give this iterator the msg

          nextTick(iterator, { value: msg, done: false });
          // also wake up the data producer
          nextTick(producerIterator);
        } else {
          // add ourselves to the waiting list and hopefully we'll be
          // woken up in the future
          _addConsumer({
            dataConsumers: dataConsumers,
            chanId: chanId,
            consumer: {
              iterator: iterator,
              requestType: requestType,
              payload: payload
            }
          });
        }
        return;
      }
    // select returns the first data producer that fires. Sends back
    // an array to the iterator. Just fire the first channel that
    // receives a message: go thru the selected channels and try to
    // get values. stop at the first that has a value.
    case cSelectRequest:
      {
        var selectedChanIds = payload.selectedChanIds;

        var lastSelectedId = String(iterator.__goId) + ':' + String(selectedChanIds);
        var chanData = null;
        var _producer = null;
        // mod by the number of selected channels so that we never get an
        // out-of-bounds exception
        var unboundedLastSelected = typeof lastSelected[lastSelectedId] !== 'undefined' ? lastSelected[lastSelectedId] : -1;
        var last = (unboundedLastSelected + 1) % selectedChanIds.length;
        delete lastSelected[lastSelectedId];
        // do we have any sleeping producers? but start from the last selected
        for (var i = last; i < selectedChanIds.length; i++) {
          var _chanId = selectedChanIds[i];
          if (!channels[_chanId]) {
            // if channel was closed then send undefined
            chanData = { value: undefined, done: true, chanNum: i };
            break;
          }
          _producer = dataProducers[_chanId].pop();
          if (_producer) {
            var _producer2 = _producer,
                _msg = _producer2.payload.msg;

            chanData = { value: _msg, done: false, chanNum: i };
            break;
          }
        }
        if (chanData) {
          // set last selected
          lastSelected[lastSelectedId] = chanData.chanNum;
          // wake up the producer
          _producer && nextTick(_producer.iterator);
          var response = new Array(selectedChanIds.length);
          response[chanData.chanNum] = {
            value: chanData.value,
            done: chanData.done
          };
          nextTick(iterator, response);
        } else {
          // There were no sleeping producers, so add ourselves to the
          // waiting list of all the non-closed producers.
          for (var _i = 0; _i < selectedChanIds.length; _i++) {
            if (dataConsumers[selectedChanIds[_i]]) {
              _addConsumer({
                dataConsumers: dataConsumers,
                chanId: selectedChanIds[_i],
                consumer: {
                  iterator: iterator,
                  requestType: requestType,
                  payload: payload
                }
              });
            }
          }
        }
        return;
      }
    case cPutRequest:
      {
        // First check if the channel is closed.
        if (!channels[chanId]) {
          nextTickThrow(iterator, putCloseError);
          return;
        }
        var _msg2 = payload.msg;
        // do we have any takers?

        var consumer = dataConsumers[chanId].pop();
        if (consumer) {
          nextTick(iterator);
          nextTick.apply(undefined, _toConsumableArray(_createConsumerMessage(consumer, { value: _msg2, done: false }, { chanId: chanId })));
        } else {
          // let's wait for a data consumer
          dataProducers[chanId].add({ iterator: iterator, payload: payload, type: requestType });
        }
        return;
      }
  }
}

function go(generator) {
  var iterator = checkGenerator(generator);
  iterator.__goId = uuid();
  // so `go` kicks off the scheduler
  scheduler({
    state: state,
    generator: {
      iterator: iterator,
      request: undefined,
      done: false
    }
  });
}

function newChannel() {
  var channels = state.channels,
      dataProducers = state.dataProducers,
      dataConsumers = state.dataConsumers;

  var chanId = uuid();
  channels[chanId] = true;
  dataProducers[chanId] = new LinkedListBuffer();
  dataConsumers[chanId] = new LinkedListBuffer();
  var channel = {
    get _id() {
      return chanId;
    },
    take: function take(_msgId) {
      return {
        chanId: chanId,
        type: cTakeRequest,
        payload: {}
      };
    },
    put: function put(msg) {
      return {
        chanId: chanId,
        type: cPutRequest,
        payload: { msg: msg }
      };
    },
    asyncPut: function asyncPut(msg) {
      if (!channels[chanId]) {
        throw putCloseError;
      }
      scheduler({
        state: state,
        generator: {
          // pass a dummyIterator. We don't care about any errors that
          // may happen down the road, nor do we need any messages
          // from the scheduler
          iterator: dummyIterator(),
          request: channel.put(msg)
        },
        stopScheduler: false
      });
    }
  };
  return channel;
}

function close(channel, _msgId) {
  var channels = state.channels,
      dataProducers = state.dataProducers,
      dataConsumers = state.dataConsumers;

  var chanId = channel._id;
  if (!channels[chanId]) {
    throw new Error('Channel is already closed');
  }
  // turn off channel
  delete channels[chanId];
  // tell any pending consumers the channel is closed
  var consumers = dataConsumers[chanId];
  var consumer = consumers.pop();
  while (consumer) {
    var _createConsumerMessag = _createConsumerMessage(consumer, { value: undefined, done: true }, { chanId: chanId }),
        _createConsumerMessag2 = _slicedToArray(_createConsumerMessag, 2),
        iterator = _createConsumerMessag2[0],
        request = _createConsumerMessag2[1];

    scheduler({
      state: state,
      generator: {
        iterator: iterator,
        request: request
      }
    });
    consumer = consumers.pop();
  }
  delete dataConsumers[chanId];
  // hope we don't have pending producers
  var producers = dataProducers[chanId];
  var producer = producers.pop();
  while (producer) {
    var _producer3 = producer,
        _iterator = _producer3.iterator;

    var _iterator$throw2 = _iterator.throw(putCloseError),
        _request = _iterator$throw2.value,
        stopScheduler = _iterator$throw2.done;

    scheduler({
      state: state,
      generator: {
        iterator: _iterator,
        request: _request
      },
      stopScheduler: stopScheduler
    });
    producer = producers.pop();
  }
  delete dataProducers[chanId];
  return;
}

function select() {
  var _this3 = this;

  for (var _len = arguments.length, channels = Array(_len), _key = 0; _key < _len; _key++) {
    channels[_key] = arguments[_key];
  }

  return {
    type: cSelectRequest,
    payload: { selectedChanIds: channels.map(function (x) {
        _newArrowCheck(this, _this3);

        return x._id;
      }.bind(this)) || [] }
  };
}

function range(channel) {
  return {
    // This actually registers the callback
    forEach: function forEach(callback) {
      var _this4 = this;

      // Internally, it's an iterator
      var iterator = Object.assign(dummyIterator(), {
        next: function next(_ref4) {
          var value = _ref4.value,
              done = _ref4.done;

          _newArrowCheck(this, _this4);

          if (done) {
            // tell the scheduler we're done and don't update
            // callback
            return { value: undefined, done: true };
          }
          // pass the value to the callback
          var unsub = callback(value);
          if (unsub === false) {
            // tell the scheduler we're done if callback requests to
            // unsubscribe
            return { value: undefined, done: true };
          }
          // tell the scheduler that the next request is for another
          // take
          return { value: channel.take(), done: false };
        }.bind(this)
      });
      // queue self
      scheduler({
        state: state,
        generator: {
          iterator: iterator,
          request: channel.take()
        },
        stopScheduler: false
      });
    }
  };
}

exports.initialStateFn = initialStateFn;
exports.go = go;
exports.newChannel = newChannel;
exports.close = close;
exports.select = select;
exports.range = range;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=index.js.map
