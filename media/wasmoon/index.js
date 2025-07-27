(function (global, factory) {
  function preferDefault(exports) {
    return exports.default || exports;
  }
  if (typeof define === "function" && define.amd) {
    define([], function () {
      var exports = {};
      factory(exports);
      return preferDefault(exports);
    });
  } else if (typeof exports === "object") {
    factory(exports);
    if (typeof module === "object") module.exports = preferDefault(exports);
  } else {
    (function () {
      var exports = {};
      factory(exports);
      global.wasmoon = preferDefault(exports);
    })();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.PointerSize = _exports.LuaWasm = _exports.LuaTypeExtension = _exports.LuaType = _exports.LuaTimeoutError = _exports.LuaThread = _exports.LuaReturn = _exports.LuaRawResult = _exports.LuaMultiReturn = _exports.LuaLibraries = _exports.LuaGlobal = _exports.LuaFactory = _exports.LuaEventMasks = _exports.LuaEventCodes = _exports.LuaEngine = _exports.LUA_REGISTRYINDEX = _exports.LUA_MULTRET = _exports.LUAI_MAXSTACK = _exports.Decoration = void 0;
  _exports.decorate = decorate;
  _exports.decorateFunction = decorateFunction;
  _exports.decorateProxy = decorateProxy;
  _exports.decorateUserdata = decorateUserdata;
  var Decoration = class {
    constructor(target, options) {
      this.target = target;
      this.options = options;
    }
  };
  _exports.Decoration = Decoration;
  function decorate(target, options) {
    return new Decoration(target, options);
  }

  var MultiReturn = class extends Array {};

  _exports.LuaMultiReturn = MultiReturn;
  var Pointer = class extends Number {};

  let LuaReturn = _exports.LuaReturn = function (LuaReturn$1) {
    LuaReturn$1[LuaReturn$1["Ok"] = 0] = "Ok";
    LuaReturn$1[LuaReturn$1["Yield"] = 1] = "Yield";
    LuaReturn$1[LuaReturn$1["ErrorRun"] = 2] = "ErrorRun";
    LuaReturn$1[LuaReturn$1["ErrorSyntax"] = 3] = "ErrorSyntax";
    LuaReturn$1[LuaReturn$1["ErrorMem"] = 4] = "ErrorMem";
    LuaReturn$1[LuaReturn$1["ErrorErr"] = 5] = "ErrorErr";
    LuaReturn$1[LuaReturn$1["ErrorFile"] = 6] = "ErrorFile";
    return LuaReturn$1;
  }({});
  const PointerSize = _exports.PointerSize = 4;
  const LUA_MULTRET = _exports.LUA_MULTRET = -1;
  const LUAI_MAXSTACK = _exports.LUAI_MAXSTACK = 1e6;
  const LUA_REGISTRYINDEX = _exports.LUA_REGISTRYINDEX = -LUAI_MAXSTACK - 1e3;
  let LuaType = _exports.LuaType = function (LuaType$1) {
    LuaType$1[LuaType$1["None"] = -1] = "None";
    LuaType$1[LuaType$1["Nil"] = 0] = "Nil";
    LuaType$1[LuaType$1["Boolean"] = 1] = "Boolean";
    LuaType$1[LuaType$1["LightUserdata"] = 2] = "LightUserdata";
    LuaType$1[LuaType$1["Number"] = 3] = "Number";
    LuaType$1[LuaType$1["String"] = 4] = "String";
    LuaType$1[LuaType$1["Table"] = 5] = "Table";
    LuaType$1[LuaType$1["Function"] = 6] = "Function";
    LuaType$1[LuaType$1["Userdata"] = 7] = "Userdata";
    LuaType$1[LuaType$1["Thread"] = 8] = "Thread";
    return LuaType$1;
  }({});
  let LuaEventCodes = _exports.LuaEventCodes = function (LuaEventCodes$1) {
    LuaEventCodes$1[LuaEventCodes$1["Call"] = 0] = "Call";
    LuaEventCodes$1[LuaEventCodes$1["Ret"] = 1] = "Ret";
    LuaEventCodes$1[LuaEventCodes$1["Line"] = 2] = "Line";
    LuaEventCodes$1[LuaEventCodes$1["Count"] = 3] = "Count";
    LuaEventCodes$1[LuaEventCodes$1["TailCall"] = 4] = "TailCall";
    return LuaEventCodes$1;
  }({});
  let LuaEventMasks = _exports.LuaEventMasks = function (LuaEventMasks$1) {
    LuaEventMasks$1[LuaEventMasks$1["Call"] = 1] = "Call";
    LuaEventMasks$1[LuaEventMasks$1["Ret"] = 2] = "Ret";
    LuaEventMasks$1[LuaEventMasks$1["Line"] = 4] = "Line";
    LuaEventMasks$1[LuaEventMasks$1["Count"] = 8] = "Count";
    return LuaEventMasks$1;
  }({});
  let LuaLibraries = _exports.LuaLibraries = function (LuaLibraries$1) {
    LuaLibraries$1["Base"] = "_G";
    LuaLibraries$1["Coroutine"] = "coroutine";
    LuaLibraries$1["Table"] = "table";
    LuaLibraries$1["IO"] = "io";
    LuaLibraries$1["OS"] = "os";
    LuaLibraries$1["String"] = "string";
    LuaLibraries$1["UTF8"] = "utf8";
    LuaLibraries$1["Math"] = "math";
    LuaLibraries$1["Debug"] = "debug";
    LuaLibraries$1["Package"] = "package";
    return LuaLibraries$1;
  }({});
  var LuaTimeoutError = class extends Error {};

  _exports.LuaTimeoutError = LuaTimeoutError;
  const INSTRUCTION_HOOK_COUNT = 1e3;
  var Thread = _exports.LuaThread = class Thread {
    address;
    lua;
    typeExtensions;
    closed = false;
    hookFunctionPointer;
    timeout;
    parent;
    constructor(lua, typeExtensions, address, parent) {
      this.lua = lua;
      this.typeExtensions = typeExtensions;
      this.address = address;
      this.parent = parent;
    }
    newThread() {
      const address = this.lua.lua_newthread(this.address);
      if (!address) throw new Error("lua_newthread returned a null pointer");
      return new Thread(this.lua, this.typeExtensions, address, this.parent || this);
    }
    resetThread() {
      this.assertOk(this.lua.lua_resetthread(this.address));
    }
    loadString(luaCode, name) {
      const size = this.lua.module.lengthBytesUTF8(luaCode);
      const pointerSize = size + 1;
      const bufferPointer = this.lua.module._malloc(pointerSize);
      try {
        this.lua.module.stringToUTF8(luaCode, bufferPointer, pointerSize);
        this.assertOk(this.lua.luaL_loadbufferx(this.address, bufferPointer, size, name ?? bufferPointer, null));
      } finally {
        this.lua.module._free(bufferPointer);
      }
    }
    loadFile(filename) {
      this.assertOk(this.lua.luaL_loadfilex(this.address, filename, null));
    }
    resume(argCount = 0) {
      const dataPointer = this.lua.module._malloc(PointerSize);
      try {
        this.lua.module.setValue(dataPointer, 0, "i32");
        const luaResult = this.lua.lua_resume(this.address, null, argCount, dataPointer);
        return {
          result: luaResult,
          resultCount: this.lua.module.getValue(dataPointer, "i32")
        };
      } finally {
        this.lua.module._free(dataPointer);
      }
    }
    getTop() {
      return this.lua.lua_gettop(this.address);
    }
    setTop(index) {
      this.lua.lua_settop(this.address, index);
    }
    remove(index) {
      return this.lua.lua_remove(this.address, index);
    }
    setField(index, name, value) {
      index = this.lua.lua_absindex(this.address, index);
      this.pushValue(value);
      this.lua.lua_setfield(this.address, index, name);
    }
    async run(argCount = 0, options) {
      const originalTimeout = this.timeout;
      try {
        if (options?.timeout !== undefined) this.setTimeout(Date.now() + options.timeout);
        let resumeResult = this.resume(argCount);
        while (resumeResult.result === LuaReturn.Yield) {
          if (this.timeout && Date.now() > this.timeout) {
            if (resumeResult.resultCount > 0) this.pop(resumeResult.resultCount);
            throw new LuaTimeoutError(`thread timeout exceeded`);
          }
          if (resumeResult.resultCount > 0) {
            const lastValue = this.getValue(-1);
            this.pop(resumeResult.resultCount);
            if (lastValue === Promise.resolve(lastValue)) await lastValue;else await new Promise(resolve => setImmediate(resolve));
          } else await new Promise(resolve => setImmediate(resolve));
          resumeResult = this.resume(0);
        }
        this.assertOk(resumeResult.result);
        return this.getStackValues();
      } finally {
        if (options?.timeout !== undefined) this.setTimeout(originalTimeout);
      }
    }
    runSync(argCount = 0) {
      const base = this.getTop() - argCount - 1;
      this.assertOk(this.lua.lua_pcallk(this.address, argCount, LUA_MULTRET, 0, 0, null));
      return this.getStackValues(base);
    }
    pop(count = 1) {
      this.lua.lua_pop(this.address, count);
    }
    call(name, ...args) {
      const type = this.lua.lua_getglobal(this.address, name);
      if (type !== LuaType.Function) throw new Error(`A function of type '${type}' was pushed, expected is ${LuaType.Function}`);
      for (const arg of args) this.pushValue(arg);
      const base = this.getTop() - args.length - 1;
      this.lua.lua_callk(this.address, args.length, LUA_MULTRET, 0, null);
      return this.getStackValues(base);
    }
    getStackValues(start = 0) {
      const returns = this.getTop() - start;
      const returnValues = new MultiReturn(returns);
      for (let i = 0; i < returns; i++) returnValues[i] = this.getValue(start + i + 1);
      return returnValues;
    }
    stateToThread(L) {
      return L === this.parent?.address ? this.parent : new Thread(this.lua, this.typeExtensions, L, this.parent || this);
    }
    pushValue(rawValue, userdata) {
      const decoratedValue = this.getValueDecorations(rawValue);
      const target = decoratedValue.target;
      if (target instanceof Thread) {
        const isMain = this.lua.lua_pushthread(target.address) === 1;
        if (!isMain) this.lua.lua_xmove(target.address, this.address, 1);
        return;
      }
      const startTop = this.getTop();
      switch (typeof target) {
        case "undefined":
          this.lua.lua_pushnil(this.address);
          break;
        case "number":
          if (Number.isInteger(target)) this.lua.lua_pushinteger(this.address, BigInt(target));else this.lua.lua_pushnumber(this.address, target);
          break;
        case "string":
          this.lua.lua_pushstring(this.address, target);
          break;
        case "boolean":
          this.lua.lua_pushboolean(this.address, target ? 1 : 0);
          break;
        default:
          if (this.typeExtensions.find(wrapper => wrapper.extension.pushValue(this, decoratedValue, userdata))) break;
          if (target === null) {
            this.lua.lua_pushnil(this.address);
            break;
          }
          throw new Error(`The type '${typeof target}' is not supported by Lua`);
      }
      if (decoratedValue.options.metatable) this.setMetatable(-1, decoratedValue.options.metatable);
      if (this.getTop() !== startTop + 1) throw new Error(`pushValue expected stack size ${startTop + 1}, got ${this.getTop()}`);
    }
    setMetatable(index, metatable) {
      index = this.lua.lua_absindex(this.address, index);
      if (this.lua.lua_getmetatable(this.address, index)) {
        this.pop(1);
        const name = this.getMetatableName(index);
        throw new Error(`data already has associated metatable: ${name || "unknown name"}`);
      }
      this.pushValue(metatable);
      this.lua.lua_setmetatable(this.address, index);
    }
    getMetatableName(index) {
      const metatableNameType = this.lua.luaL_getmetafield(this.address, index, "__name");
      if (metatableNameType === LuaType.Nil) return undefined;
      if (metatableNameType !== LuaType.String) {
        this.pop(1);
        return undefined;
      }
      const name = this.lua.lua_tolstring(this.address, -1, null);
      this.pop(1);
      return name;
    }
    getValue(index, inputType, userdata) {
      index = this.lua.lua_absindex(this.address, index);
      const type = inputType ?? this.lua.lua_type(this.address, index);
      switch (type) {
        case LuaType.None:
          return undefined;
        case LuaType.Nil:
          return null;
        case LuaType.Number:
          return this.lua.lua_tonumberx(this.address, index, null);
        case LuaType.String:
          return this.lua.lua_tolstring(this.address, index, null);
        case LuaType.Boolean:
          return Boolean(this.lua.lua_toboolean(this.address, index));
        case LuaType.Thread:
          return this.stateToThread(this.lua.lua_tothread(this.address, index));
        default:
          {
            let metatableName;
            if (type === LuaType.Table || type === LuaType.Userdata) metatableName = this.getMetatableName(index);
            const typeExtensionWrapper = this.typeExtensions.find(wrapper => wrapper.extension.isType(this, index, type, metatableName));
            if (typeExtensionWrapper) return typeExtensionWrapper.extension.getValue(this, index, userdata);
            console.warn(`The type '${this.lua.lua_typename(this.address, type)}' returned is not supported on JS`);
            return new Pointer(this.lua.lua_topointer(this.address, index));
          }
      }
    }
    close() {
      if (this.isClosed()) return;
      if (this.hookFunctionPointer) this.lua.module.removeFunction(this.hookFunctionPointer);
      this.closed = true;
    }
    setTimeout(timeout) {
      if (timeout && timeout > 0) {
        if (!this.hookFunctionPointer) this.hookFunctionPointer = this.lua.module.addFunction(() => {
          if (Date.now() > timeout) {
            this.pushValue(new LuaTimeoutError(`thread timeout exceeded`));
            this.lua.lua_error(this.address);
          }
        }, "vii");
        this.lua.lua_sethook(this.address, this.hookFunctionPointer, LuaEventMasks.Count, INSTRUCTION_HOOK_COUNT);
        this.timeout = timeout;
      } else if (this.hookFunctionPointer) {
        this.hookFunctionPointer = undefined;
        this.timeout = undefined;
        this.lua.lua_sethook(this.address, null, 0, 0);
      }
    }
    getTimeout() {
      return this.timeout;
    }
    getPointer(index) {
      return new Pointer(this.lua.lua_topointer(this.address, index));
    }
    isClosed() {
      return !this.address || this.closed || Boolean(this.parent?.isClosed());
    }
    indexToString(index) {
      const str = this.lua.luaL_tolstring(this.address, index, null);
      this.pop();
      return str;
    }
    dumpStack(log = console.log) {
      const top = this.getTop();
      for (let i = 1; i <= top; i++) {
        const type = this.lua.lua_type(this.address, i);
        const typename = this.lua.lua_typename(this.address, type);
        const pointer = this.getPointer(i);
        const name = this.indexToString(i);
        const value = this.getValue(i, type);
        log(i, typename, pointer, name, value);
      }
    }
    assertOk(result) {
      if (result !== LuaReturn.Ok && result !== LuaReturn.Yield) {
        const resultString = LuaReturn[result];
        const error = new Error(`Lua Error(${resultString}/${result})`);
        if (this.getTop() > 0) if (result === LuaReturn.ErrorMem) error.message = this.lua.lua_tolstring(this.address, -1, null);else {
          const luaError = this.getValue(-1);
          if (luaError instanceof Error) error.stack = luaError.stack;
          error.message = this.indexToString(-1);
        }
        if (result !== LuaReturn.ErrorMem) try {
          this.lua.luaL_traceback(this.address, this.address, null, 1);
          const traceback = this.lua.lua_tolstring(this.address, -1, null);
          if (traceback.trim() !== "stack traceback:") error.message = `${error.message}\n${traceback}`;
          this.pop(1);
        } catch (err) {
          console.warn("Failed to generate stack trace", err);
        }
        throw error;
      }
    }
    getValueDecorations(value) {
      return value instanceof Decoration ? value : new Decoration(value, {});
    }
  };

  var Global = class extends Thread {
    memoryStats;
    allocatorFunctionPointer;

    constructor(cmodule, shouldTraceAllocations) {
      if (shouldTraceAllocations) {
        const memoryStats = {
          memoryUsed: 0
        };
        const allocatorFunctionPointer = cmodule.module.addFunction((_userData, pointer, oldSize, newSize) => {
          if (newSize === 0) {
            if (pointer) {
              memoryStats.memoryUsed -= oldSize;
              cmodule.module._free(pointer);
            }
            return 0;
          }
          const endMemoryDelta = pointer ? newSize - oldSize : newSize;
          const endMemory = memoryStats.memoryUsed + endMemoryDelta;
          if (newSize > oldSize && memoryStats.memoryMax && endMemory > memoryStats.memoryMax) return 0;
          const reallocated = cmodule.module._realloc(pointer, newSize);
          if (reallocated) memoryStats.memoryUsed = endMemory;
          return reallocated;
        }, "iiiii");
        const address = cmodule.lua_newstate(allocatorFunctionPointer, null);
        if (!address) {
          cmodule.module.removeFunction(allocatorFunctionPointer);
          throw new Error("lua_newstate returned a null pointer");
        }
        super(cmodule, [], address);
        this.memoryStats = memoryStats;
        this.allocatorFunctionPointer = allocatorFunctionPointer;
      } else super(cmodule, [], cmodule.luaL_newstate());
      if (this.isClosed()) throw new Error("Global state could not be created (probably due to lack of memory)");
    }

    close() {
      if (this.isClosed()) return;
      super.close();
      this.lua.lua_close(this.address);
      if (this.allocatorFunctionPointer) this.lua.module.removeFunction(this.allocatorFunctionPointer);
      for (const wrapper of this.typeExtensions) wrapper.extension.close();
    }

    registerTypeExtension(priority, extension) {
      this.typeExtensions.push({
        extension,
        priority
      });
      this.typeExtensions.sort((a, b) => b.priority - a.priority);
    }

    loadLibrary(library) {
      switch (library) {
        case LuaLibraries.Base:
          this.lua.luaopen_base(this.address);
          break;
        case LuaLibraries.Coroutine:
          this.lua.luaopen_coroutine(this.address);
          break;
        case LuaLibraries.Table:
          this.lua.luaopen_table(this.address);
          break;
        case LuaLibraries.IO:
          this.lua.luaopen_io(this.address);
          break;
        case LuaLibraries.OS:
          this.lua.luaopen_os(this.address);
          break;
        case LuaLibraries.String:
          this.lua.luaopen_string(this.address);
          break;
        case LuaLibraries.UTF8:
          this.lua.luaopen_utf8(this.address);
          break;
        case LuaLibraries.Math:
          this.lua.luaopen_math(this.address);
          break;
        case LuaLibraries.Debug:
          this.lua.luaopen_debug(this.address);
          break;
        case LuaLibraries.Package:
          this.lua.luaopen_package(this.address);
          break;
      }
      this.lua.lua_setglobal(this.address, library);
    }

    get(name) {
      const type = this.lua.lua_getglobal(this.address, name);
      const value = this.getValue(-1, type);
      this.pop();
      return value;
    }

    set(name, value) {
      this.pushValue(value);
      this.lua.lua_setglobal(this.address, name);
    }
    getTable(name, callback) {
      const startStackTop = this.getTop();
      const type = this.lua.lua_getglobal(this.address, name);
      try {
        if (type !== LuaType.Table) throw new TypeError(`Unexpected type in ${name}. Expected ${LuaType[LuaType.Table]}. Got ${LuaType[type]}.`);
        callback(startStackTop + 1);
      } finally {
        if (this.getTop() !== startStackTop + 1) console.warn(`getTable: expected stack size ${startStackTop} got ${this.getTop()}`);
        this.setTop(startStackTop);
      }
    }

    getMemoryUsed() {
      return this.getMemoryStatsRef().memoryUsed;
    }

    getMemoryMax() {
      return this.getMemoryStatsRef().memoryMax;
    }

    setMemoryMax(max) {
      this.getMemoryStatsRef().memoryMax = max;
    }
    getMemoryStatsRef() {
      if (!this.memoryStats) throw new Error("Memory allocations is not being traced, please build engine with { traceAllocations: true }");
      return this.memoryStats;
    }
  };

  _exports.LuaGlobal = Global;
  var LuaTypeExtension = class {
    name;
    thread;
    constructor(thread, name) {
      this.thread = thread;
      this.name = name;
    }
    isType(_thread, _index, type, name) {
      return type === LuaType.Userdata && name === this.name;
    }
    getValue(thread, index, _userdata) {
      const refUserdata = thread.lua.luaL_testudata(thread.address, index, this.name);
      if (!refUserdata) throw new Error(`data does not have the expected metatable: ${this.name}`);
      const referencePointer = thread.lua.module.getValue(refUserdata, "*");
      return thread.lua.getRef(referencePointer);
    }
    pushValue(thread, decoratedValue, _userdata) {
      const {
        target
      } = decoratedValue;
      const pointer = thread.lua.ref(target);
      const userDataPointer = thread.lua.lua_newuserdatauv(thread.address, PointerSize, 0);
      thread.lua.module.setValue(userDataPointer, pointer, "*");
      if (LuaType.Nil === thread.lua.luaL_getmetatable(thread.address, this.name)) {
        thread.pop(2);
        throw new Error(`metatable not found: ${this.name}`);
      }
      thread.lua.lua_setmetatable(thread.address, -2);
      return true;
    }
  };

  _exports.LuaTypeExtension = LuaTypeExtension;
  var ErrorTypeExtension = class extends LuaTypeExtension {
    gcPointer;
    constructor(thread, injectObject) {
      super(thread, "js_error");
      this.gcPointer = thread.lua.module.addFunction(functionStateAddress => {
        const userDataPointer = thread.lua.luaL_checkudata(functionStateAddress, 1, this.name);
        const referencePointer = thread.lua.module.getValue(userDataPointer, "*");
        thread.lua.unref(referencePointer);
        return LuaReturn.Ok;
      }, "ii");
      if (thread.lua.luaL_newmetatable(thread.address, this.name)) {
        const metatableIndex = thread.lua.lua_gettop(thread.address);
        thread.lua.lua_pushstring(thread.address, "protected metatable");
        thread.lua.lua_setfield(thread.address, metatableIndex, "__metatable");
        thread.lua.lua_pushcclosure(thread.address, this.gcPointer, 0);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__gc");
        thread.pushValue((jsRefError, key) => {
          if (key === "message") return jsRefError.message;
          return null;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__index");
        thread.pushValue(jsRefError => {
          return jsRefError.message;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__tostring");
      }
      thread.lua.lua_pop(thread.address, 1);
      if (injectObject) thread.set("Error", {
        create: message => {
          if (message && typeof message !== "string") throw new Error("message must be a string");
          return new Error(message);
        }
      });
    }
    pushValue(thread, decoration) {
      if (!(decoration.target instanceof Error)) return false;
      return super.pushValue(thread, decoration);
    }
    close() {
      this.thread.lua.module.removeFunction(this.gcPointer);
    }
  };
  function createTypeExtension$6(thread, injectObject) {
    return new ErrorTypeExtension(thread, injectObject);
  }

  var RawResult = class {
    constructor(count) {
      this.count = count;
    }
  };

  _exports.LuaRawResult = RawResult;
  function decorateFunction(target, options) {
    return new Decoration(target, options);
  }
  var FunctionTypeExtension = class extends LuaTypeExtension {
    functionRegistry = typeof FinalizationRegistry !== "undefined" ? new FinalizationRegistry(func => {
      if (!this.thread.isClosed()) this.thread.lua.luaL_unref(this.thread.address, LUA_REGISTRYINDEX, func);
    }) : undefined;
    gcPointer;
    functionWrapper;
    callbackContext;
    callbackContextIndex;
    options;
    constructor(thread, options) {
      super(thread, "js_function");
      this.options = options;
      this.callbackContext = thread.newThread();
      this.callbackContextIndex = this.thread.lua.luaL_ref(thread.address, LUA_REGISTRYINDEX);
      if (!this.functionRegistry) console.warn("FunctionTypeExtension: FinalizationRegistry not found. Memory leaks likely.");
      this.gcPointer = thread.lua.module.addFunction(calledL => {
        thread.lua.luaL_checkudata(calledL, 1, this.name);
        const userDataPointer = thread.lua.luaL_checkudata(calledL, 1, this.name);
        const referencePointer = thread.lua.module.getValue(userDataPointer, "*");
        thread.lua.unref(referencePointer);
        return LuaReturn.Ok;
      }, "ii");
      if (thread.lua.luaL_newmetatable(thread.address, this.name)) {
        thread.lua.lua_pushstring(thread.address, "__gc");
        thread.lua.lua_pushcclosure(thread.address, this.gcPointer, 0);
        thread.lua.lua_settable(thread.address, -3);
        thread.lua.lua_pushstring(thread.address, "__metatable");
        thread.lua.lua_pushstring(thread.address, "protected metatable");
        thread.lua.lua_settable(thread.address, -3);
      }
      thread.lua.lua_pop(thread.address, 1);
      this.functionWrapper = thread.lua.module.addFunction(calledL => {
        const calledThread = thread.stateToThread(calledL);
        const refUserdata = thread.lua.luaL_checkudata(calledL, thread.lua.lua_upvalueindex(1), this.name);
        const refPointer = thread.lua.module.getValue(refUserdata, "*");
        const {
          target,
          options: options$1
        } = thread.lua.getRef(refPointer);
        const argsQuantity = calledThread.getTop();
        const args = [];
        if (options$1.receiveThread) args.push(calledThread);
        if (options$1.receiveArgsQuantity) args.push(argsQuantity);else for (let i = 1; i <= argsQuantity; i++) {
          const value = calledThread.getValue(i);
          if (i !== 1 || !options$1?.self || value !== options$1.self) args.push(value);
        }
        try {
          const result = target.apply(options$1?.self, args);
          if (result === undefined) return 0;else if (result instanceof RawResult) return result.count;else if (result instanceof MultiReturn) {
            for (const item of result) calledThread.pushValue(item);
            return result.length;
          } else {
            calledThread.pushValue(result);
            return 1;
          }
        } catch (err) {
          if (err === Infinity) throw err;
          calledThread.pushValue(err);
          return calledThread.lua.lua_error(calledThread.address);
        }
      }, "ii");
    }
    close() {
      this.thread.lua.module.removeFunction(this.gcPointer);
      this.thread.lua.module.removeFunction(this.functionWrapper);
      this.callbackContext.close();
      this.callbackContext.lua.luaL_unref(this.callbackContext.address, LUA_REGISTRYINDEX, this.callbackContextIndex);
    }
    isType(_thread, _index, type) {
      return type === LuaType.Function;
    }
    pushValue(thread, decoration) {
      if (typeof decoration.target !== "function") return false;
      const pointer = thread.lua.ref(decoration);
      const userDataPointer = thread.lua.lua_newuserdatauv(thread.address, PointerSize, 0);
      thread.lua.module.setValue(userDataPointer, pointer, "*");
      if (LuaType.Nil === thread.lua.luaL_getmetatable(thread.address, this.name)) {
        thread.pop(1);
        thread.lua.unref(pointer);
        throw new Error(`metatable not found: ${this.name}`);
      }
      thread.lua.lua_setmetatable(thread.address, -2);
      thread.lua.lua_pushcclosure(thread.address, this.functionWrapper, 1);
      return true;
    }
    getValue(thread, index) {
      thread.lua.lua_pushvalue(thread.address, index);
      const func = thread.lua.luaL_ref(thread.address, LUA_REGISTRYINDEX);
      const jsFunc = (...args) => {
        if (this.callbackContext.isClosed()) {
          console.warn("Tried to call a function after closing lua state");
          return;
        }
        const callThread = this.callbackContext.newThread();
        try {
          const internalType = callThread.lua.lua_rawgeti(callThread.address, LUA_REGISTRYINDEX, BigInt(func));
          if (internalType !== LuaType.Function) {
            const callMetafieldType = callThread.lua.luaL_getmetafield(callThread.address, -1, "__call");
            callThread.pop();
            if (callMetafieldType !== LuaType.Function) throw new Error(`A value of type '${internalType}' was pushed but it is not callable`);
          }
          for (const arg of args) callThread.pushValue(arg);
          if (this.options?.functionTimeout) callThread.setTimeout(Date.now() + this.options.functionTimeout);
          const resumeResult = callThread.resume(args.length);
          if (resumeResult.result === LuaReturn.Yield) return new Promise((r, c) => {
            callThread.run(0).then(() => {
              if (callThread.getTop() > 0) {
                r(callThread.getValue(-1));
                return;
              }
              r(undefined);
            }).catch(c);
          });
          callThread.assertOk(resumeResult.result);
          if (callThread.getTop() > 0) return callThread.getValue(-1);
          return undefined;
        } finally {
          callThread.close();
          this.callbackContext.pop();
        }
      };
      this.functionRegistry?.register(jsFunc, func);
      return jsFunc;
    }
  };
  function createTypeExtension$5(thread, options) {
    return new FunctionTypeExtension(thread, options);
  }

  var NullTypeExtension = class extends LuaTypeExtension {
    gcPointer;
    constructor(thread) {
      super(thread, "js_null");
      this.gcPointer = thread.lua.module.addFunction(functionStateAddress => {
        const userDataPointer = thread.lua.luaL_checkudata(functionStateAddress, 1, this.name);
        const referencePointer = thread.lua.module.getValue(userDataPointer, "*");
        thread.lua.unref(referencePointer);
        return LuaReturn.Ok;
      }, "ii");
      if (thread.lua.luaL_newmetatable(thread.address, this.name)) {
        const metatableIndex = thread.lua.lua_gettop(thread.address);
        thread.lua.lua_pushstring(thread.address, "protected metatable");
        thread.lua.lua_setfield(thread.address, metatableIndex, "__metatable");
        thread.lua.lua_pushcclosure(thread.address, this.gcPointer, 0);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__gc");
        thread.pushValue(() => null);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__index");
        thread.pushValue(() => "null");
        thread.lua.lua_setfield(thread.address, metatableIndex, "__tostring");
        thread.pushValue((self$1, other) => self$1 === other);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__eq");
      }
      thread.lua.lua_pop(thread.address, 1);
      super.pushValue(thread, new Decoration({}, {}));
      thread.lua.lua_setglobal(thread.address, "null");
    }
    getValue(thread, index) {
      const refUserData = thread.lua.luaL_testudata(thread.address, index, this.name);
      if (!refUserData) throw new Error(`data does not have the expected metatable: ${this.name}`);
      return null;
    }
    pushValue(thread, decoration) {
      if (decoration?.target !== null) return false;
      thread.lua.lua_getglobal(thread.address, "null");
      return true;
    }
    close() {
      this.thread.lua.module.removeFunction(this.gcPointer);
    }
  };
  function createTypeExtension$4(thread) {
    return new NullTypeExtension(thread);
  }

  const isPromise = target => {
    return target && (Promise.resolve(target) === target || typeof target.then === "function");
  };

  var PromiseTypeExtension = class extends LuaTypeExtension {
    gcPointer;
    constructor(thread, injectObject) {
      super(thread, "js_promise");
      this.gcPointer = thread.lua.module.addFunction(functionStateAddress => {
        const userDataPointer = thread.lua.luaL_checkudata(functionStateAddress, 1, this.name);
        const referencePointer = thread.lua.module.getValue(userDataPointer, "*");
        thread.lua.unref(referencePointer);
        return LuaReturn.Ok;
      }, "ii");
      if (thread.lua.luaL_newmetatable(thread.address, this.name)) {
        const metatableIndex = thread.lua.lua_gettop(thread.address);
        thread.lua.lua_pushstring(thread.address, "protected metatable");
        thread.lua.lua_setfield(thread.address, metatableIndex, "__metatable");
        thread.lua.lua_pushcclosure(thread.address, this.gcPointer, 0);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__gc");
        const checkSelf = self$1 => {
          if (!isPromise(self$1)) throw new Error("self instance is not a promise");
          return true;
        };
        thread.pushValue({
          next: (self$1, ...args) => checkSelf(self$1) && self$1.then(...args),
          catch: (self$1, ...args) => checkSelf(self$1) && self$1.catch(...args),
          finally: (self$1, ...args) => checkSelf(self$1) && self$1.finally(...args),
          await: decorateFunction((functionThread, self$1) => {
            checkSelf(self$1);
            if (functionThread.address === thread.address) throw new Error("cannot await in the main thread");
            let promiseResult = undefined;
            const awaitPromise = self$1.then(res => {
              promiseResult = {
                status: "fulfilled",
                value: res
              };
            }).catch(err => {
              promiseResult = {
                status: "rejected",
                value: err
              };
            });
            const continuance = this.thread.lua.module.addFunction(continuanceState => {
              if (!promiseResult) return thread.lua.lua_yieldk(functionThread.address, 0, 0, continuance);
              this.thread.lua.module.removeFunction(continuance);
              const continuanceThread = thread.stateToThread(continuanceState);
              if (promiseResult.status === "rejected") {
                continuanceThread.pushValue(promiseResult.value || new Error("promise rejected with no error"));
                return this.thread.lua.lua_error(continuanceState);
              }
              if (promiseResult.value instanceof RawResult) return promiseResult.value.count;else if (promiseResult.value instanceof MultiReturn) {
                for (const arg of promiseResult.value) continuanceThread.pushValue(arg);
                return promiseResult.value.length;
              } else {
                continuanceThread.pushValue(promiseResult.value);
                return 1;
              }
            }, "iiii");
            functionThread.pushValue(awaitPromise);
            return new RawResult(thread.lua.lua_yieldk(functionThread.address, 1, 0, continuance));
          }, {
            receiveThread: true
          })
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__index");
        thread.pushValue((self$1, other) => self$1 === other);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__eq");
      }
      thread.lua.lua_pop(thread.address, 1);
      if (injectObject) thread.set("Promise", {
        create: callback => new Promise(callback),
        all: promiseArray => {
          if (!Array.isArray(promiseArray)) throw new Error("argument must be an array of promises");
          return Promise.all(promiseArray.map(potentialPromise => Promise.resolve(potentialPromise)));
        },
        resolve: value => Promise.resolve(value)
      });
    }
    close() {
      this.thread.lua.module.removeFunction(this.gcPointer);
    }
    pushValue(thread, decoration) {
      if (!isPromise(decoration.target)) return false;
      return super.pushValue(thread, decoration);
    }
  };
  function createTypeExtension$3(thread, injectObject) {
    return new PromiseTypeExtension(thread, injectObject);
  }

  function decorateProxy(target, options) {
    return new Decoration(target, options || {});
  }
  var ProxyTypeExtension = class extends LuaTypeExtension {
    gcPointer;
    constructor(thread) {
      super(thread, "js_proxy");
      this.gcPointer = thread.lua.module.addFunction(functionStateAddress => {
        const userDataPointer = thread.lua.luaL_checkudata(functionStateAddress, 1, this.name);
        const referencePointer = thread.lua.module.getValue(userDataPointer, "*");
        thread.lua.unref(referencePointer);
        return LuaReturn.Ok;
      }, "ii");
      if (thread.lua.luaL_newmetatable(thread.address, this.name)) {
        const metatableIndex = thread.lua.lua_gettop(thread.address);
        thread.lua.lua_pushstring(thread.address, "protected metatable");
        thread.lua.lua_setfield(thread.address, metatableIndex, "__metatable");
        thread.lua.lua_pushcclosure(thread.address, this.gcPointer, 0);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__gc");
        thread.pushValue((self$1, key) => {
          switch (typeof key) {
            case "number":
              key = key - 1;
            case "string":
              break;
            default:
              throw new Error("Only strings or numbers can index js objects");
          }
          const value = self$1[key];
          if (typeof value === "function") return decorateFunction(value, {
            self: self$1
          });
          return value;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__index");
        thread.pushValue((self$1, key, value) => {
          switch (typeof key) {
            case "number":
              key = key - 1;
            case "string":
              break;
            default:
              throw new Error("Only strings or numbers can index js objects");
          }
          self$1[key] = value;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__newindex");
        thread.pushValue(self$1 => {
          return self$1.toString?.() ?? typeof self$1;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__tostring");
        thread.pushValue(self$1 => {
          return self$1.length || 0;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__len");
        thread.pushValue(self$1 => {
          const keys = Object.getOwnPropertyNames(self$1);
          let i = 0;
          return MultiReturn.of(() => {
            const ret = MultiReturn.of(keys[i], self$1[keys[i]]);
            i++;
            return ret;
          }, self$1, null);
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__pairs");
        thread.pushValue((self$1, other) => {
          return self$1 === other;
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__eq");
        thread.pushValue((self$1, ...args) => {
          if (args[0] === self$1) args.shift();
          return self$1(...args);
        });
        thread.lua.lua_setfield(thread.address, metatableIndex, "__call");
      }
      thread.lua.lua_pop(thread.address, 1);
    }
    isType(_thread, _index, type, name) {
      return type === LuaType.Userdata && name === this.name;
    }
    getValue(thread, index) {
      const refUserdata = thread.lua.lua_touserdata(thread.address, index);
      const referencePointer = thread.lua.module.getValue(refUserdata, "*");
      return thread.lua.getRef(referencePointer);
    }
    pushValue(thread, decoratedValue) {
      const {
        target,
        options
      } = decoratedValue;
      if (options.proxy === undefined) {
        if (target === null || target === undefined) return false;
        if (typeof target !== "object") {
          const isClass = typeof target === "function" && target.prototype?.constructor === target && target.toString().startsWith("class ");
          if (!isClass) return false;
        }
        if (isPromise(target)) return false;
      } else if (options.proxy === false) return false;
      if (options.metatable && !(options.metatable instanceof Decoration)) {
        decoratedValue.options.metatable = decorateProxy(options.metatable, {
          proxy: false
        });
        return false;
      }
      return super.pushValue(thread, decoratedValue);
    }
    close() {
      this.thread.lua.module.removeFunction(this.gcPointer);
    }
  };
  function createTypeExtension$2(thread) {
    return new ProxyTypeExtension(thread);
  }

  var TableTypeExtension = class extends LuaTypeExtension {
    constructor(thread) {
      super(thread, "js_table");
    }
    close() {}
    isType(_thread, _index, type) {
      return type === LuaType.Table;
    }
    getValue(thread, index, userdata) {
      const seenMap = userdata || new Map();
      const pointer = thread.lua.lua_topointer(thread.address, index);
      let table = seenMap.get(pointer);
      if (!table) {
        const keys = this.readTableKeys(thread, index);
        const isSequential = keys.length > 0 && keys.every((key, index$1) => key === String(index$1 + 1));
        table = isSequential ? [] : {};
        seenMap.set(pointer, table);
        this.readTableValues(thread, index, seenMap, table);
      }
      return table;
    }
    pushValue(thread, {
      target
    }, userdata) {
      if (typeof target !== "object" || target === null) return false;
      const seenMap = userdata || new Map();
      const existingReference = seenMap.get(target);
      if (existingReference !== undefined) {
        thread.lua.lua_rawgeti(thread.address, LUA_REGISTRYINDEX, BigInt(existingReference));
        return true;
      }
      try {
        const tableIndex = thread.getTop() + 1;
        const createTable = (arrayCount, keyCount) => {
          thread.lua.lua_createtable(thread.address, arrayCount, keyCount);
          const ref = thread.lua.luaL_ref(thread.address, LUA_REGISTRYINDEX);
          seenMap.set(target, ref);
          thread.lua.lua_rawgeti(thread.address, LUA_REGISTRYINDEX, BigInt(ref));
        };
        if (Array.isArray(target)) {
          createTable(target.length, 0);
          for (let i = 0; i < target.length; i++) {
            thread.pushValue(i + 1, seenMap);
            thread.pushValue(target[i], seenMap);
            thread.lua.lua_settable(thread.address, tableIndex);
          }
        } else {
          createTable(0, Object.getOwnPropertyNames(target).length);
          for (const key in target) {
            thread.pushValue(key, seenMap);
            thread.pushValue(target[key], seenMap);
            thread.lua.lua_settable(thread.address, tableIndex);
          }
        }
      } finally {
        if (userdata === undefined) for (const reference of seenMap.values()) thread.lua.luaL_unref(thread.address, LUA_REGISTRYINDEX, reference);
      }
      return true;
    }
    readTableKeys(thread, index) {
      const keys = [];
      thread.lua.lua_pushnil(thread.address);
      while (thread.lua.lua_next(thread.address, index)) {
        const key = thread.indexToString(-2);
        keys.push(key);
        thread.pop();
      }
      return keys;
    }
    readTableValues(thread, index, seenMap, table) {
      const isArray = Array.isArray(table);
      thread.lua.lua_pushnil(thread.address);
      while (thread.lua.lua_next(thread.address, index)) {
        const key = thread.indexToString(-2);
        const value = thread.getValue(-1, undefined, seenMap);
        if (isArray) table.push(value);else table[key] = value;
        thread.pop();
      }
    }
  };
  function createTypeExtension$1(thread) {
    return new TableTypeExtension(thread);
  }

  function decorateUserdata(target) {
    return new Decoration(target, {
      reference: true
    });
  }
  var UserdataTypeExtension = class extends LuaTypeExtension {
    gcPointer;
    constructor(thread) {
      super(thread, "js_userdata");
      this.gcPointer = thread.lua.module.addFunction(functionStateAddress => {
        const userDataPointer = thread.lua.luaL_checkudata(functionStateAddress, 1, this.name);
        const referencePointer = thread.lua.module.getValue(userDataPointer, "*");
        thread.lua.unref(referencePointer);
        return LuaReturn.Ok;
      }, "ii");
      if (thread.lua.luaL_newmetatable(thread.address, this.name)) {
        const metatableIndex = thread.lua.lua_gettop(thread.address);
        thread.lua.lua_pushstring(thread.address, "protected metatable");
        thread.lua.lua_setfield(thread.address, metatableIndex, "__metatable");
        thread.lua.lua_pushcclosure(thread.address, this.gcPointer, 0);
        thread.lua.lua_setfield(thread.address, metatableIndex, "__gc");
      }
      thread.lua.lua_pop(thread.address, 1);
    }
    isType(_thread, _index, type, name) {
      return type === LuaType.Userdata && name === this.name;
    }
    getValue(thread, index) {
      const refUserdata = thread.lua.lua_touserdata(thread.address, index);
      const referencePointer = thread.lua.module.getValue(refUserdata, "*");
      return thread.lua.getRef(referencePointer);
    }
    pushValue(thread, decoratedValue) {
      if (!decoratedValue.options.reference) return false;
      return super.pushValue(thread, decoratedValue);
    }
    close() {
      this.thread.lua.module.removeFunction(this.gcPointer);
    }
  };
  function createTypeExtension(thread) {
    return new UserdataTypeExtension(thread);
  }

  var LuaEngine = class {
    global;
    constructor(cmodule, {
      openStandardLibs = true,
      injectObjects = false,
      enableProxy = true,
      traceAllocations = false,
      functionTimeout = undefined
    } = {}) {
      this.cmodule = cmodule;
      this.global = new Global(this.cmodule, traceAllocations);
      this.global.registerTypeExtension(0, createTypeExtension$1(this.global));
      this.global.registerTypeExtension(0, createTypeExtension$5(this.global, {
        functionTimeout
      }));
      this.global.registerTypeExtension(1, createTypeExtension$3(this.global, injectObjects));
      if (injectObjects) this.global.registerTypeExtension(5, createTypeExtension$4(this.global));
      if (enableProxy) this.global.registerTypeExtension(3, createTypeExtension$2(this.global));else this.global.registerTypeExtension(1, createTypeExtension$6(this.global, injectObjects));
      this.global.registerTypeExtension(4, createTypeExtension(this.global));
      if (openStandardLibs) this.cmodule.luaL_openlibs(this.global.address);
    }

    doString(script) {
      return this.callByteCode(thread => thread.loadString(script));
    }

    doFile(filename) {
      return this.callByteCode(thread => thread.loadFile(filename));
    }

    doStringSync(script) {
      this.global.loadString(script);
      const result = this.global.runSync();
      return result[0];
    }

    doFileSync(filename) {
      this.global.loadFile(filename);
      const result = this.global.runSync();
      return result[0];
    }
    async callByteCode(loader) {
      const thread = this.global.newThread();
      const threadIndex = this.global.getTop();
      try {
        loader(thread);
        const result = await thread.run(0);
        if (result.length > 0) return thread.getValue(thread.getTop() - result.length + 1);
        return undefined;
      } finally {
        this.global.remove(threadIndex);
      }
    }
  };

  _exports.LuaEngine = LuaEngine;
  var package_version_default = "1.16.1";

  async function initWasmModule(moduleArg = {}) {
    var moduleRtn;
    var Module = moduleArg;
    var ENVIRONMENT_IS_WEB = typeof window == "object";
    var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
    var ENVIRONMENT_IS_NODE = typeof process == "object" && process.versions?.node && process.type != "renderer";
    if (ENVIRONMENT_IS_NODE) {
      const {
        createRequire
      } = await import("module");
      var require = createRequire('https://inventionpro.github.io/Webx-viewer/media/wasmoon/index.js');
    }
    var arguments_ = [];
    var thisProgram = "./this.program";
    var quit_ = (status, toThrow) => {
      throw toThrow;
    };
    var _scriptName = 'https://inventionpro.github.io/Webx-viewer/media/wasmoon/index.js';
    var scriptDirectory = "";
    function locateFile(path) {
      if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
      return scriptDirectory + path;
    }
    var readAsync, readBinary;
    if (ENVIRONMENT_IS_NODE) {
      var fs = require("fs");
      if (_scriptName.startsWith("file:")) scriptDirectory = require("path").dirname(require("url").fileURLToPath(_scriptName)) + "/";
      readBinary = filename => {
        filename = isFileURI(filename) ? new URL(filename) : filename;
        var ret = fs.readFileSync(filename);
        return ret;
      };
      readAsync = async (filename, binary = true) => {
        filename = isFileURI(filename) ? new URL(filename) : filename;
        var ret = fs.readFileSync(filename, binary ? undefined : "utf8");
        return ret;
      };
      if (process.argv.length > 1) thisProgram = process.argv[1].replace(/\\/g, "/");
      arguments_ = process.argv.slice(2);
      quit_ = (status, toThrow) => {
        process.exitCode = status;
        throw toThrow;
      };
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      try {
        scriptDirectory = new URL(".", _scriptName).href;
      } catch {}
      {
        if (ENVIRONMENT_IS_WORKER) readBinary = url => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(xhr.response);
        };
        readAsync = async url => {
          var response = await fetch(url, {
            credentials: "same-origin"
          });
          if (response.ok) return response.arrayBuffer();
          throw new Error(response.status + " : " + response.url);
        };
      }
    }
    var out = console.log.bind(console);
    var err = console.error.bind(console);
    var wasmBinary;
    var ABORT = false;
    var EXITSTATUS;
    var isFileURI = filename => filename.startsWith("file://");
    var readyPromiseResolve, readyPromiseReject;
    var wasmMemory;
    var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    var HEAP64, HEAPU64;
    var runtimeInitialized = false;
    function updateMemoryViews() {
      var b = wasmMemory.buffer;
      HEAP8 = new Int8Array(b);
      HEAP16 = new Int16Array(b);
      HEAPU8 = new Uint8Array(b);
      HEAPU16 = new Uint16Array(b);
      HEAP32 = new Int32Array(b);
      HEAPU32 = new Uint32Array(b);
      HEAPF32 = new Float32Array(b);
      HEAPF64 = new Float64Array(b);
      HEAP64 = new BigInt64Array(b);
      HEAPU64 = new BigUint64Array(b);
    }
    function preRun() {
      if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
      }
      callRuntimeCallbacks(onPreRuns);
    }
    function initRuntime() {
      runtimeInitialized = true;
      if (!Module["noFSInit"] && !FS.initialized) FS.init();
      TTY.init();
      wasmExports["B"]();
      FS.ignorePermissions = false;
    }
    function postRun() {}
    var runDependencies = 0;
    var dependenciesFulfilled = null;
    function addRunDependency(id) {
      runDependencies++;
    }
    function removeRunDependency(id) {
      runDependencies--;
      if (runDependencies == 0) {
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    function abort(what) {
      what = "Aborted(" + what + ")";
      err(what);
      ABORT = true;
      what += ". Build with -sASSERTIONS for more info.";
      var e = new WebAssembly.RuntimeError(what);
      readyPromiseReject?.(e);
      throw e;
    }
    var wasmBinaryFile;
    function findWasmBinary() {
      if (Module["locateFile"]) return locateFile("glue.wasm");
      return new URL("glue.wasm", 'https://inventionpro.github.io/Webx-viewer/media/wasmoon/index.js').href;
    }
    function getBinarySync(file) {
      if (readBinary) return readBinary(file);
      throw "both async and sync fetching of the wasm failed";
    }
    async function getWasmBinary(binaryFile) {
      if (!wasmBinary) try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {}
      return getBinarySync(binaryFile);
    }
    async function instantiateArrayBuffer(binaryFile, imports) {
      try {
        var binary = await getWasmBinary(binaryFile);
        var instance = await WebAssembly.instantiate(binary, imports);
        return instance;
      } catch (reason) {
        err(`failed to asynchronously prepare wasm: ${reason}`);
        abort(reason);
      }
    }
    async function instantiateAsync(binary, binaryFile, imports) {
      if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !ENVIRONMENT_IS_NODE) try {
        var response = fetch(binaryFile, {
          credentials: "same-origin"
        });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
      return instantiateArrayBuffer(binaryFile, imports);
    }
    function getWasmImports() {
      return {
        a: wasmImports
      };
    }
    async function createWasm() {
      function receiveInstance(instance, module) {
        wasmExports = instance.exports;
        wasmMemory = wasmExports["A"];
        updateMemoryViews();
        wasmTable = wasmExports["_a"];
        assignWasmExports(wasmExports);
        removeRunDependency("wasm-instantiate");
        return wasmExports;
      }
      addRunDependency("wasm-instantiate");
      function receiveInstantiationResult(result$1) {
        return receiveInstance(result$1["instance"]);
      }
      var info = getWasmImports();
      wasmBinaryFile ??= findWasmBinary();
      var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
      var exports = receiveInstantiationResult(result);
      return exports;
    }
    class ExitStatus {
      name = "ExitStatus";
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }
    var callRuntimeCallbacks = callbacks => {
      while (callbacks.length > 0) callbacks.shift()(Module);
    };
    var onPreRuns = [];
    var addOnPreRun = cb => onPreRuns.push(cb);
    function getValue(ptr, type = "i8") {
      if (type.endsWith("*")) type = "*";
      switch (type) {
        case "i1":
          return HEAP8[ptr];
        case "i8":
          return HEAP8[ptr];
        case "i16":
          return HEAP16[ptr >> 1];
        case "i32":
          return HEAP32[ptr >> 2];
        case "i64":
          return HEAP64[ptr >> 3];
        case "float":
          return HEAPF32[ptr >> 2];
        case "double":
          return HEAPF64[ptr >> 3];
        case "*":
          return HEAPU32[ptr >> 2];
        default:
          abort(`invalid type for getValue: ${type}`);
      }
    }
    function setValue(ptr, value, type = "i8") {
      if (type.endsWith("*")) type = "*";
      switch (type) {
        case "i1":
          HEAP8[ptr] = value;
          break;
        case "i8":
          HEAP8[ptr] = value;
          break;
        case "i16":
          HEAP16[ptr >> 1] = value;
          break;
        case "i32":
          HEAP32[ptr >> 2] = value;
          break;
        case "i64":
          HEAP64[ptr >> 3] = BigInt(value);
          break;
        case "float":
          HEAPF32[ptr >> 2] = value;
          break;
        case "double":
          HEAPF64[ptr >> 3] = value;
          break;
        case "*":
          HEAPU32[ptr >> 2] = value;
          break;
        default:
          abort(`invalid type for setValue: ${type}`);
      }
    }
    var stackRestore = val => __emscripten_stack_restore(val);
    var stackSave = () => _emscripten_stack_get_current();
    var PATH = {
      isAbs: path => path.charAt(0) === "/",
      splitPath: filename => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
      normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === ".") parts.splice(i, 1);else if (last === "..") {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        if (allowAboveRoot) for (; up; up--) parts.unshift("..");
        return parts;
      },
      normalize: path => {
        var isAbsolute = PATH.isAbs(path),
          trailingSlash = path.slice(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
        if (!path && !isAbsolute) path = ".";
        if (path && trailingSlash) path += "/";
        return (isAbsolute ? "/" : "") + path;
      },
      dirname: path => {
        var result = PATH.splitPath(path),
          root = result[0],
          dir = result[1];
        if (!root && !dir) return ".";
        if (dir) dir = dir.slice(0, -1);
        return root + dir;
      },
      basename: path => path && path.match(/([^\/]+|\/)\
    constructor(customWasmUri, environmentVariables) {
      if (customWasmUri === undefined) {
        const isBrowser = typeof window === "object" && typeof window.document !== "undefined" || typeof self === "object" && self?.constructor?.name === "DedicatedWorkerGlobalScope";
        if (isBrowser) customWasmUri = `https://inventionpro.github.io/Webx-viewer/media/wasmoon/glue.wasm`;
      }
      this.luaWasmPromise = LuaWasm.initialize(customWasmUri, environmentVariables);
    }

    async mountFile(path, content) {
      this.mountFileSync(await this.getLuaModule(), path, content);
    }

    mountFileSync(luaWasm, path, content) {
      const fileSep = path.lastIndexOf("/");
      const file = path.substring(fileSep + 1);
      const body = path.substring(0, path.length - file.length - 1);
      if (body.length > 0) {
        const parts = body.split("/").reverse();
        let parent = "";
        while (parts.length) {
          const part = parts.pop();
          if (!part) continue;
          const current = `${parent}/${part}`;
          try {
            luaWasm.module.FS.mkdir(current);
          } catch {}
          parent = current;
        }
      }
      luaWasm.module.FS.writeFile(path, content);
    }

    async createEngine(options = {}) {
      return new LuaEngine(await this.getLuaModule(), options);
    }

    async getLuaModule() {
      return this.luaWasmPromise;
    }
  };

  _exports.LuaFactory = LuaFactory;
});