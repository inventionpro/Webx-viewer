
//#region src/decoration.ts
var Decoration = class {
	constructor(target, options) {
		this.target = target;
		this.options = options;
	}
};
function decorate(target, options) {
	return new Decoration(target, options);
}

//#endregion
//#region src/multireturn.ts
var MultiReturn = class extends Array {};

//#endregion
//#region src/pointer.ts
var Pointer = class extends Number {};

//#endregion
//#region src/types.ts
let LuaReturn = function(LuaReturn$1) {
	LuaReturn$1[LuaReturn$1["Ok"] = 0] = "Ok";
	LuaReturn$1[LuaReturn$1["Yield"] = 1] = "Yield";
	LuaReturn$1[LuaReturn$1["ErrorRun"] = 2] = "ErrorRun";
	LuaReturn$1[LuaReturn$1["ErrorSyntax"] = 3] = "ErrorSyntax";
	LuaReturn$1[LuaReturn$1["ErrorMem"] = 4] = "ErrorMem";
	LuaReturn$1[LuaReturn$1["ErrorErr"] = 5] = "ErrorErr";
	LuaReturn$1[LuaReturn$1["ErrorFile"] = 6] = "ErrorFile";
	return LuaReturn$1;
}({});
const PointerSize = 4;
const LUA_MULTRET = -1;
const LUAI_MAXSTACK = 1e6;
const LUA_REGISTRYINDEX = -LUAI_MAXSTACK - 1e3;
let LuaType = function(LuaType$1) {
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
let LuaEventCodes = function(LuaEventCodes$1) {
	LuaEventCodes$1[LuaEventCodes$1["Call"] = 0] = "Call";
	LuaEventCodes$1[LuaEventCodes$1["Ret"] = 1] = "Ret";
	LuaEventCodes$1[LuaEventCodes$1["Line"] = 2] = "Line";
	LuaEventCodes$1[LuaEventCodes$1["Count"] = 3] = "Count";
	LuaEventCodes$1[LuaEventCodes$1["TailCall"] = 4] = "TailCall";
	return LuaEventCodes$1;
}({});
let LuaEventMasks = function(LuaEventMasks$1) {
	LuaEventMasks$1[LuaEventMasks$1["Call"] = 1] = "Call";
	LuaEventMasks$1[LuaEventMasks$1["Ret"] = 2] = "Ret";
	LuaEventMasks$1[LuaEventMasks$1["Line"] = 4] = "Line";
	LuaEventMasks$1[LuaEventMasks$1["Count"] = 8] = "Count";
	return LuaEventMasks$1;
}({});
let LuaLibraries = function(LuaLibraries$1) {
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

//#endregion
//#region src/thread.ts
const INSTRUCTION_HOOK_COUNT = 1e3;
var Thread = class Thread {
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
					if (lastValue === Promise.resolve(lastValue)) await lastValue;
					else await new Promise((resolve) => setImmediate(resolve));
				} else await new Promise((resolve) => setImmediate(resolve));
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
				if (Number.isInteger(target)) this.lua.lua_pushinteger(this.address, BigInt(target));
				else this.lua.lua_pushnumber(this.address, target);
				break;
			case "string":
				this.lua.lua_pushstring(this.address, target);
				break;
			case "boolean":
				this.lua.lua_pushboolean(this.address, target ? 1 : 0);
				break;
			default:
				if (this.typeExtensions.find((wrapper) => wrapper.extension.pushValue(this, decoratedValue, userdata))) break;
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
			case LuaType.None: return undefined;
			case LuaType.Nil: return null;
			case LuaType.Number: return this.lua.lua_tonumberx(this.address, index, null);
			case LuaType.String: return this.lua.lua_tolstring(this.address, index, null);
			case LuaType.Boolean: return Boolean(this.lua.lua_toboolean(this.address, index));
			case LuaType.Thread: return this.stateToThread(this.lua.lua_tothread(this.address, index));
			default: {
				let metatableName;
				if (type === LuaType.Table || type === LuaType.Userdata) metatableName = this.getMetatableName(index);
				const typeExtensionWrapper = this.typeExtensions.find((wrapper) => wrapper.extension.isType(this, index, type, metatableName));
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
			if (this.getTop() > 0) if (result === LuaReturn.ErrorMem) error.message = this.lua.lua_tolstring(this.address, -1, null);
			else {
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

//#endregion
//#region src/global.ts
var Global = class extends Thread {
	memoryStats;
	allocatorFunctionPointer;
	/**
	
	* Constructs a new Global instance.
	
	* @param cmodule - The Lua WebAssembly module.
	
	* @param shouldTraceAllocations - Whether to trace memory allocations.
	
	*/
	constructor(cmodule, shouldTraceAllocations) {
		if (shouldTraceAllocations) {
			const memoryStats = { memoryUsed: 0 };
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
	/**
	
	* Closes the global state of the Lua engine.
	
	*/
	close() {
		if (this.isClosed()) return;
		super.close();
		this.lua.lua_close(this.address);
		if (this.allocatorFunctionPointer) this.lua.module.removeFunction(this.allocatorFunctionPointer);
		for (const wrapper of this.typeExtensions) wrapper.extension.close();
	}
	/**
	
	* Registers a type extension for Lua objects.
	
	* Higher priority is more important and will be evaluated first.
	
	* Allows library users to specify custom types
	
	* @param priority - Priority of the type extension.
	
	* @param extension - The type extension to register.
	
	*/
	registerTypeExtension(priority, extension) {
		this.typeExtensions.push({
			extension,
			priority
		});
		this.typeExtensions.sort((a, b) => b.priority - a.priority);
	}
	/**
	
	* Loads a default Lua library.
	
	* @param library - The Lua library to load.
	
	*/
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
	/**
	
	* Retrieves the value of a global variable.
	
	* @param name - The name of the global variable.
	
	* @returns - The value of the global variable.
	
	*/
	get(name) {
		const type = this.lua.lua_getglobal(this.address, name);
		const value = this.getValue(-1, type);
		this.pop();
		return value;
	}
	/**
	
	* Sets the value of a global variable.
	
	* @param name - The name of the global variable.
	
	* @param value - The value to set for the global variable.
	
	*/
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
	/**
	
	* Gets the amount of memory used by the Lua engine. Can only be used if the state was created with the `traceAllocations` option set to true.
	
	* @returns - The amount of memory used in bytes.
	
	*/
	getMemoryUsed() {
		return this.getMemoryStatsRef().memoryUsed;
	}
	/**
	
	* Gets the maximum memory allowed for the Lua engine. Can only be used if the state was created with the `traceAllocations` option set to true.
	
	* @returns - The maximum memory allowed in bytes, or undefined if not set.
	
	*/
	getMemoryMax() {
		return this.getMemoryStatsRef().memoryMax;
	}
	/**
	
	* Sets the maximum memory allowed for the Lua engine. Can only be used if the state was created with the `traceAllocations` option set to true.
	
	* @param max - The maximum memory allowed in bytes, or undefined for unlimited.
	
	*/
	setMemoryMax(max) {
		this.getMemoryStatsRef().memoryMax = max;
	}
	getMemoryStatsRef() {
		if (!this.memoryStats) throw new Error("Memory allocations is not being traced, please build engine with { traceAllocations: true }");
		return this.memoryStats;
	}
};

//#endregion
//#region src/type-extension.ts
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
		const { target } = decoratedValue;
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

//#endregion
//#region src/type-extensions/error.ts
var ErrorTypeExtension = class extends LuaTypeExtension {
	gcPointer;
	constructor(thread, injectObject) {
		super(thread, "js_error");
		this.gcPointer = thread.lua.module.addFunction((functionStateAddress) => {
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
			thread.pushValue((jsRefError) => {
				return jsRefError.message;
			});
			thread.lua.lua_setfield(thread.address, metatableIndex, "__tostring");
		}
		thread.lua.lua_pop(thread.address, 1);
		if (injectObject) thread.set("Error", { create: (message) => {
			if (message && typeof message !== "string") throw new Error("message must be a string");
			return new Error(message);
		} });
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

//#endregion
//#region src/raw-result.ts
var RawResult = class {
	constructor(count) {
		this.count = count;
	}
};

//#endregion
//#region src/type-extensions/function.ts
function decorateFunction(target, options) {
	return new Decoration(target, options);
}
var FunctionTypeExtension = class extends LuaTypeExtension {
	functionRegistry = typeof FinalizationRegistry !== "undefined" ? new FinalizationRegistry((func) => {
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
		this.gcPointer = thread.lua.module.addFunction((calledL) => {
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
		this.functionWrapper = thread.lua.module.addFunction((calledL) => {
			const calledThread = thread.stateToThread(calledL);
			const refUserdata = thread.lua.luaL_checkudata(calledL, thread.lua.lua_upvalueindex(1), this.name);
			const refPointer = thread.lua.module.getValue(refUserdata, "*");
			const { target, options: options$1 } = thread.lua.getRef(refPointer);
			const argsQuantity = calledThread.getTop();
			const args = [];
			if (options$1.receiveThread) args.push(calledThread);
			if (options$1.receiveArgsQuantity) args.push(argsQuantity);
			else for (let i = 1; i <= argsQuantity; i++) {
				const value = calledThread.getValue(i);
				if (i !== 1 || !options$1?.self || value !== options$1.self) args.push(value);
			}
			try {
				const result = target.apply(options$1?.self, args);
				if (result === undefined) return 0;
				else if (result instanceof RawResult) return result.count;
				else if (result instanceof MultiReturn) {
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

//#endregion
//#region src/type-extensions/null.ts
var NullTypeExtension = class extends LuaTypeExtension {
	gcPointer;
	constructor(thread) {
		super(thread, "js_null");
		this.gcPointer = thread.lua.module.addFunction((functionStateAddress) => {
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

//#endregion
//#region src/utils.ts
const isPromise = (target) => {
	return target && (Promise.resolve(target) === target || typeof target.then === "function");
};

//#endregion
//#region src/type-extensions/promise.ts
var PromiseTypeExtension = class extends LuaTypeExtension {
	gcPointer;
	constructor(thread, injectObject) {
		super(thread, "js_promise");
		this.gcPointer = thread.lua.module.addFunction((functionStateAddress) => {
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
			const checkSelf = (self$1) => {
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
					const awaitPromise = self$1.then((res) => {
						promiseResult = {
							status: "fulfilled",
							value: res
						};
					}).catch((err) => {
						promiseResult = {
							status: "rejected",
							value: err
						};
					});
					const continuance = this.thread.lua.module.addFunction((continuanceState) => {
						if (!promiseResult) return thread.lua.lua_yieldk(functionThread.address, 0, 0, continuance);
						this.thread.lua.module.removeFunction(continuance);
						const continuanceThread = thread.stateToThread(continuanceState);
						if (promiseResult.status === "rejected") {
							continuanceThread.pushValue(promiseResult.value || new Error("promise rejected with no error"));
							return this.thread.lua.lua_error(continuanceState);
						}
						if (promiseResult.value instanceof RawResult) return promiseResult.value.count;
						else if (promiseResult.value instanceof MultiReturn) {
							for (const arg of promiseResult.value) continuanceThread.pushValue(arg);
							return promiseResult.value.length;
						} else {
							continuanceThread.pushValue(promiseResult.value);
							return 1;
						}
					}, "iiii");
					functionThread.pushValue(awaitPromise);
					return new RawResult(thread.lua.lua_yieldk(functionThread.address, 1, 0, continuance));
				}, { receiveThread: true })
			});
			thread.lua.lua_setfield(thread.address, metatableIndex, "__index");
			thread.pushValue((self$1, other) => self$1 === other);
			thread.lua.lua_setfield(thread.address, metatableIndex, "__eq");
		}
		thread.lua.lua_pop(thread.address, 1);
		if (injectObject) thread.set("Promise", {
			create: (callback) => new Promise(callback),
			all: (promiseArray) => {
				if (!Array.isArray(promiseArray)) throw new Error("argument must be an array of promises");
				return Promise.all(promiseArray.map((potentialPromise) => Promise.resolve(potentialPromise)));
			},
			resolve: (value) => Promise.resolve(value)
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

//#endregion
//#region src/type-extensions/proxy.ts
function decorateProxy(target, options) {
	return new Decoration(target, options || {});
}
var ProxyTypeExtension = class extends LuaTypeExtension {
	gcPointer;
	constructor(thread) {
		super(thread, "js_proxy");
		this.gcPointer = thread.lua.module.addFunction((functionStateAddress) => {
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
					case "number": key = key - 1;
					case "string": break;
					default: throw new Error("Only strings or numbers can index js objects");
				}
				const value = self$1[key];
				if (typeof value === "function") return decorateFunction(value, { self: self$1 });
				return value;
			});
			thread.lua.lua_setfield(thread.address, metatableIndex, "__index");
			thread.pushValue((self$1, key, value) => {
				switch (typeof key) {
					case "number": key = key - 1;
					case "string": break;
					default: throw new Error("Only strings or numbers can index js objects");
				}
				self$1[key] = value;
			});
			thread.lua.lua_setfield(thread.address, metatableIndex, "__newindex");
			thread.pushValue((self$1) => {
				return self$1.toString?.() ?? typeof self$1;
			});
			thread.lua.lua_setfield(thread.address, metatableIndex, "__tostring");
			thread.pushValue((self$1) => {
				return self$1.length || 0;
			});
			thread.lua.lua_setfield(thread.address, metatableIndex, "__len");
			thread.pushValue((self$1) => {
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
		const { target, options } = decoratedValue;
		if (options.proxy === undefined) {
			if (target === null || target === undefined) return false;
			if (typeof target !== "object") {
				const isClass = typeof target === "function" && target.prototype?.constructor === target && target.toString().startsWith("class ");
				if (!isClass) return false;
			}
			if (isPromise(target)) return false;
		} else if (options.proxy === false) return false;
		if (options.metatable && !(options.metatable instanceof Decoration)) {
			decoratedValue.options.metatable = decorateProxy(options.metatable, { proxy: false });
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

//#endregion
//#region src/type-extensions/table.ts
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
	pushValue(thread, { target }, userdata) {
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
			if (isArray) table.push(value);
			else table[key] = value;
			thread.pop();
		}
	}
};
function createTypeExtension$1(thread) {
	return new TableTypeExtension(thread);
}

//#endregion
//#region src/type-extensions/userdata.ts
function decorateUserdata(target) {
	return new Decoration(target, { reference: true });
}
var UserdataTypeExtension = class extends LuaTypeExtension {
	gcPointer;
	constructor(thread) {
		super(thread, "js_userdata");
		this.gcPointer = thread.lua.module.addFunction((functionStateAddress) => {
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

//#endregion
//#region src/engine.ts
var LuaEngine = class {
	global;
	constructor(cmodule, { openStandardLibs = true, injectObjects = false, enableProxy = true, traceAllocations = false, functionTimeout = undefined } = {}) {
		this.cmodule = cmodule;
		this.global = new Global(this.cmodule, traceAllocations);
		this.global.registerTypeExtension(0, createTypeExtension$1(this.global));
		this.global.registerTypeExtension(0, createTypeExtension$5(this.global, { functionTimeout }));
		this.global.registerTypeExtension(1, createTypeExtension$3(this.global, injectObjects));
		if (injectObjects) this.global.registerTypeExtension(5, createTypeExtension$4(this.global));
		if (enableProxy) this.global.registerTypeExtension(3, createTypeExtension$2(this.global));
		else this.global.registerTypeExtension(1, createTypeExtension$6(this.global, injectObjects));
		this.global.registerTypeExtension(4, createTypeExtension(this.global));
		if (openStandardLibs) this.cmodule.luaL_openlibs(this.global.address);
	}
	/**
	
	* Executes Lua code from a string asynchronously.
	
	* @param script - Lua script to execute.
	
	* @returns A Promise that resolves to the result returned by the Lua script execution.
	
	*/
	doString(script) {
		return this.callByteCode((thread) => thread.loadString(script));
	}
	/**
	
	* Executes Lua code from a file asynchronously.
	
	* @param filename - Path to the Lua script file.
	
	* @returns - A Promise that resolves to the result returned by the Lua script execution.
	
	*/
	doFile(filename) {
		return this.callByteCode((thread) => thread.loadFile(filename));
	}
	/**
	
	* Executes Lua code from a string synchronously.
	
	* @param script - Lua script to execute.
	
	* @returns - The result returned by the Lua script.
	
	*/
	doStringSync(script) {
		this.global.loadString(script);
		const result = this.global.runSync();
		return result[0];
	}
	/**
	
	* Executes Lua code from a file synchronously.
	
	* @param filename - Path to the Lua script file.
	
	* @returns - The result returned by the Lua script.
	
	*/
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

//#endregion
//#region package-version
var package_version_default = "1.16.1";

//#endregion
//#region build/glue.js
async function initWasmModule(moduleArg = {}) {
	var moduleRtn;
	var Module = moduleArg;
	var ENVIRONMENT_IS_WEB = typeof window == "object";
	var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
	var ENVIRONMENT_IS_NODE = typeof process == "object" && process.versions?.node && process.type != "renderer";
	if (ENVIRONMENT_IS_NODE) {
		const { createRequire } = await import("module");
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
		readBinary = (filename) => {
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
			if (ENVIRONMENT_IS_WORKER) readBinary = (url) => {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, false);
				xhr.responseType = "arraybuffer";
				xhr.send(null);
				return new Uint8Array(xhr.response);
			};
			readAsync = async (url) => {
				var response = await fetch(url, { credentials: "same-origin" });
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
	var isFileURI = (filename) => filename.startsWith("file://");
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
			var response = fetch(binaryFile, { credentials: "same-origin" });
			var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
			return instantiationResult;
		} catch (reason) {
			err(`wasm streaming compile failed: ${reason}`);
			err("falling back to ArrayBuffer instantiation");
		}
		return instantiateArrayBuffer(binaryFile, imports);
	}
	function getWasmImports() {
		return { a: wasmImports };
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
	var callRuntimeCallbacks = (callbacks) => {
		while (callbacks.length > 0) callbacks.shift()(Module);
	};
	var onPreRuns = [];
	var addOnPreRun = (cb) => onPreRuns.push(cb);
	function getValue(ptr, type = "i8") {
		if (type.endsWith("*")) type = "*";
		switch (type) {
			case "i1": return HEAP8[ptr];
			case "i8": return HEAP8[ptr];
			case "i16": return HEAP16[ptr >> 1];
			case "i32": return HEAP32[ptr >> 2];
			case "i64": return HEAP64[ptr >> 3];
			case "float": return HEAPF32[ptr >> 2];
			case "double": return HEAPF64[ptr >> 3];
			case "*": return HEAPU32[ptr >> 2];
			default: abort(`invalid type for getValue: ${type}`);
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
			default: abort(`invalid type for setValue: ${type}`);
		}
	}
	var stackRestore = (val) => __emscripten_stack_restore(val);
	var stackSave = () => _emscripten_stack_get_current();
	var PATH = {
		isAbs: (path) => path.charAt(0) === "/",
		splitPath: (filename) => {
			var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
			return splitPathRe.exec(filename).slice(1);
		},
		normalizeArray: (parts, allowAboveRoot) => {
			var up = 0;
			for (var i = parts.length - 1; i >= 0; i--) {
				var last = parts[i];
				if (last === ".") parts.splice(i, 1);
				else if (last === "..") {
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
		normalize: (path) => {
			var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
			path = PATH.normalizeArray(path.split("/").filter((p) => !!p), !isAbsolute).join("/");
			if (!path && !isAbsolute) path = ".";
			if (path && trailingSlash) path += "/";
			return (isAbsolute ? "/" : "") + path;
		},
		dirname: (path) => {
			var result = PATH.splitPath(path), root = result[0], dir = result[1];
			if (!root && !dir) return ".";
			if (dir) dir = dir.slice(0, -1);
			return root + dir;
		},
		basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
		join: (...paths) => PATH.normalize(paths.join("/")),
		join2: (l, r) => PATH.normalize(l + "/" + r)
	};
	var initRandomFill = () => {
		if (ENVIRONMENT_IS_NODE) {
			var nodeCrypto = require("crypto");
			return (view) => nodeCrypto.randomFillSync(view);
		}
		return (view) => crypto.getRandomValues(view);
	};
	var randomFill = (view) => {
		(randomFill = initRandomFill())(view);
	};
	var PATH_FS = {
		resolve: (...args) => {
			var resolvedPath = "", resolvedAbsolute = false;
			for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
				var path = i >= 0 ? args[i] : FS.cwd();
				if (typeof path != "string") throw new TypeError("Arguments to path.resolve must be strings");
				else if (!path) return "";
				resolvedPath = path + "/" + resolvedPath;
				resolvedAbsolute = PATH.isAbs(path);
			}
			resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p) => !!p), !resolvedAbsolute).join("/");
			return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
		},
		relative: (from, to) => {
			from = PATH_FS.resolve(from).slice(1);
			to = PATH_FS.resolve(to).slice(1);
			function trim(arr) {
				var start = 0;
				for (; start < arr.length; start++) if (arr[start] !== "") break;
				var end = arr.length - 1;
				for (; end >= 0; end--) if (arr[end] !== "") break;
				if (start > end) return [];
				return arr.slice(start, end - start + 1);
			}
			var fromParts = trim(from.split("/"));
			var toParts = trim(to.split("/"));
			var length = Math.min(fromParts.length, toParts.length);
			var samePartsLength = length;
			for (var i = 0; i < length; i++) if (fromParts[i] !== toParts[i]) {
				samePartsLength = i;
				break;
			}
			var outputParts = [];
			for (var i = samePartsLength; i < fromParts.length; i++) outputParts.push("..");
			outputParts = outputParts.concat(toParts.slice(samePartsLength));
			return outputParts.join("/");
		}
	};
	var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : undefined;
	var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
		var maxIdx = idx + maxBytesToRead;
		if (ignoreNul) return maxIdx;
		while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
		return idx;
	};
	var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
		var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
		if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
		var str = "";
		while (idx < endPtr) {
			var u0 = heapOrArray[idx++];
			if (!(u0 & 128)) {
				str += String.fromCharCode(u0);
				continue;
			}
			var u1 = heapOrArray[idx++] & 63;
			if ((u0 & 224) == 192) {
				str += String.fromCharCode((u0 & 31) << 6 | u1);
				continue;
			}
			var u2 = heapOrArray[idx++] & 63;
			if ((u0 & 240) == 224) u0 = (u0 & 15) << 12 | u1 << 6 | u2;
			else u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
			if (u0 < 65536) str += String.fromCharCode(u0);
			else {
				var ch = u0 - 65536;
				str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
			}
		}
		return str;
	};
	var FS_stdin_getChar_buffer = [];
	var lengthBytesUTF8 = (str) => {
		var len = 0;
		for (var i = 0; i < str.length; ++i) {
			var c = str.charCodeAt(i);
			if (c <= 127) len++;
			else if (c <= 2047) len += 2;
			else if (c >= 55296 && c <= 57343) {
				len += 4;
				++i;
			} else len += 3;
		}
		return len;
	};
	var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
		if (!(maxBytesToWrite > 0)) return 0;
		var startIdx = outIdx;
		var endIdx = outIdx + maxBytesToWrite - 1;
		for (var i = 0; i < str.length; ++i) {
			var u = str.codePointAt(i);
			if (u <= 127) {
				if (outIdx >= endIdx) break;
				heap[outIdx++] = u;
			} else if (u <= 2047) {
				if (outIdx + 1 >= endIdx) break;
				heap[outIdx++] = 192 | u >> 6;
				heap[outIdx++] = 128 | u & 63;
			} else if (u <= 65535) {
				if (outIdx + 2 >= endIdx) break;
				heap[outIdx++] = 224 | u >> 12;
				heap[outIdx++] = 128 | u >> 6 & 63;
				heap[outIdx++] = 128 | u & 63;
			} else {
				if (outIdx + 3 >= endIdx) break;
				heap[outIdx++] = 240 | u >> 18;
				heap[outIdx++] = 128 | u >> 12 & 63;
				heap[outIdx++] = 128 | u >> 6 & 63;
				heap[outIdx++] = 128 | u & 63;
				i++;
			}
		}
		heap[outIdx] = 0;
		return outIdx - startIdx;
	};
	var intArrayFromString = (stringy, dontAddNull, length) => {
		var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
		var u8array = new Array(len);
		var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
		if (dontAddNull) u8array.length = numBytesWritten;
		return u8array;
	};
	var FS_stdin_getChar = () => {
		if (!FS_stdin_getChar_buffer.length) {
			var result = null;
			if (ENVIRONMENT_IS_NODE) {
				var BUFSIZE = 256;
				var buf = Buffer.alloc(BUFSIZE);
				var bytesRead = 0;
				var fd = process.stdin.fd;
				try {
					bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
				} catch (e) {
					if (e.toString().includes("EOF")) bytesRead = 0;
					else throw e;
				}
				if (bytesRead > 0) result = buf.slice(0, bytesRead).toString("utf-8");
			} else if (typeof window != "undefined" && typeof window.prompt == "function") {
				result = window.prompt("Input: ");
				if (result !== null) result += "\n";
			}
			if (!result) return null;
			FS_stdin_getChar_buffer = intArrayFromString(result, true);
		}
		return FS_stdin_getChar_buffer.shift();
	};
	var TTY = {
		ttys: [],
		init() {},
		shutdown() {},
		register(dev, ops) {
			TTY.ttys[dev] = {
				input: [],
				output: [],
				ops
			};
			FS.registerDevice(dev, TTY.stream_ops);
		},
		stream_ops: {
			open(stream) {
				var tty = TTY.ttys[stream.node.rdev];
				if (!tty) throw new FS.ErrnoError(43);
				stream.tty = tty;
				stream.seekable = false;
			},
			close(stream) {
				stream.tty.ops.fsync(stream.tty);
			},
			fsync(stream) {
				stream.tty.ops.fsync(stream.tty);
			},
			read(stream, buffer, offset, length, pos) {
				if (!stream.tty || !stream.tty.ops.get_char) throw new FS.ErrnoError(60);
				var bytesRead = 0;
				for (var i = 0; i < length; i++) {
					var result;
					try {
						result = stream.tty.ops.get_char(stream.tty);
					} catch (e) {
						throw new FS.ErrnoError(29);
					}
					if (result === undefined && bytesRead === 0) throw new FS.ErrnoError(6);
					if (result === null || result === undefined) break;
					bytesRead++;
					buffer[offset + i] = result;
				}
				if (bytesRead) stream.node.atime = Date.now();
				return bytesRead;
			},
			write(stream, buffer, offset, length, pos) {
				if (!stream.tty || !stream.tty.ops.put_char) throw new FS.ErrnoError(60);
				try {
					for (var i = 0; i < length; i++) stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
				} catch (e) {
					throw new FS.ErrnoError(29);
				}
				if (length) stream.node.mtime = stream.node.ctime = Date.now();
				return i;
			}
		},
		default_tty_ops: {
			get_char(tty) {
				return FS_stdin_getChar();
			},
			put_char(tty, val) {
				if (val === null || val === 10) {
					out(UTF8ArrayToString(tty.output));
					tty.output = [];
				} else if (val != 0) tty.output.push(val);
			},
			fsync(tty) {
				if (tty.output?.length > 0) {
					out(UTF8ArrayToString(tty.output));
					tty.output = [];
				}
			},
			ioctl_tcgets(tty) {
				return {
					c_iflag: 25856,
					c_oflag: 5,
					c_cflag: 191,
					c_lflag: 35387,
					c_cc: [
						3,
						28,
						127,
						21,
						4,
						0,
						1,
						0,
						17,
						19,
						26,
						0,
						18,
						15,
						23,
						22,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					]
				};
			},
			ioctl_tcsets(tty, optional_actions, data) {
				return 0;
			},
			ioctl_tiocgwinsz(tty) {
				return [24, 80];
			}
		},
		default_tty1_ops: {
			put_char(tty, val) {
				if (val === null || val === 10) {
					err(UTF8ArrayToString(tty.output));
					tty.output = [];
				} else if (val != 0) tty.output.push(val);
			},
			fsync(tty) {
				if (tty.output?.length > 0) {
					err(UTF8ArrayToString(tty.output));
					tty.output = [];
				}
			}
		}
	};
	var mmapAlloc = (size) => {
		abort();
	};
	var MEMFS = {
		ops_table: null,
		mount(mount) {
			return MEMFS.createNode(null, "/", 16895, 0);
		},
		createNode(parent, name, mode, dev) {
			if (FS.isBlkdev(mode) || FS.isFIFO(mode)) throw new FS.ErrnoError(63);
			MEMFS.ops_table ||= {
				dir: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr,
						lookup: MEMFS.node_ops.lookup,
						mknod: MEMFS.node_ops.mknod,
						rename: MEMFS.node_ops.rename,
						unlink: MEMFS.node_ops.unlink,
						rmdir: MEMFS.node_ops.rmdir,
						readdir: MEMFS.node_ops.readdir,
						symlink: MEMFS.node_ops.symlink
					},
					stream: { llseek: MEMFS.stream_ops.llseek }
				},
				file: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr
					},
					stream: {
						llseek: MEMFS.stream_ops.llseek,
						read: MEMFS.stream_ops.read,
						write: MEMFS.stream_ops.write,
						mmap: MEMFS.stream_ops.mmap,
						msync: MEMFS.stream_ops.msync
					}
				},
				link: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr,
						readlink: MEMFS.node_ops.readlink
					},
					stream: {}
				},
				chrdev: {
					node: {
						getattr: MEMFS.node_ops.getattr,
						setattr: MEMFS.node_ops.setattr
					},
					stream: FS.chrdev_stream_ops
				}
			};
			var node = FS.createNode(parent, name, mode, dev);
			if (FS.isDir(node.mode)) {
				node.node_ops = MEMFS.ops_table.dir.node;
				node.stream_ops = MEMFS.ops_table.dir.stream;
				node.contents = {};
			} else if (FS.isFile(node.mode)) {
				node.node_ops = MEMFS.ops_table.file.node;
				node.stream_ops = MEMFS.ops_table.file.stream;
				node.usedBytes = 0;
				node.contents = null;
			} else if (FS.isLink(node.mode)) {
				node.node_ops = MEMFS.ops_table.link.node;
				node.stream_ops = MEMFS.ops_table.link.stream;
			} else if (FS.isChrdev(node.mode)) {
				node.node_ops = MEMFS.ops_table.chrdev.node;
				node.stream_ops = MEMFS.ops_table.chrdev.stream;
			}
			node.atime = node.mtime = node.ctime = Date.now();
			if (parent) {
				parent.contents[name] = node;
				parent.atime = parent.mtime = parent.ctime = node.atime;
			}
			return node;
		},
		getFileDataAsTypedArray(node) {
			if (!node.contents) return new Uint8Array(0);
			if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
			return new Uint8Array(node.contents);
		},
		expandFileStorage(node, newCapacity) {
			var prevCapacity = node.contents ? node.contents.length : 0;
			if (prevCapacity >= newCapacity) return;
			var CAPACITY_DOUBLING_MAX = 1024 * 1024;
			newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
			if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
			var oldContents = node.contents;
			node.contents = new Uint8Array(newCapacity);
			if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
		},
		resizeFileStorage(node, newSize) {
			if (node.usedBytes == newSize) return;
			if (newSize == 0) {
				node.contents = null;
				node.usedBytes = 0;
			} else {
				var oldContents = node.contents;
				node.contents = new Uint8Array(newSize);
				if (oldContents) node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
				node.usedBytes = newSize;
			}
		},
		node_ops: {
			getattr(node) {
				var attr = {};
				attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
				attr.ino = node.id;
				attr.mode = node.mode;
				attr.nlink = 1;
				attr.uid = 0;
				attr.gid = 0;
				attr.rdev = node.rdev;
				if (FS.isDir(node.mode)) attr.size = 4096;
				else if (FS.isFile(node.mode)) attr.size = node.usedBytes;
				else if (FS.isLink(node.mode)) attr.size = node.link.length;
				else attr.size = 0;
				attr.atime = new Date(node.atime);
				attr.mtime = new Date(node.mtime);
				attr.ctime = new Date(node.ctime);
				attr.blksize = 4096;
				attr.blocks = Math.ceil(attr.size / attr.blksize);
				return attr;
			},
			setattr(node, attr) {
				for (const key of [
					"mode",
					"atime",
					"mtime",
					"ctime"
				]) if (attr[key] != null) node[key] = attr[key];
				if (attr.size !== undefined) MEMFS.resizeFileStorage(node, attr.size);
			},
			lookup(parent, name) {
				if (!MEMFS.doesNotExistError) {
					MEMFS.doesNotExistError = new FS.ErrnoError(44);
					MEMFS.doesNotExistError.stack = "<generic error, no stack>";
				}
				throw MEMFS.doesNotExistError;
			},
			mknod(parent, name, mode, dev) {
				return MEMFS.createNode(parent, name, mode, dev);
			},
			rename(old_node, new_dir, new_name) {
				var new_node;
				try {
					new_node = FS.lookupNode(new_dir, new_name);
				} catch (e) {}
				if (new_node) {
					if (FS.isDir(old_node.mode)) for (var i in new_node.contents) throw new FS.ErrnoError(55);
					FS.hashRemoveNode(new_node);
				}
				delete old_node.parent.contents[old_node.name];
				new_dir.contents[new_name] = old_node;
				old_node.name = new_name;
				new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
			},
			unlink(parent, name) {
				delete parent.contents[name];
				parent.ctime = parent.mtime = Date.now();
			},
			rmdir(parent, name) {
				var node = FS.lookupNode(parent, name);
				for (var i in node.contents) throw new FS.ErrnoError(55);
				delete parent.contents[name];
				parent.ctime = parent.mtime = Date.now();
			},
			readdir(node) {
				return [
					".",
					"..",
					...Object.keys(node.contents)
				];
			},
			symlink(parent, newname, oldpath) {
				var node = MEMFS.createNode(parent, newname, 41471, 0);
				node.link = oldpath;
				return node;
			},
			readlink(node) {
				if (!FS.isLink(node.mode)) throw new FS.ErrnoError(28);
				return node.link;
			}
		},
		stream_ops: {
			read(stream, buffer, offset, length, position) {
				var contents = stream.node.contents;
				if (position >= stream.node.usedBytes) return 0;
				var size = Math.min(stream.node.usedBytes - position, length);
				if (size > 8 && contents.subarray) buffer.set(contents.subarray(position, position + size), offset);
				else for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
				return size;
			},
			write(stream, buffer, offset, length, position, canOwn) {
				if (buffer.buffer === HEAP8.buffer) canOwn = false;
				if (!length) return 0;
				var node = stream.node;
				node.mtime = node.ctime = Date.now();
				if (buffer.subarray && (!node.contents || node.contents.subarray)) {
					if (canOwn) {
						node.contents = buffer.subarray(offset, offset + length);
						node.usedBytes = length;
						return length;
					} else if (node.usedBytes === 0 && position === 0) {
						node.contents = buffer.slice(offset, offset + length);
						node.usedBytes = length;
						return length;
					} else if (position + length <= node.usedBytes) {
						node.contents.set(buffer.subarray(offset, offset + length), position);
						return length;
					}
				}
				MEMFS.expandFileStorage(node, position + length);
				if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
				else for (var i = 0; i < length; i++) node.contents[position + i] = buffer[offset + i];
				node.usedBytes = Math.max(node.usedBytes, position + length);
				return length;
			},
			llseek(stream, offset, whence) {
				var position = offset;
				if (whence === 1) position += stream.position;
				else if (whence === 2) {
					if (FS.isFile(stream.node.mode)) position += stream.node.usedBytes;
				}
				if (position < 0) throw new FS.ErrnoError(28);
				return position;
			},
			mmap(stream, length, position, prot, flags) {
				if (!FS.isFile(stream.node.mode)) throw new FS.ErrnoError(43);
				var ptr;
				var allocated;
				var contents = stream.node.contents;
				if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
					allocated = false;
					ptr = contents.byteOffset;
				} else {
					allocated = true;
					ptr = mmapAlloc(length);
					if (!ptr) throw new FS.ErrnoError(48);
					if (contents) {
						if (position > 0 || position + length < contents.length) if (contents.subarray) contents = contents.subarray(position, position + length);
						else contents = Array.prototype.slice.call(contents, position, position + length);
						HEAP8.set(contents, ptr);
					}
				}
				return {
					ptr,
					allocated
				};
			},
			msync(stream, buffer, offset, length, mmapFlags) {
				MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
				return 0;
			}
		}
	};
	var asyncLoad = async (url) => {
		var arrayBuffer = await readAsync(url);
		return new Uint8Array(arrayBuffer);
	};
	var FS_createDataFile = (...args) => FS.createDataFile(...args);
	var getUniqueRunDependency = (id) => id;
	var preloadPlugins = [];
	var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
		if (typeof Browser != "undefined") Browser.init();
		var handled = false;
		preloadPlugins.forEach((plugin) => {
			if (handled) return;
			if (plugin["canHandle"](fullname)) {
				plugin["handle"](byteArray, fullname, finish, onerror);
				handled = true;
			}
		});
		return handled;
	};
	var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
		var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
		var dep = getUniqueRunDependency(`cp ${fullname}`);
		function processData(byteArray) {
			function finish(byteArray$1) {
				preFinish?.();
				if (!dontCreateFile) FS_createDataFile(parent, name, byteArray$1, canRead, canWrite, canOwn);
				onload?.();
				removeRunDependency(dep);
			}
			if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
				onerror?.();
				removeRunDependency(dep);
			})) return;
			finish(byteArray);
		}
		addRunDependency(dep);
		if (typeof url == "string") asyncLoad(url).then(processData, onerror);
		else processData(url);
	};
	var FS_modeStringToFlags = (str) => {
		var flagModes = {
			r: 0,
			"r+": 2,
			w: 577,
			"w+": 578,
			a: 1089,
			"a+": 1090
		};
		var flags = flagModes[str];
		if (typeof flags == "undefined") throw new Error(`Unknown file open mode: ${str}`);
		return flags;
	};
	var FS_getMode = (canRead, canWrite) => {
		var mode = 0;
		if (canRead) mode |= 365;
		if (canWrite) mode |= 146;
		return mode;
	};
	var FS = {
		root: null,
		mounts: [],
		devices: {},
		streams: [],
		nextInode: 1,
		nameTable: null,
		currentPath: "/",
		initialized: false,
		ignorePermissions: true,
		filesystems: null,
		syncFSRequests: 0,
		ErrnoError: class {
			name = "ErrnoError";
			constructor(errno) {
				this.errno = errno;
			}
		},
		FSStream: class {
			shared = {};
			get object() {
				return this.node;
			}
			set object(val) {
				this.node = val;
			}
			get isRead() {
				return (this.flags & 2097155) !== 1;
			}
			get isWrite() {
				return (this.flags & 2097155) !== 0;
			}
			get isAppend() {
				return this.flags & 1024;
			}
			get flags() {
				return this.shared.flags;
			}
			set flags(val) {
				this.shared.flags = val;
			}
			get position() {
				return this.shared.position;
			}
			set position(val) {
				this.shared.position = val;
			}
		},
		FSNode: class {
			node_ops = {};
			stream_ops = {};
			readMode = 365;
			writeMode = 146;
			mounted = null;
			constructor(parent, name, mode, rdev) {
				if (!parent) parent = this;
				this.parent = parent;
				this.mount = parent.mount;
				this.id = FS.nextInode++;
				this.name = name;
				this.mode = mode;
				this.rdev = rdev;
				this.atime = this.mtime = this.ctime = Date.now();
			}
			get read() {
				return (this.mode & this.readMode) === this.readMode;
			}
			set read(val) {
				val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
			}
			get write() {
				return (this.mode & this.writeMode) === this.writeMode;
			}
			set write(val) {
				val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
			}
			get isFolder() {
				return FS.isDir(this.mode);
			}
			get isDevice() {
				return FS.isChrdev(this.mode);
			}
		},
		lookupPath(path, opts = {}) {
			if (!path) throw new FS.ErrnoError(44);
			opts.follow_mount ??= true;
			if (!PATH.isAbs(path)) path = FS.cwd() + "/" + path;
			linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
				var parts = path.split("/").filter((p) => !!p);
				var current = FS.root;
				var current_path = "/";
				for (var i = 0; i < parts.length; i++) {
					var islast = i === parts.length - 1;
					if (islast && opts.parent) break;
					if (parts[i] === ".") continue;
					if (parts[i] === "..") {
						current_path = PATH.dirname(current_path);
						if (FS.isRoot(current)) {
							path = current_path + "/" + parts.slice(i + 1).join("/");
							nlinks--;
							continue linkloop;
						} else current = current.parent;
						continue;
					}
					current_path = PATH.join2(current_path, parts[i]);
					try {
						current = FS.lookupNode(current, parts[i]);
					} catch (e) {
						if (e?.errno === 44 && islast && opts.noent_okay) return { path: current_path };
						throw e;
					}
					if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) current = current.mounted.root;
					if (FS.isLink(current.mode) && (!islast || opts.follow)) {
						if (!current.node_ops.readlink) throw new FS.ErrnoError(52);
						var link = current.node_ops.readlink(current);
						if (!PATH.isAbs(link)) link = PATH.dirname(current_path) + "/" + link;
						path = link + "/" + parts.slice(i + 1).join("/");
						continue linkloop;
					}
				}
				return {
					path: current_path,
					node: current
				};
			}
			throw new FS.ErrnoError(32);
		},
		getPath(node) {
			var path;
			while (true) {
				if (FS.isRoot(node)) {
					var mount = node.mount.mountpoint;
					if (!path) return mount;
					return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
				}
				path = path ? `${node.name}/${path}` : node.name;
				node = node.parent;
			}
		},
		hashName(parentid, name) {
			var hash = 0;
			for (var i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
			return (parentid + hash >>> 0) % FS.nameTable.length;
		},
		hashAddNode(node) {
			var hash = FS.hashName(node.parent.id, node.name);
			node.name_next = FS.nameTable[hash];
			FS.nameTable[hash] = node;
		},
		hashRemoveNode(node) {
			var hash = FS.hashName(node.parent.id, node.name);
			if (FS.nameTable[hash] === node) FS.nameTable[hash] = node.name_next;
			else {
				var current = FS.nameTable[hash];
				while (current) {
					if (current.name_next === node) {
						current.name_next = node.name_next;
						break;
					}
					current = current.name_next;
				}
			}
		},
		lookupNode(parent, name) {
			var errCode = FS.mayLookup(parent);
			if (errCode) throw new FS.ErrnoError(errCode);
			var hash = FS.hashName(parent.id, name);
			for (var node = FS.nameTable[hash]; node; node = node.name_next) {
				var nodeName = node.name;
				if (node.parent.id === parent.id && nodeName === name) return node;
			}
			return FS.lookup(parent, name);
		},
		createNode(parent, name, mode, rdev) {
			var node = new FS.FSNode(parent, name, mode, rdev);
			FS.hashAddNode(node);
			return node;
		},
		destroyNode(node) {
			FS.hashRemoveNode(node);
		},
		isRoot(node) {
			return node === node.parent;
		},
		isMountpoint(node) {
			return !!node.mounted;
		},
		isFile(mode) {
			return (mode & 61440) === 32768;
		},
		isDir(mode) {
			return (mode & 61440) === 16384;
		},
		isLink(mode) {
			return (mode & 61440) === 40960;
		},
		isChrdev(mode) {
			return (mode & 61440) === 8192;
		},
		isBlkdev(mode) {
			return (mode & 61440) === 24576;
		},
		isFIFO(mode) {
			return (mode & 61440) === 4096;
		},
		isSocket(mode) {
			return (mode & 49152) === 49152;
		},
		flagsToPermissionString(flag) {
			var perms = [
				"r",
				"w",
				"rw"
			][flag & 3];
			if (flag & 512) perms += "w";
			return perms;
		},
		nodePermissions(node, perms) {
			if (FS.ignorePermissions) return 0;
			if (perms.includes("r") && !(node.mode & 292)) return 2;
			else if (perms.includes("w") && !(node.mode & 146)) return 2;
			else if (perms.includes("x") && !(node.mode & 73)) return 2;
			return 0;
		},
		mayLookup(dir) {
			if (!FS.isDir(dir.mode)) return 54;
			var errCode = FS.nodePermissions(dir, "x");
			if (errCode) return errCode;
			if (!dir.node_ops.lookup) return 2;
			return 0;
		},
		mayCreate(dir, name) {
			if (!FS.isDir(dir.mode)) return 54;
			try {
				var node = FS.lookupNode(dir, name);
				return 20;
			} catch (e) {}
			return FS.nodePermissions(dir, "wx");
		},
		mayDelete(dir, name, isdir) {
			var node;
			try {
				node = FS.lookupNode(dir, name);
			} catch (e) {
				return e.errno;
			}
			var errCode = FS.nodePermissions(dir, "wx");
			if (errCode) return errCode;
			if (isdir) {
				if (!FS.isDir(node.mode)) return 54;
				if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) return 10;
			} else if (FS.isDir(node.mode)) return 31;
			return 0;
		},
		mayOpen(node, flags) {
			if (!node) return 44;
			if (FS.isLink(node.mode)) return 32;
			else if (FS.isDir(node.mode)) {
				if (FS.flagsToPermissionString(flags) !== "r" || flags & 576) return 31;
			}
			return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
		},
		checkOpExists(op, err$1) {
			if (!op) throw new FS.ErrnoError(err$1);
			return op;
		},
		MAX_OPEN_FDS: 4096,
		nextfd() {
			for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) if (!FS.streams[fd]) return fd;
			throw new FS.ErrnoError(33);
		},
		getStreamChecked(fd) {
			var stream = FS.getStream(fd);
			if (!stream) throw new FS.ErrnoError(8);
			return stream;
		},
		getStream: (fd) => FS.streams[fd],
		createStream(stream, fd = -1) {
			stream = Object.assign(new FS.FSStream(), stream);
			if (fd == -1) fd = FS.nextfd();
			stream.fd = fd;
			FS.streams[fd] = stream;
			return stream;
		},
		closeStream(fd) {
			FS.streams[fd] = null;
		},
		dupStream(origStream, fd = -1) {
			var stream = FS.createStream(origStream, fd);
			stream.stream_ops?.dup?.(stream);
			return stream;
		},
		doSetAttr(stream, node, attr) {
			var setattr = stream?.stream_ops.setattr;
			var arg = setattr ? stream : node;
			setattr ??= node.node_ops.setattr;
			FS.checkOpExists(setattr, 63);
			setattr(arg, attr);
		},
		chrdev_stream_ops: {
			open(stream) {
				var device = FS.getDevice(stream.node.rdev);
				stream.stream_ops = device.stream_ops;
				stream.stream_ops.open?.(stream);
			},
			llseek() {
				throw new FS.ErrnoError(70);
			}
		},
		major: (dev) => dev >> 8,
		minor: (dev) => dev & 255,
		makedev: (ma, mi) => ma << 8 | mi,
		registerDevice(dev, ops) {
			FS.devices[dev] = { stream_ops: ops };
		},
		getDevice: (dev) => FS.devices[dev],
		getMounts(mount) {
			var mounts = [];
			var check = [mount];
			while (check.length) {
				var m = check.pop();
				mounts.push(m);
				check.push(...m.mounts);
			}
			return mounts;
		},
		syncfs(populate, callback) {
			if (typeof populate == "function") {
				callback = populate;
				populate = false;
			}
			FS.syncFSRequests++;
			if (FS.syncFSRequests > 1) err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
			var mounts = FS.getMounts(FS.root.mount);
			var completed = 0;
			function doCallback(errCode) {
				FS.syncFSRequests--;
				return callback(errCode);
			}
			function done(errCode) {
				if (errCode) {
					if (!done.errored) {
						done.errored = true;
						return doCallback(errCode);
					}
					return;
				}
				if (++completed >= mounts.length) doCallback(null);
			}
			mounts.forEach((mount) => {
				if (!mount.type.syncfs) return done(null);
				mount.type.syncfs(mount, populate, done);
			});
		},
		mount(type, opts, mountpoint) {
			var root = mountpoint === "/";
			var pseudo = !mountpoint;
			var node;
			if (root && FS.root) throw new FS.ErrnoError(10);
			else if (!root && !pseudo) {
				var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
				mountpoint = lookup.path;
				node = lookup.node;
				if (FS.isMountpoint(node)) throw new FS.ErrnoError(10);
				if (!FS.isDir(node.mode)) throw new FS.ErrnoError(54);
			}
			var mount = {
				type,
				opts,
				mountpoint,
				mounts: []
			};
			var mountRoot = type.mount(mount);
			mountRoot.mount = mount;
			mount.root = mountRoot;
			if (root) FS.root = mountRoot;
			else if (node) {
				node.mounted = mount;
				if (node.mount) node.mount.mounts.push(mount);
			}
			return mountRoot;
		},
		unmount(mountpoint) {
			var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
			if (!FS.isMountpoint(lookup.node)) throw new FS.ErrnoError(28);
			var node = lookup.node;
			var mount = node.mounted;
			var mounts = FS.getMounts(mount);
			Object.keys(FS.nameTable).forEach((hash) => {
				var current = FS.nameTable[hash];
				while (current) {
					var next = current.name_next;
					if (mounts.includes(current.mount)) FS.destroyNode(current);
					current = next;
				}
			});
			node.mounted = null;
			var idx = node.mount.mounts.indexOf(mount);
			node.mount.mounts.splice(idx, 1);
		},
		lookup(parent, name) {
			return parent.node_ops.lookup(parent, name);
		},
		mknod(path, mode, dev) {
			var lookup = FS.lookupPath(path, { parent: true });
			var parent = lookup.node;
			var name = PATH.basename(path);
			if (!name) throw new FS.ErrnoError(28);
			if (name === "." || name === "..") throw new FS.ErrnoError(20);
			var errCode = FS.mayCreate(parent, name);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.mknod) throw new FS.ErrnoError(63);
			return parent.node_ops.mknod(parent, name, mode, dev);
		},
		statfs(path) {
			return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
		},
		statfsStream(stream) {
			return FS.statfsNode(stream.node);
		},
		statfsNode(node) {
			var rtn = {
				bsize: 4096,
				frsize: 4096,
				blocks: 1e6,
				bfree: 5e5,
				bavail: 5e5,
				files: FS.nextInode,
				ffree: FS.nextInode - 1,
				fsid: 42,
				flags: 2,
				namelen: 255
			};
			if (node.node_ops.statfs) Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
			return rtn;
		},
		create(path, mode = 438) {
			mode &= 4095;
			mode |= 32768;
			return FS.mknod(path, mode, 0);
		},
		mkdir(path, mode = 511) {
			mode &= 1023;
			mode |= 16384;
			return FS.mknod(path, mode, 0);
		},
		mkdirTree(path, mode) {
			var dirs = path.split("/");
			var d = "";
			for (var dir of dirs) {
				if (!dir) continue;
				if (d || PATH.isAbs(path)) d += "/";
				d += dir;
				try {
					FS.mkdir(d, mode);
				} catch (e) {
					if (e.errno != 20) throw e;
				}
			}
		},
		mkdev(path, mode, dev) {
			if (typeof dev == "undefined") {
				dev = mode;
				mode = 438;
			}
			mode |= 8192;
			return FS.mknod(path, mode, dev);
		},
		symlink(oldpath, newpath) {
			if (!PATH_FS.resolve(oldpath)) throw new FS.ErrnoError(44);
			var lookup = FS.lookupPath(newpath, { parent: true });
			var parent = lookup.node;
			if (!parent) throw new FS.ErrnoError(44);
			var newname = PATH.basename(newpath);
			var errCode = FS.mayCreate(parent, newname);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.symlink) throw new FS.ErrnoError(63);
			return parent.node_ops.symlink(parent, newname, oldpath);
		},
		rename(old_path, new_path) {
			var old_dirname = PATH.dirname(old_path);
			var new_dirname = PATH.dirname(new_path);
			var old_name = PATH.basename(old_path);
			var new_name = PATH.basename(new_path);
			var lookup, old_dir, new_dir;
			lookup = FS.lookupPath(old_path, { parent: true });
			old_dir = lookup.node;
			lookup = FS.lookupPath(new_path, { parent: true });
			new_dir = lookup.node;
			if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
			if (old_dir.mount !== new_dir.mount) throw new FS.ErrnoError(75);
			var old_node = FS.lookupNode(old_dir, old_name);
			var relative = PATH_FS.relative(old_path, new_dirname);
			if (relative.charAt(0) !== ".") throw new FS.ErrnoError(28);
			relative = PATH_FS.relative(new_path, old_dirname);
			if (relative.charAt(0) !== ".") throw new FS.ErrnoError(55);
			var new_node;
			try {
				new_node = FS.lookupNode(new_dir, new_name);
			} catch (e) {}
			if (old_node === new_node) return;
			var isdir = FS.isDir(old_node.mode);
			var errCode = FS.mayDelete(old_dir, old_name, isdir);
			if (errCode) throw new FS.ErrnoError(errCode);
			errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!old_dir.node_ops.rename) throw new FS.ErrnoError(63);
			if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) throw new FS.ErrnoError(10);
			if (new_dir !== old_dir) {
				errCode = FS.nodePermissions(old_dir, "w");
				if (errCode) throw new FS.ErrnoError(errCode);
			}
			FS.hashRemoveNode(old_node);
			try {
				old_dir.node_ops.rename(old_node, new_dir, new_name);
				old_node.parent = new_dir;
			} catch (e) {
				throw e;
			} finally {
				FS.hashAddNode(old_node);
			}
		},
		rmdir(path) {
			var lookup = FS.lookupPath(path, { parent: true });
			var parent = lookup.node;
			var name = PATH.basename(path);
			var node = FS.lookupNode(parent, name);
			var errCode = FS.mayDelete(parent, name, true);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.rmdir) throw new FS.ErrnoError(63);
			if (FS.isMountpoint(node)) throw new FS.ErrnoError(10);
			parent.node_ops.rmdir(parent, name);
			FS.destroyNode(node);
		},
		readdir(path) {
			var lookup = FS.lookupPath(path, { follow: true });
			var node = lookup.node;
			var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
			return readdir(node);
		},
		unlink(path) {
			var lookup = FS.lookupPath(path, { parent: true });
			var parent = lookup.node;
			if (!parent) throw new FS.ErrnoError(44);
			var name = PATH.basename(path);
			var node = FS.lookupNode(parent, name);
			var errCode = FS.mayDelete(parent, name, false);
			if (errCode) throw new FS.ErrnoError(errCode);
			if (!parent.node_ops.unlink) throw new FS.ErrnoError(63);
			if (FS.isMountpoint(node)) throw new FS.ErrnoError(10);
			parent.node_ops.unlink(parent, name);
			FS.destroyNode(node);
		},
		readlink(path) {
			var lookup = FS.lookupPath(path);
			var link = lookup.node;
			if (!link) throw new FS.ErrnoError(44);
			if (!link.node_ops.readlink) throw new FS.ErrnoError(28);
			return link.node_ops.readlink(link);
		},
		stat(path, dontFollow) {
			var lookup = FS.lookupPath(path, { follow: !dontFollow });
			var node = lookup.node;
			var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
			return getattr(node);
		},
		fstat(fd) {
			var stream = FS.getStreamChecked(fd);
			var node = stream.node;
			var getattr = stream.stream_ops.getattr;
			var arg = getattr ? stream : node;
			getattr ??= node.node_ops.getattr;
			FS.checkOpExists(getattr, 63);
			return getattr(arg);
		},
		lstat(path) {
			return FS.stat(path, true);
		},
		doChmod(stream, node, mode, dontFollow) {
			FS.doSetAttr(stream, node, {
				mode: mode & 4095 | node.mode & -4096,
				ctime: Date.now(),
				dontFollow
			});
		},
		chmod(path, mode, dontFollow) {
			var node;
			if (typeof path == "string") {
				var lookup = FS.lookupPath(path, { follow: !dontFollow });
				node = lookup.node;
			} else node = path;
			FS.doChmod(null, node, mode, dontFollow);
		},
		lchmod(path, mode) {
			FS.chmod(path, mode, true);
		},
		fchmod(fd, mode) {
			var stream = FS.getStreamChecked(fd);
			FS.doChmod(stream, stream.node, mode, false);
		},
		doChown(stream, node, dontFollow) {
			FS.doSetAttr(stream, node, {
				timestamp: Date.now(),
				dontFollow
			});
		},
		chown(path, uid, gid, dontFollow) {
			var node;
			if (typeof path == "string") {
				var lookup = FS.lookupPath(path, { follow: !dontFollow });
				node = lookup.node;
			} else node = path;
			FS.doChown(null, node, dontFollow);
		},
		lchown(path, uid, gid) {
			FS.chown(path, uid, gid, true);
		},
		fchown(fd, uid, gid) {
			var stream = FS.getStreamChecked(fd);
			FS.doChown(stream, stream.node, false);
		},
		doTruncate(stream, node, len) {
			if (FS.isDir(node.mode)) throw new FS.ErrnoError(31);
			if (!FS.isFile(node.mode)) throw new FS.ErrnoError(28);
			var errCode = FS.nodePermissions(node, "w");
			if (errCode) throw new FS.ErrnoError(errCode);
			FS.doSetAttr(stream, node, {
				size: len,
				timestamp: Date.now()
			});
		},
		truncate(path, len) {
			if (len < 0) throw new FS.ErrnoError(28);
			var node;
			if (typeof path == "string") {
				var lookup = FS.lookupPath(path, { follow: true });
				node = lookup.node;
			} else node = path;
			FS.doTruncate(null, node, len);
		},
		ftruncate(fd, len) {
			var stream = FS.getStreamChecked(fd);
			if (len < 0 || (stream.flags & 2097155) === 0) throw new FS.ErrnoError(28);
			FS.doTruncate(stream, stream.node, len);
		},
		utime(path, atime, mtime) {
			var lookup = FS.lookupPath(path, { follow: true });
			var node = lookup.node;
			var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
			setattr(node, {
				atime,
				mtime
			});
		},
		open(path, flags, mode = 438) {
			if (path === "") throw new FS.ErrnoError(44);
			flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
			if (flags & 64) mode = mode & 4095 | 32768;
			else mode = 0;
			var node;
			var isDirPath;
			if (typeof path == "object") node = path;
			else {
				isDirPath = path.endsWith("/");
				var lookup = FS.lookupPath(path, {
					follow: !(flags & 131072),
					noent_okay: true
				});
				node = lookup.node;
				path = lookup.path;
			}
			var created = false;
			if (flags & 64) if (node) {
				if (flags & 128) throw new FS.ErrnoError(20);
			} else if (isDirPath) throw new FS.ErrnoError(31);
			else {
				node = FS.mknod(path, mode | 511, 0);
				created = true;
			}
			if (!node) throw new FS.ErrnoError(44);
			if (FS.isChrdev(node.mode)) flags &= -513;
			if (flags & 65536 && !FS.isDir(node.mode)) throw new FS.ErrnoError(54);
			if (!created) {
				var errCode = FS.mayOpen(node, flags);
				if (errCode) throw new FS.ErrnoError(errCode);
			}
			if (flags & 512 && !created) FS.truncate(node, 0);
			flags &= -131713;
			var stream = FS.createStream({
				node,
				path: FS.getPath(node),
				flags,
				seekable: true,
				position: 0,
				stream_ops: node.stream_ops,
				ungotten: [],
				error: false
			});
			if (stream.stream_ops.open) stream.stream_ops.open(stream);
			if (created) FS.chmod(node, mode & 511);
			return stream;
		},
		close(stream) {
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if (stream.getdents) stream.getdents = null;
			try {
				if (stream.stream_ops.close) stream.stream_ops.close(stream);
			} catch (e) {
				throw e;
			} finally {
				FS.closeStream(stream.fd);
			}
			stream.fd = null;
		},
		isClosed(stream) {
			return stream.fd === null;
		},
		llseek(stream, offset, whence) {
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if (!stream.seekable || !stream.stream_ops.llseek) throw new FS.ErrnoError(70);
			if (whence != 0 && whence != 1 && whence != 2) throw new FS.ErrnoError(28);
			stream.position = stream.stream_ops.llseek(stream, offset, whence);
			stream.ungotten = [];
			return stream.position;
		},
		read(stream, buffer, offset, length, position) {
			if (length < 0 || position < 0) throw new FS.ErrnoError(28);
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if ((stream.flags & 2097155) === 1) throw new FS.ErrnoError(8);
			if (FS.isDir(stream.node.mode)) throw new FS.ErrnoError(31);
			if (!stream.stream_ops.read) throw new FS.ErrnoError(28);
			var seeking = typeof position != "undefined";
			if (!seeking) position = stream.position;
			else if (!stream.seekable) throw new FS.ErrnoError(70);
			var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
			if (!seeking) stream.position += bytesRead;
			return bytesRead;
		},
		write(stream, buffer, offset, length, position, canOwn) {
			if (length < 0 || position < 0) throw new FS.ErrnoError(28);
			if (FS.isClosed(stream)) throw new FS.ErrnoError(8);
			if ((stream.flags & 2097155) === 0) throw new FS.ErrnoError(8);
			if (FS.isDir(stream.node.mode)) throw new FS.ErrnoError(31);
			if (!stream.stream_ops.write) throw new FS.ErrnoError(28);
			if (stream.seekable && stream.flags & 1024) FS.llseek(stream, 0, 2);
			var seeking = typeof position != "undefined";
			if (!seeking) position = stream.position;
			else if (!stream.seekable) throw new FS.ErrnoError(70);
			var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
			if (!seeking) stream.position += bytesWritten;
			return bytesWritten;
		},
		mmap(stream, length, position, prot, flags) {
			if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) throw new FS.ErrnoError(2);
			if ((stream.flags & 2097155) === 1) throw new FS.ErrnoError(2);
			if (!stream.stream_ops.mmap) throw new FS.ErrnoError(43);
			if (!length) throw new FS.ErrnoError(28);
			return stream.stream_ops.mmap(stream, length, position, prot, flags);
		},
		msync(stream, buffer, offset, length, mmapFlags) {
			if (!stream.stream_ops.msync) return 0;
			return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
		},
		ioctl(stream, cmd, arg) {
			if (!stream.stream_ops.ioctl) throw new FS.ErrnoError(59);
			return stream.stream_ops.ioctl(stream, cmd, arg);
		},
		readFile(path, opts = {}) {
			opts.flags = opts.flags || 0;
			opts.encoding = opts.encoding || "binary";
			if (opts.encoding !== "utf8" && opts.encoding !== "binary") throw new Error(`Invalid encoding type "${opts.encoding}"`);
			var stream = FS.open(path, opts.flags);
			var stat = FS.stat(path);
			var length = stat.size;
			var buf = new Uint8Array(length);
			FS.read(stream, buf, 0, length, 0);
			if (opts.encoding === "utf8") buf = UTF8ArrayToString(buf);
			FS.close(stream);
			return buf;
		},
		writeFile(path, data, opts = {}) {
			opts.flags = opts.flags || 577;
			var stream = FS.open(path, opts.flags, opts.mode);
			if (typeof data == "string") data = new Uint8Array(intArrayFromString(data, true));
			if (ArrayBuffer.isView(data)) FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
			else throw new Error("Unsupported data type");
			FS.close(stream);
		},
		cwd: () => FS.currentPath,
		chdir(path) {
			var lookup = FS.lookupPath(path, { follow: true });
			if (lookup.node === null) throw new FS.ErrnoError(44);
			if (!FS.isDir(lookup.node.mode)) throw new FS.ErrnoError(54);
			var errCode = FS.nodePermissions(lookup.node, "x");
			if (errCode) throw new FS.ErrnoError(errCode);
			FS.currentPath = lookup.path;
		},
		createDefaultDirectories() {
			FS.mkdir("/tmp");
			FS.mkdir("/home");
			FS.mkdir("/home/web_user");
		},
		createDefaultDevices() {
			FS.mkdir("/dev");
			FS.registerDevice(FS.makedev(1, 3), {
				read: () => 0,
				write: (stream, buffer, offset, length, pos) => length,
				llseek: () => 0
			});
			FS.mkdev("/dev/null", FS.makedev(1, 3));
			TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
			TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
			FS.mkdev("/dev/tty", FS.makedev(5, 0));
			FS.mkdev("/dev/tty1", FS.makedev(6, 0));
			var randomBuffer = new Uint8Array(1024), randomLeft = 0;
			var randomByte = () => {
				if (randomLeft === 0) {
					randomFill(randomBuffer);
					randomLeft = randomBuffer.byteLength;
				}
				return randomBuffer[--randomLeft];
			};
			FS.createDevice("/dev", "random", randomByte);
			FS.createDevice("/dev", "urandom", randomByte);
			FS.mkdir("/dev/shm");
			FS.mkdir("/dev/shm/tmp");
		},
		createSpecialDirectories() {
			FS.mkdir("/proc");
			var proc_self = FS.mkdir("/proc/self");
			FS.mkdir("/proc/self/fd");
			FS.mount({ mount() {
				var node = FS.createNode(proc_self, "fd", 16895, 73);
				node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
				node.node_ops = {
					lookup(parent, name) {
						var fd = +name;
						var stream = FS.getStreamChecked(fd);
						var ret = {
							parent: null,
							mount: { mountpoint: "fake" },
							node_ops: { readlink: () => stream.path },
							id: fd + 1
						};
						ret.parent = ret;
						return ret;
					},
					readdir() {
						return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
					}
				};
				return node;
			} }, {}, "/proc/self/fd");
		},
		createStandardStreams(input, output, error) {
			if (input) FS.createDevice("/dev", "stdin", input);
			else FS.symlink("/dev/tty", "/dev/stdin");
			if (output) FS.createDevice("/dev", "stdout", null, output);
			else FS.symlink("/dev/tty", "/dev/stdout");
			if (error) FS.createDevice("/dev", "stderr", null, error);
			else FS.symlink("/dev/tty1", "/dev/stderr");
			var stdin = FS.open("/dev/stdin", 0);
			var stdout = FS.open("/dev/stdout", 1);
			var stderr = FS.open("/dev/stderr", 1);
		},
		staticInit() {
			FS.nameTable = new Array(4096);
			FS.mount(MEMFS, {}, "/");
			FS.createDefaultDirectories();
			FS.createDefaultDevices();
			FS.createSpecialDirectories();
			FS.filesystems = { MEMFS };
		},
		init(input, output, error) {
			FS.initialized = true;
			FS.createStandardStreams(input, output, error);
		},
		quit() {
			FS.initialized = false;
			for (var stream of FS.streams) if (stream) FS.close(stream);
		},
		findObject(path, dontResolveLastLink) {
			var ret = FS.analyzePath(path, dontResolveLastLink);
			if (!ret.exists) return null;
			return ret.object;
		},
		analyzePath(path, dontResolveLastLink) {
			try {
				var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
				path = lookup.path;
			} catch (e) {}
			var ret = {
				isRoot: false,
				exists: false,
				error: 0,
				name: null,
				path: null,
				object: null,
				parentExists: false,
				parentPath: null,
				parentObject: null
			};
			try {
				var lookup = FS.lookupPath(path, { parent: true });
				ret.parentExists = true;
				ret.parentPath = lookup.path;
				ret.parentObject = lookup.node;
				ret.name = PATH.basename(path);
				lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
				ret.exists = true;
				ret.path = lookup.path;
				ret.object = lookup.node;
				ret.name = lookup.node.name;
				ret.isRoot = lookup.path === "/";
			} catch (e) {
				ret.error = e.errno;
			}
			return ret;
		},
		createPath(parent, path, canRead, canWrite) {
			parent = typeof parent == "string" ? parent : FS.getPath(parent);
			var parts = path.split("/").reverse();
			while (parts.length) {
				var part = parts.pop();
				if (!part) continue;
				var current = PATH.join2(parent, part);
				try {
					FS.mkdir(current);
				} catch (e) {
					if (e.errno != 20) throw e;
				}
				parent = current;
			}
			return current;
		},
		createFile(parent, name, properties, canRead, canWrite) {
			var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
			var mode = FS_getMode(canRead, canWrite);
			return FS.create(path, mode);
		},
		createDataFile(parent, name, data, canRead, canWrite, canOwn) {
			var path = name;
			if (parent) {
				parent = typeof parent == "string" ? parent : FS.getPath(parent);
				path = name ? PATH.join2(parent, name) : parent;
			}
			var mode = FS_getMode(canRead, canWrite);
			var node = FS.create(path, mode);
			if (data) {
				if (typeof data == "string") {
					var arr = new Array(data.length);
					for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
					data = arr;
				}
				FS.chmod(node, mode | 146);
				var stream = FS.open(node, 577);
				FS.write(stream, data, 0, data.length, 0, canOwn);
				FS.close(stream);
				FS.chmod(node, mode);
			}
		},
		createDevice(parent, name, input, output) {
			var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
			var mode = FS_getMode(!!input, !!output);
			FS.createDevice.major ??= 64;
			var dev = FS.makedev(FS.createDevice.major++, 0);
			FS.registerDevice(dev, {
				open(stream) {
					stream.seekable = false;
				},
				close(stream) {
					if (output?.buffer?.length) output(10);
				},
				read(stream, buffer, offset, length, pos) {
					var bytesRead = 0;
					for (var i = 0; i < length; i++) {
						var result;
						try {
							result = input();
						} catch (e) {
							throw new FS.ErrnoError(29);
						}
						if (result === undefined && bytesRead === 0) throw new FS.ErrnoError(6);
						if (result === null || result === undefined) break;
						bytesRead++;
						buffer[offset + i] = result;
					}
					if (bytesRead) stream.node.atime = Date.now();
					return bytesRead;
				},
				write(stream, buffer, offset, length, pos) {
					for (var i = 0; i < length; i++) try {
						output(buffer[offset + i]);
					} catch (e) {
						throw new FS.ErrnoError(29);
					}
					if (length) stream.node.mtime = stream.node.ctime = Date.now();
					return i;
				}
			});
			return FS.mkdev(path, mode, dev);
		},
		forceLoadFile(obj) {
			if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
			if (typeof XMLHttpRequest != "undefined") throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
			else try {
				obj.contents = readBinary(obj.url);
				obj.usedBytes = obj.contents.length;
			} catch (e) {
				throw new FS.ErrnoError(29);
			}
		},
		createLazyFile(parent, name, url, canRead, canWrite) {
			class LazyUint8Array {
				lengthKnown = false;
				chunks = [];
				get(idx) {
					if (idx > this.length - 1 || idx < 0) return undefined;
					var chunkOffset = idx % this.chunkSize;
					var chunkNum = idx / this.chunkSize | 0;
					return this.getter(chunkNum)[chunkOffset];
				}
				setDataGetter(getter) {
					this.getter = getter;
				}
				cacheLength() {
					var xhr = new XMLHttpRequest();
					xhr.open("HEAD", url, false);
					xhr.send(null);
					if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
					var datalength = Number(xhr.getResponseHeader("Content-length"));
					var header;
					var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
					var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
					var chunkSize = 1024 * 1024;
					if (!hasByteServing) chunkSize = datalength;
					var doXHR = (from, to) => {
						if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
						if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
						var xhr$1 = new XMLHttpRequest();
						xhr$1.open("GET", url, false);
						if (datalength !== chunkSize) xhr$1.setRequestHeader("Range", "bytes=" + from + "-" + to);
						xhr$1.responseType = "arraybuffer";
						if (xhr$1.overrideMimeType) xhr$1.overrideMimeType("text/plain; charset=x-user-defined");
						xhr$1.send(null);
						if (!(xhr$1.status >= 200 && xhr$1.status < 300 || xhr$1.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr$1.status);
						if (xhr$1.response !== undefined) return new Uint8Array(xhr$1.response || []);
						return intArrayFromString(xhr$1.responseText || "", true);
					};
					var lazyArray$1 = this;
					lazyArray$1.setDataGetter((chunkNum) => {
						var start = chunkNum * chunkSize;
						var end = (chunkNum + 1) * chunkSize - 1;
						end = Math.min(end, datalength - 1);
						if (typeof lazyArray$1.chunks[chunkNum] == "undefined") lazyArray$1.chunks[chunkNum] = doXHR(start, end);
						if (typeof lazyArray$1.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
						return lazyArray$1.chunks[chunkNum];
					});
					if (usesGzip || !datalength) {
						chunkSize = datalength = 1;
						datalength = this.getter(0).length;
						chunkSize = datalength;
						out("LazyFiles on gzip forces download of the whole file when length is accessed");
					}
					this._length = datalength;
					this._chunkSize = chunkSize;
					this.lengthKnown = true;
				}
				get length() {
					if (!this.lengthKnown) this.cacheLength();
					return this._length;
				}
				get chunkSize() {
					if (!this.lengthKnown) this.cacheLength();
					return this._chunkSize;
				}
			}
			if (typeof XMLHttpRequest != "undefined") {
				if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
				var lazyArray = new LazyUint8Array();
				var properties = {
					isDevice: false,
					contents: lazyArray
				};
			} else {
				var properties = {
					isDevice: false,
					url
				};
			}
			var node = FS.createFile(parent, name, properties, canRead, canWrite);
			if (properties.contents) node.contents = properties.contents;
			else if (properties.url) {
				node.contents = null;
				node.url = properties.url;
			}
			Object.defineProperties(node, { usedBytes: { get: function() {
				return this.contents.length;
			} } });
			var stream_ops = {};
			var keys = Object.keys(node.stream_ops);
			keys.forEach((key) => {
				var fn = node.stream_ops[key];
				stream_ops[key] = (...args) => {
					FS.forceLoadFile(node);
					return fn(...args);
				};
			});
			function writeChunks(stream, buffer, offset, length, position) {
				var contents = stream.node.contents;
				if (position >= contents.length) return 0;
				var size = Math.min(contents.length - position, length);
				if (contents.slice) for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
				else for (var i = 0; i < size; i++) buffer[offset + i] = contents.get(position + i);
				return size;
			}
			stream_ops.read = (stream, buffer, offset, length, position) => {
				FS.forceLoadFile(node);
				return writeChunks(stream, buffer, offset, length, position);
			};
			stream_ops.mmap = (stream, length, position, prot, flags) => {
				FS.forceLoadFile(node);
				var ptr = mmapAlloc(length);
				if (!ptr) throw new FS.ErrnoError(48);
				writeChunks(stream, HEAP8, ptr, length, position);
				return {
					ptr,
					allocated: true
				};
			};
			node.stream_ops = stream_ops;
			return node;
		}
	};
	var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
	var SYSCALLS = {
		DEFAULT_POLLMASK: 5,
		calculateAt(dirfd, path, allowEmpty) {
			if (PATH.isAbs(path)) return path;
			var dir;
			if (dirfd === -100) dir = FS.cwd();
			else {
				var dirstream = SYSCALLS.getStreamFromFD(dirfd);
				dir = dirstream.path;
			}
			if (path.length == 0) {
				if (!allowEmpty) throw new FS.ErrnoError(44);
				return dir;
			}
			return dir + "/" + path;
		},
		writeStat(buf, stat) {
			HEAP32[buf >> 2] = stat.dev;
			HEAP32[buf + 4 >> 2] = stat.mode;
			HEAPU32[buf + 8 >> 2] = stat.nlink;
			HEAP32[buf + 12 >> 2] = stat.uid;
			HEAP32[buf + 16 >> 2] = stat.gid;
			HEAP32[buf + 20 >> 2] = stat.rdev;
			HEAP64[buf + 24 >> 3] = BigInt(stat.size);
			HEAP32[buf + 32 >> 2] = 4096;
			HEAP32[buf + 36 >> 2] = stat.blocks;
			var atime = stat.atime.getTime();
			var mtime = stat.mtime.getTime();
			var ctime = stat.ctime.getTime();
			HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
			HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
			HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
			HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
			HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
			HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
			HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
			return 0;
		},
		writeStatFs(buf, stats) {
			HEAP32[buf + 4 >> 2] = stats.bsize;
			HEAP32[buf + 40 >> 2] = stats.bsize;
			HEAP32[buf + 8 >> 2] = stats.blocks;
			HEAP32[buf + 12 >> 2] = stats.bfree;
			HEAP32[buf + 16 >> 2] = stats.bavail;
			HEAP32[buf + 20 >> 2] = stats.files;
			HEAP32[buf + 24 >> 2] = stats.ffree;
			HEAP32[buf + 28 >> 2] = stats.fsid;
			HEAP32[buf + 44 >> 2] = stats.flags;
			HEAP32[buf + 36 >> 2] = stats.namelen;
		},
		doMsync(addr, stream, len, flags, offset) {
			if (!FS.isFile(stream.node.mode)) throw new FS.ErrnoError(43);
			if (flags & 2) return 0;
			var buffer = HEAPU8.slice(addr, addr + len);
			FS.msync(stream, buffer, offset, len, flags);
		},
		getStreamFromFD(fd) {
			var stream = FS.getStreamChecked(fd);
			return stream;
		},
		varargs: undefined,
		getStr(ptr) {
			var ret = UTF8ToString(ptr);
			return ret;
		}
	};
	function ___syscall_dup3(fd, newfd, flags) {
		try {
			var old = SYSCALLS.getStreamFromFD(fd);
			if (old.fd === newfd) return -28;
			if (newfd < 0 || newfd >= FS.MAX_OPEN_FDS) return -8;
			var existing = FS.getStream(newfd);
			if (existing) FS.close(existing);
			return FS.dupStream(old, newfd).fd;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var syscallGetVarargI = () => {
		var ret = HEAP32[+SYSCALLS.varargs >> 2];
		SYSCALLS.varargs += 4;
		return ret;
	};
	var syscallGetVarargP = syscallGetVarargI;
	function ___syscall_fcntl64(fd, cmd, varargs) {
		SYSCALLS.varargs = varargs;
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			switch (cmd) {
				case 0: {
					var arg = syscallGetVarargI();
					if (arg < 0) return -28;
					while (FS.streams[arg]) arg++;
					var newStream;
					newStream = FS.dupStream(stream, arg);
					return newStream.fd;
				}
				case 1:
				case 2: return 0;
				case 3: return stream.flags;
				case 4: {
					var arg = syscallGetVarargI();
					stream.flags |= arg;
					return 0;
				}
				case 12: {
					var arg = syscallGetVarargP();
					var offset = 0;
					HEAP16[arg + offset >> 1] = 2;
					return 0;
				}
				case 13:
				case 14: return 0;
			}
			return -28;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_ioctl(fd, op, varargs) {
		SYSCALLS.varargs = varargs;
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			switch (op) {
				case 21509: {
					if (!stream.tty) return -59;
					return 0;
				}
				case 21505: {
					if (!stream.tty) return -59;
					if (stream.tty.ops.ioctl_tcgets) {
						var termios = stream.tty.ops.ioctl_tcgets(stream);
						var argp = syscallGetVarargP();
						HEAP32[argp >> 2] = termios.c_iflag || 0;
						HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
						HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
						HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
						for (var i = 0; i < 32; i++) HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
						return 0;
					}
					return 0;
				}
				case 21510:
				case 21511:
				case 21512: {
					if (!stream.tty) return -59;
					return 0;
				}
				case 21506:
				case 21507:
				case 21508: {
					if (!stream.tty) return -59;
					if (stream.tty.ops.ioctl_tcsets) {
						var argp = syscallGetVarargP();
						var c_iflag = HEAP32[argp >> 2];
						var c_oflag = HEAP32[argp + 4 >> 2];
						var c_cflag = HEAP32[argp + 8 >> 2];
						var c_lflag = HEAP32[argp + 12 >> 2];
						var c_cc = [];
						for (var i = 0; i < 32; i++) c_cc.push(HEAP8[argp + i + 17]);
						return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
							c_iflag,
							c_oflag,
							c_cflag,
							c_lflag,
							c_cc
						});
					}
					return 0;
				}
				case 21519: {
					if (!stream.tty) return -59;
					var argp = syscallGetVarargP();
					HEAP32[argp >> 2] = 0;
					return 0;
				}
				case 21520: {
					if (!stream.tty) return -59;
					return -28;
				}
				case 21537:
				case 21531: {
					var argp = syscallGetVarargP();
					return FS.ioctl(stream, op, argp);
				}
				case 21523: {
					if (!stream.tty) return -59;
					if (stream.tty.ops.ioctl_tiocgwinsz) {
						var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
						var argp = syscallGetVarargP();
						HEAP16[argp >> 1] = winsize[0];
						HEAP16[argp + 2 >> 1] = winsize[1];
					}
					return 0;
				}
				case 21524: {
					if (!stream.tty) return -59;
					return 0;
				}
				case 21515: {
					if (!stream.tty) return -59;
					return 0;
				}
				default: return -28;
			}
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_openat(dirfd, path, flags, varargs) {
		SYSCALLS.varargs = varargs;
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			var mode = varargs ? syscallGetVarargI() : 0;
			return FS.open(path, flags, mode).fd;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
	function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			if (bufsize <= 0) return -28;
			var ret = FS.readlink(path);
			var len = Math.min(bufsize, lengthBytesUTF8(ret));
			var endChar = HEAP8[buf + len];
			stringToUTF8(ret, buf, bufsize + 1);
			HEAP8[buf + len] = endChar;
			return len;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
		try {
			oldpath = SYSCALLS.getStr(oldpath);
			newpath = SYSCALLS.getStr(newpath);
			oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
			newpath = SYSCALLS.calculateAt(newdirfd, newpath);
			FS.rename(oldpath, newpath);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_rmdir(path) {
		try {
			path = SYSCALLS.getStr(path);
			FS.rmdir(path);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	function ___syscall_unlinkat(dirfd, path, flags) {
		try {
			path = SYSCALLS.getStr(path);
			path = SYSCALLS.calculateAt(dirfd, path);
			if (!flags) FS.unlink(path);
			else if (flags === 512) FS.rmdir(path);
			else return -28;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return -e.errno;
		}
	}
	var __abort_js = () => abort("");
	var __emscripten_system = (command) => {
		if (ENVIRONMENT_IS_NODE) {
			if (!command) return 1;
			var cmdstr = UTF8ToString(command);
			if (!cmdstr.length) return 0;
			var cp = require("child_process");
			var ret = cp.spawnSync(cmdstr, [], {
				shell: true,
				stdio: "inherit"
			});
			var _W_EXITCODE = (ret$1, sig) => ret$1 << 8 | sig;
			if (ret.status === null) {
				var signalToNumber = (sig) => {
					switch (sig) {
						case "SIGHUP": return 1;
						case "SIGQUIT": return 3;
						case "SIGFPE": return 8;
						case "SIGKILL": return 9;
						case "SIGALRM": return 14;
						case "SIGTERM": return 15;
						default: return 2;
					}
				};
				return _W_EXITCODE(0, signalToNumber(ret.signal));
			}
			return _W_EXITCODE(ret.status, 0);
		}
		if (!command) return 0;
		return -52;
	};
	var __emscripten_throw_longjmp = () => {
		throw Infinity;
	};
	var INT53_MAX = 9007199254740992;
	var INT53_MIN = -9007199254740992;
	var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
	function __gmtime_js(time, tmPtr) {
		time = bigintToI53Checked(time);
		var date = new Date(time * 1e3);
		HEAP32[tmPtr >> 2] = date.getUTCSeconds();
		HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
		HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
		HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
		HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
		HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
		HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
		var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
		var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
		HEAP32[tmPtr + 28 >> 2] = yday;
	}
	var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	var MONTH_DAYS_LEAP_CUMULATIVE = [
		0,
		31,
		60,
		91,
		121,
		152,
		182,
		213,
		244,
		274,
		305,
		335
	];
	var MONTH_DAYS_REGULAR_CUMULATIVE = [
		0,
		31,
		59,
		90,
		120,
		151,
		181,
		212,
		243,
		273,
		304,
		334
	];
	var ydayFromDate = (date) => {
		var leap = isLeapYear(date.getFullYear());
		var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
		var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
		return yday;
	};
	function __localtime_js(time, tmPtr) {
		time = bigintToI53Checked(time);
		var date = new Date(time * 1e3);
		HEAP32[tmPtr >> 2] = date.getSeconds();
		HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
		HEAP32[tmPtr + 8 >> 2] = date.getHours();
		HEAP32[tmPtr + 12 >> 2] = date.getDate();
		HEAP32[tmPtr + 16 >> 2] = date.getMonth();
		HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
		HEAP32[tmPtr + 24 >> 2] = date.getDay();
		var yday = ydayFromDate(date) | 0;
		HEAP32[tmPtr + 28 >> 2] = yday;
		HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
		var start = new Date(date.getFullYear(), 0, 1);
		var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
		var winterOffset = start.getTimezoneOffset();
		var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
		HEAP32[tmPtr + 32 >> 2] = dst;
	}
	var __mktime_js = function(tmPtr) {
		var ret = (() => {
			var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
			var dst = HEAP32[tmPtr + 32 >> 2];
			var guessedOffset = date.getTimezoneOffset();
			var start = new Date(date.getFullYear(), 0, 1);
			var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
			var winterOffset = start.getTimezoneOffset();
			var dstOffset = Math.min(winterOffset, summerOffset);
			if (dst < 0) HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
			else if (dst > 0 != (dstOffset == guessedOffset)) {
				var nonDstOffset = Math.max(winterOffset, summerOffset);
				var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
				date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
			}
			HEAP32[tmPtr + 24 >> 2] = date.getDay();
			var yday = ydayFromDate(date) | 0;
			HEAP32[tmPtr + 28 >> 2] = yday;
			HEAP32[tmPtr >> 2] = date.getSeconds();
			HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
			HEAP32[tmPtr + 8 >> 2] = date.getHours();
			HEAP32[tmPtr + 12 >> 2] = date.getDate();
			HEAP32[tmPtr + 16 >> 2] = date.getMonth();
			HEAP32[tmPtr + 20 >> 2] = date.getYear();
			var timeMs = date.getTime();
			if (isNaN(timeMs)) return -1;
			return timeMs / 1e3;
		})();
		return BigInt(ret);
	};
	var __tzset_js = (timezone, daylight, std_name, dst_name) => {
		var currentYear = new Date().getFullYear();
		var winter = new Date(currentYear, 0, 1);
		var summer = new Date(currentYear, 6, 1);
		var winterOffset = winter.getTimezoneOffset();
		var summerOffset = summer.getTimezoneOffset();
		var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
		HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
		HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
		var extractZone = (timezoneOffset) => {
			var sign = timezoneOffset >= 0 ? "-" : "+";
			var absOffset = Math.abs(timezoneOffset);
			var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
			var minutes = String(absOffset % 60).padStart(2, "0");
			return `UTC${sign}${hours}${minutes}`;
		};
		var winterName = extractZone(winterOffset);
		var summerName = extractZone(summerOffset);
		if (summerOffset < winterOffset) {
			stringToUTF8(winterName, std_name, 17);
			stringToUTF8(summerName, dst_name, 17);
		} else {
			stringToUTF8(winterName, dst_name, 17);
			stringToUTF8(summerName, std_name, 17);
		}
	};
	var _emscripten_get_now = () => performance.now();
	var _emscripten_date_now = () => Date.now();
	var nowIsMonotonic = 1;
	var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
	function _clock_time_get(clk_id, ignored_precision, ptime) {
		ignored_precision = bigintToI53Checked(ignored_precision);
		if (!checkWasiClock(clk_id)) return 28;
		var now;
		if (clk_id === 0) now = _emscripten_date_now();
		else if (nowIsMonotonic) now = _emscripten_get_now();
		else return 52;
		var nsec = Math.round(now * 1e3 * 1e3);
		HEAP64[ptime >> 3] = BigInt(nsec);
		return 0;
	}
	var getHeapMax = () => 2147483648;
	var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
	var growMemory = (size) => {
		var oldHeapSize = wasmMemory.buffer.byteLength;
		var pages = (size - oldHeapSize + 65535) / 65536 | 0;
		try {
			wasmMemory.grow(pages);
			updateMemoryViews();
			return 1;
		} catch (e) {}
	};
	var _emscripten_resize_heap = (requestedSize) => {
		var oldSize = HEAPU8.length;
		requestedSize >>>= 0;
		var maxHeapSize = getHeapMax();
		if (requestedSize > maxHeapSize) return false;
		for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
			var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
			overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
			var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
			var replacement = growMemory(newSize);
			if (replacement) return true;
		}
		return false;
	};
	var ENV = {};
	var getExecutableName = () => thisProgram || "./this.program";
	var getEnvStrings = () => {
		if (!getEnvStrings.strings) {
			var lang = (typeof navigator == "object" && navigator.language || "C").replace("-", "_") + ".UTF-8";
			var env = {
				USER: "web_user",
				LOGNAME: "web_user",
				PATH: "/",
				PWD: "/",
				HOME: "/home/web_user",
				LANG: lang,
				_: getExecutableName()
			};
			for (var x in ENV) if (ENV[x] === undefined) delete env[x];
			else env[x] = ENV[x];
			var strings = [];
			for (var x in env) strings.push(`${x}=${env[x]}`);
			getEnvStrings.strings = strings;
		}
		return getEnvStrings.strings;
	};
	var _environ_get = (__environ, environ_buf) => {
		var bufSize = 0;
		var envp = 0;
		for (var string of getEnvStrings()) {
			var ptr = environ_buf + bufSize;
			HEAPU32[__environ + envp >> 2] = ptr;
			bufSize += stringToUTF8(string, ptr, Infinity) + 1;
			envp += 4;
		}
		return 0;
	};
	var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
		var strings = getEnvStrings();
		HEAPU32[penviron_count >> 2] = strings.length;
		var bufSize = 0;
		for (var string of strings) bufSize += lengthBytesUTF8(string) + 1;
		HEAPU32[penviron_buf_size >> 2] = bufSize;
		return 0;
	};
	var keepRuntimeAlive = () => true;
	var _proc_exit = (code) => {
		EXITSTATUS = code;
		if (!keepRuntimeAlive()) ABORT = true;
		quit_(code, new ExitStatus(code));
	};
	var exitJS = (status, implicit) => {
		EXITSTATUS = status;
		_proc_exit(status);
	};
	var _exit = exitJS;
	function _fd_close(fd) {
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			FS.close(stream);
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	var doReadv = (stream, iov, iovcnt, offset) => {
		var ret = 0;
		for (var i = 0; i < iovcnt; i++) {
			var ptr = HEAPU32[iov >> 2];
			var len = HEAPU32[iov + 4 >> 2];
			iov += 8;
			var curr = FS.read(stream, HEAP8, ptr, len, offset);
			if (curr < 0) return -1;
			ret += curr;
			if (curr < len) break;
			if (typeof offset != "undefined") offset += curr;
		}
		return ret;
	};
	function _fd_read(fd, iov, iovcnt, pnum) {
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			var num = doReadv(stream, iov, iovcnt);
			HEAPU32[pnum >> 2] = num;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	function _fd_seek(fd, offset, whence, newOffset) {
		offset = bigintToI53Checked(offset);
		try {
			if (isNaN(offset)) return 61;
			var stream = SYSCALLS.getStreamFromFD(fd);
			FS.llseek(stream, offset, whence);
			HEAP64[newOffset >> 3] = BigInt(stream.position);
			if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	var doWritev = (stream, iov, iovcnt, offset) => {
		var ret = 0;
		for (var i = 0; i < iovcnt; i++) {
			var ptr = HEAPU32[iov >> 2];
			var len = HEAPU32[iov + 4 >> 2];
			iov += 8;
			var curr = FS.write(stream, HEAP8, ptr, len, offset);
			if (curr < 0) return -1;
			ret += curr;
			if (curr < len) break;
			if (typeof offset != "undefined") offset += curr;
		}
		return ret;
	};
	function _fd_write(fd, iov, iovcnt, pnum) {
		try {
			var stream = SYSCALLS.getStreamFromFD(fd);
			var num = doWritev(stream, iov, iovcnt);
			HEAPU32[pnum >> 2] = num;
			return 0;
		} catch (e) {
			if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
			return e.errno;
		}
	}
	var wasmTableMirror = [];
	var wasmTable;
	var getWasmTableEntry = (funcPtr) => {
		var func = wasmTableMirror[funcPtr];
		if (!func) wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
		return func;
	};
	var getCFunc = (ident) => {
		var func = Module["_" + ident];
		return func;
	};
	var writeArrayToMemory = (array, buffer) => {
		HEAP8.set(array, buffer);
	};
	var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
	var stringToUTF8OnStack = (str) => {
		var size = lengthBytesUTF8(str) + 1;
		var ret = stackAlloc(size);
		stringToUTF8(str, ret, size);
		return ret;
	};
	var ccall = (ident, returnType, argTypes, args, opts) => {
		var toC = {
			string: (str) => {
				var ret$1 = 0;
				if (str !== null && str !== undefined && str !== 0) ret$1 = stringToUTF8OnStack(str);
				return ret$1;
			},
			array: (arr) => {
				var ret$1 = stackAlloc(arr.length);
				writeArrayToMemory(arr, ret$1);
				return ret$1;
			}
		};
		function convertReturnValue(ret$1) {
			if (returnType === "string") return UTF8ToString(ret$1);
			if (returnType === "boolean") return Boolean(ret$1);
			return ret$1;
		}
		var func = getCFunc(ident);
		var cArgs = [];
		var stack = 0;
		if (args) for (var i = 0; i < args.length; i++) {
			var converter = toC[argTypes[i]];
			if (converter) {
				if (stack === 0) stack = stackSave();
				cArgs[i] = converter(args[i]);
			} else cArgs[i] = args[i];
		}
		var ret = func(...cArgs);
		function onDone(ret$1) {
			if (stack !== 0) stackRestore(stack);
			return convertReturnValue(ret$1);
		}
		ret = onDone(ret);
		return ret;
	};
	var uleb128EncodeWithLen = (arr) => {
		const n = arr.length;
		return [
			n % 128 | 128,
			n >> 7,
			...arr
		];
	};
	var wasmTypeCodes = {
		i: 127,
		p: 127,
		j: 126,
		f: 125,
		d: 124,
		e: 111
	};
	var generateTypePack = (types) => uleb128EncodeWithLen(Array.from(types, (type) => {
		var code = wasmTypeCodes[type];
		return code;
	}));
	var convertJsFunctionToWasm = (func, sig) => {
		var bytes = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...uleb128EncodeWithLen([
			1,
			96,
			...generateTypePack(sig.slice(1)),
			...generateTypePack(sig[0] === "v" ? "" : sig[0])
		]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
		var module = new WebAssembly.Module(bytes);
		var instance = new WebAssembly.Instance(module, { e: { f: func } });
		var wrappedFunc = instance.exports["f"];
		return wrappedFunc;
	};
	var updateTableMap = (offset, count) => {
		if (functionsInTableMap) for (var i = offset; i < offset + count; i++) {
			var item = getWasmTableEntry(i);
			if (item) functionsInTableMap.set(item, i);
		}
	};
	var functionsInTableMap;
	var getFunctionAddress = (func) => {
		if (!functionsInTableMap) {
			functionsInTableMap = new WeakMap();
			updateTableMap(0, wasmTable.length);
		}
		return functionsInTableMap.get(func) || 0;
	};
	var freeTableIndexes = [];
	var getEmptyTableSlot = () => {
		if (freeTableIndexes.length) return freeTableIndexes.pop();
		return wasmTable["grow"](1);
	};
	var setWasmTableEntry = (idx, func) => {
		wasmTable.set(idx, func);
		wasmTableMirror[idx] = wasmTable.get(idx);
	};
	var addFunction = (func, sig) => {
		var rtn = getFunctionAddress(func);
		if (rtn) return rtn;
		var ret = getEmptyTableSlot();
		try {
			setWasmTableEntry(ret, func);
		} catch (err$1) {
			if (!(err$1 instanceof TypeError)) throw err$1;
			var wrapped = convertJsFunctionToWasm(func, sig);
			setWasmTableEntry(ret, wrapped);
		}
		functionsInTableMap.set(func, ret);
		return ret;
	};
	var removeFunction = (index) => {
		functionsInTableMap.delete(getWasmTableEntry(index));
		setWasmTableEntry(index, null);
		freeTableIndexes.push(index);
	};
	var stringToNewUTF8 = (str) => {
		var size = lengthBytesUTF8(str) + 1;
		var ret = _malloc(size);
		if (ret) stringToUTF8(str, ret, size);
		return ret;
	};
	FS.createPreloadedFile = FS_createPreloadedFile;
	FS.staticInit();
	{}
	Module["ENV"] = ENV;
	Module["ccall"] = ccall;
	Module["addFunction"] = addFunction;
	Module["removeFunction"] = removeFunction;
	Module["setValue"] = setValue;
	Module["getValue"] = getValue;
	Module["stringToUTF8"] = stringToUTF8;
	Module["lengthBytesUTF8"] = lengthBytesUTF8;
	Module["stringToNewUTF8"] = stringToNewUTF8;
	Module["FS"] = FS;
	var _lua_checkstack, _lua_xmove, _lua_atpanic, _lua_version, _lua_absindex, _lua_gettop, _lua_settop, _lua_closeslot, _lua_rotate, _lua_copy, _lua_pushvalue, _lua_type, _lua_typename, _lua_iscfunction, _lua_isinteger, _lua_isnumber, _lua_isstring, _lua_isuserdata, _lua_rawequal, _lua_arith, _lua_compare, _lua_stringtonumber, _lua_tonumberx, _lua_tointegerx, _lua_toboolean, _lua_tolstring, _lua_rawlen, _lua_tocfunction, _lua_touserdata, _lua_tothread, _lua_topointer, _lua_pushnil, _lua_pushnumber, _lua_pushinteger, _lua_pushlstring, _lua_pushstring, _lua_pushcclosure, _lua_pushboolean, _lua_pushlightuserdata, _lua_pushthread, _lua_getglobal, _lua_gettable, _lua_getfield, _lua_geti, _lua_rawget, _lua_rawgeti, _lua_rawgetp, _lua_createtable, _lua_getmetatable, _lua_getiuservalue, _lua_setglobal, _lua_settable, _lua_setfield, _lua_seti, _lua_rawset, _lua_rawsetp, _lua_rawseti, _lua_setmetatable, _lua_setiuservalue, _lua_callk, _lua_pcallk, _lua_load, _lua_dump, _lua_status, _lua_error, _lua_next, _lua_toclose, _lua_concat, _lua_len, _lua_getallocf, _lua_setallocf, _lua_setwarnf, _lua_warning, _lua_newuserdatauv, _lua_getupvalue, _lua_setupvalue, _lua_upvalueid, _lua_upvaluejoin, _luaL_traceback, _lua_getstack, _lua_getinfo, _luaL_buffinit, _luaL_addstring, _luaL_prepbuffsize, _luaL_addvalue, _luaL_pushresult, _luaL_argerror, _luaL_typeerror, _luaL_getmetafield, _luaL_where, _luaL_fileresult, _luaL_execresult, _luaL_newmetatable, _luaL_setmetatable, _luaL_testudata, _luaL_checkudata, _luaL_optlstring, _luaL_checklstring, _luaL_checkstack, _luaL_checktype, _luaL_checkany, _luaL_checknumber, _luaL_optnumber, _luaL_checkinteger, _luaL_optinteger, _luaL_setfuncs, _luaL_addlstring, _luaL_pushresultsize, _luaL_buffinitsize, _luaL_ref, _luaL_unref, _luaL_loadfilex, _luaL_loadbufferx, _luaL_loadstring, _luaL_callmeta, _luaL_len, _luaL_tolstring, _luaL_getsubtable, _luaL_requiref, _luaL_addgsub, _luaL_gsub, _luaL_newstate, _lua_newstate, _free, _realloc, _luaL_checkversion_, _luaopen_base, _luaopen_coroutine, _lua_newthread, _lua_yieldk, _lua_isyieldable, _lua_resetthread, _lua_resume, _luaopen_debug, _lua_gethookmask, _lua_gethook, _lua_gethookcount, _lua_getlocal, _lua_sethook, _lua_setlocal, _lua_setcstacklimit, _luaL_openlibs, _luaopen_package, _luaopen_table, _luaopen_io, _luaopen_os, _luaopen_string, _luaopen_math, _luaopen_utf8, _lua_close, _malloc, _setThrew, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current;
	function assignWasmExports(wasmExports$1) {
		Module["_lua_checkstack"] = _lua_checkstack = wasmExports$1["C"];
		Module["_lua_xmove"] = _lua_xmove = wasmExports$1["D"];
		Module["_lua_atpanic"] = _lua_atpanic = wasmExports$1["E"];
		Module["_lua_version"] = _lua_version = wasmExports$1["F"];
		Module["_lua_absindex"] = _lua_absindex = wasmExports$1["G"];
		Module["_lua_gettop"] = _lua_gettop = wasmExports$1["H"];
		Module["_lua_settop"] = _lua_settop = wasmExports$1["I"];
		Module["_lua_closeslot"] = _lua_closeslot = wasmExports$1["J"];
		Module["_lua_rotate"] = _lua_rotate = wasmExports$1["K"];
		Module["_lua_copy"] = _lua_copy = wasmExports$1["L"];
		Module["_lua_pushvalue"] = _lua_pushvalue = wasmExports$1["M"];
		Module["_lua_type"] = _lua_type = wasmExports$1["N"];
		Module["_lua_typename"] = _lua_typename = wasmExports$1["O"];
		Module["_lua_iscfunction"] = _lua_iscfunction = wasmExports$1["P"];
		Module["_lua_isinteger"] = _lua_isinteger = wasmExports$1["Q"];
		Module["_lua_isnumber"] = _lua_isnumber = wasmExports$1["R"];
		Module["_lua_isstring"] = _lua_isstring = wasmExports$1["S"];
		Module["_lua_isuserdata"] = _lua_isuserdata = wasmExports$1["T"];
		Module["_lua_rawequal"] = _lua_rawequal = wasmExports$1["U"];
		Module["_lua_arith"] = _lua_arith = wasmExports$1["V"];
		Module["_lua_compare"] = _lua_compare = wasmExports$1["W"];
		Module["_lua_stringtonumber"] = _lua_stringtonumber = wasmExports$1["X"];
		Module["_lua_tonumberx"] = _lua_tonumberx = wasmExports$1["Y"];
		Module["_lua_tointegerx"] = _lua_tointegerx = wasmExports$1["Z"];
		Module["_lua_toboolean"] = _lua_toboolean = wasmExports$1["_"];
		Module["_lua_tolstring"] = _lua_tolstring = wasmExports$1["$"];
		Module["_lua_rawlen"] = _lua_rawlen = wasmExports$1["aa"];
		Module["_lua_tocfunction"] = _lua_tocfunction = wasmExports$1["ba"];
		Module["_lua_touserdata"] = _lua_touserdata = wasmExports$1["ca"];
		Module["_lua_tothread"] = _lua_tothread = wasmExports$1["da"];
		Module["_lua_topointer"] = _lua_topointer = wasmExports$1["ea"];
		Module["_lua_pushnil"] = _lua_pushnil = wasmExports$1["fa"];
		Module["_lua_pushnumber"] = _lua_pushnumber = wasmExports$1["ga"];
		Module["_lua_pushinteger"] = _lua_pushinteger = wasmExports$1["ha"];
		Module["_lua_pushlstring"] = _lua_pushlstring = wasmExports$1["ia"];
		Module["_lua_pushstring"] = _lua_pushstring = wasmExports$1["ja"];
		Module["_lua_pushcclosure"] = _lua_pushcclosure = wasmExports$1["ka"];
		Module["_lua_pushboolean"] = _lua_pushboolean = wasmExports$1["la"];
		Module["_lua_pushlightuserdata"] = _lua_pushlightuserdata = wasmExports$1["ma"];
		Module["_lua_pushthread"] = _lua_pushthread = wasmExports$1["na"];
		Module["_lua_getglobal"] = _lua_getglobal = wasmExports$1["oa"];
		Module["_lua_gettable"] = _lua_gettable = wasmExports$1["pa"];
		Module["_lua_getfield"] = _lua_getfield = wasmExports$1["qa"];
		Module["_lua_geti"] = _lua_geti = wasmExports$1["ra"];
		Module["_lua_rawget"] = _lua_rawget = wasmExports$1["sa"];
		Module["_lua_rawgeti"] = _lua_rawgeti = wasmExports$1["ta"];
		Module["_lua_rawgetp"] = _lua_rawgetp = wasmExports$1["ua"];
		Module["_lua_createtable"] = _lua_createtable = wasmExports$1["va"];
		Module["_lua_getmetatable"] = _lua_getmetatable = wasmExports$1["wa"];
		Module["_lua_getiuservalue"] = _lua_getiuservalue = wasmExports$1["xa"];
		Module["_lua_setglobal"] = _lua_setglobal = wasmExports$1["ya"];
		Module["_lua_settable"] = _lua_settable = wasmExports$1["za"];
		Module["_lua_setfield"] = _lua_setfield = wasmExports$1["Aa"];
		Module["_lua_seti"] = _lua_seti = wasmExports$1["Ba"];
		Module["_lua_rawset"] = _lua_rawset = wasmExports$1["Ca"];
		Module["_lua_rawsetp"] = _lua_rawsetp = wasmExports$1["Da"];
		Module["_lua_rawseti"] = _lua_rawseti = wasmExports$1["Ea"];
		Module["_lua_setmetatable"] = _lua_setmetatable = wasmExports$1["Fa"];
		Module["_lua_setiuservalue"] = _lua_setiuservalue = wasmExports$1["Ga"];
		Module["_lua_callk"] = _lua_callk = wasmExports$1["Ha"];
		Module["_lua_pcallk"] = _lua_pcallk = wasmExports$1["Ia"];
		Module["_lua_load"] = _lua_load = wasmExports$1["Ja"];
		Module["_lua_dump"] = _lua_dump = wasmExports$1["Ka"];
		Module["_lua_status"] = _lua_status = wasmExports$1["La"];
		Module["_lua_error"] = _lua_error = wasmExports$1["Ma"];
		Module["_lua_next"] = _lua_next = wasmExports$1["Na"];
		Module["_lua_toclose"] = _lua_toclose = wasmExports$1["Oa"];
		Module["_lua_concat"] = _lua_concat = wasmExports$1["Pa"];
		Module["_lua_len"] = _lua_len = wasmExports$1["Qa"];
		Module["_lua_getallocf"] = _lua_getallocf = wasmExports$1["Ra"];
		Module["_lua_setallocf"] = _lua_setallocf = wasmExports$1["Sa"];
		Module["_lua_setwarnf"] = _lua_setwarnf = wasmExports$1["Ta"];
		Module["_lua_warning"] = _lua_warning = wasmExports$1["Ua"];
		Module["_lua_newuserdatauv"] = _lua_newuserdatauv = wasmExports$1["Va"];
		Module["_lua_getupvalue"] = _lua_getupvalue = wasmExports$1["Wa"];
		Module["_lua_setupvalue"] = _lua_setupvalue = wasmExports$1["Xa"];
		Module["_lua_upvalueid"] = _lua_upvalueid = wasmExports$1["Ya"];
		Module["_lua_upvaluejoin"] = _lua_upvaluejoin = wasmExports$1["Za"];
		Module["_luaL_traceback"] = _luaL_traceback = wasmExports$1["$a"];
		Module["_lua_getstack"] = _lua_getstack = wasmExports$1["ab"];
		Module["_lua_getinfo"] = _lua_getinfo = wasmExports$1["bb"];
		Module["_luaL_buffinit"] = _luaL_buffinit = wasmExports$1["cb"];
		Module["_luaL_addstring"] = _luaL_addstring = wasmExports$1["db"];
		Module["_luaL_prepbuffsize"] = _luaL_prepbuffsize = wasmExports$1["eb"];
		Module["_luaL_addvalue"] = _luaL_addvalue = wasmExports$1["fb"];
		Module["_luaL_pushresult"] = _luaL_pushresult = wasmExports$1["gb"];
		Module["_luaL_argerror"] = _luaL_argerror = wasmExports$1["hb"];
		Module["_luaL_typeerror"] = _luaL_typeerror = wasmExports$1["ib"];
		Module["_luaL_getmetafield"] = _luaL_getmetafield = wasmExports$1["jb"];
		Module["_luaL_where"] = _luaL_where = wasmExports$1["kb"];
		Module["_luaL_fileresult"] = _luaL_fileresult = wasmExports$1["lb"];
		Module["_luaL_execresult"] = _luaL_execresult = wasmExports$1["mb"];
		Module["_luaL_newmetatable"] = _luaL_newmetatable = wasmExports$1["nb"];
		Module["_luaL_setmetatable"] = _luaL_setmetatable = wasmExports$1["ob"];
		Module["_luaL_testudata"] = _luaL_testudata = wasmExports$1["pb"];
		Module["_luaL_checkudata"] = _luaL_checkudata = wasmExports$1["qb"];
		Module["_luaL_optlstring"] = _luaL_optlstring = wasmExports$1["rb"];
		Module["_luaL_checklstring"] = _luaL_checklstring = wasmExports$1["sb"];
		Module["_luaL_checkstack"] = _luaL_checkstack = wasmExports$1["tb"];
		Module["_luaL_checktype"] = _luaL_checktype = wasmExports$1["ub"];
		Module["_luaL_checkany"] = _luaL_checkany = wasmExports$1["vb"];
		Module["_luaL_checknumber"] = _luaL_checknumber = wasmExports$1["wb"];
		Module["_luaL_optnumber"] = _luaL_optnumber = wasmExports$1["xb"];
		Module["_luaL_checkinteger"] = _luaL_checkinteger = wasmExports$1["yb"];
		Module["_luaL_optinteger"] = _luaL_optinteger = wasmExports$1["zb"];
		Module["_luaL_setfuncs"] = _luaL_setfuncs = wasmExports$1["Ab"];
		Module["_luaL_addlstring"] = _luaL_addlstring = wasmExports$1["Bb"];
		Module["_luaL_pushresultsize"] = _luaL_pushresultsize = wasmExports$1["Cb"];
		Module["_luaL_buffinitsize"] = _luaL_buffinitsize = wasmExports$1["Db"];
		Module["_luaL_ref"] = _luaL_ref = wasmExports$1["Eb"];
		Module["_luaL_unref"] = _luaL_unref = wasmExports$1["Fb"];
		Module["_luaL_loadfilex"] = _luaL_loadfilex = wasmExports$1["Gb"];
		Module["_luaL_loadbufferx"] = _luaL_loadbufferx = wasmExports$1["Hb"];
		Module["_luaL_loadstring"] = _luaL_loadstring = wasmExports$1["Ib"];
		Module["_luaL_callmeta"] = _luaL_callmeta = wasmExports$1["Jb"];
		Module["_luaL_len"] = _luaL_len = wasmExports$1["Kb"];
		Module["_luaL_tolstring"] = _luaL_tolstring = wasmExports$1["Lb"];
		Module["_luaL_getsubtable"] = _luaL_getsubtable = wasmExports$1["Mb"];
		Module["_luaL_requiref"] = _luaL_requiref = wasmExports$1["Nb"];
		Module["_luaL_addgsub"] = _luaL_addgsub = wasmExports$1["Ob"];
		Module["_luaL_gsub"] = _luaL_gsub = wasmExports$1["Pb"];
		Module["_luaL_newstate"] = _luaL_newstate = wasmExports$1["Qb"];
		Module["_lua_newstate"] = _lua_newstate = wasmExports$1["Rb"];
		Module["_free"] = _free = wasmExports$1["Sb"];
		Module["_realloc"] = _realloc = wasmExports$1["Tb"];
		Module["_luaL_checkversion_"] = _luaL_checkversion_ = wasmExports$1["Ub"];
		Module["_luaopen_base"] = _luaopen_base = wasmExports$1["Vb"];
		Module["_luaopen_coroutine"] = _luaopen_coroutine = wasmExports$1["Wb"];
		Module["_lua_newthread"] = _lua_newthread = wasmExports$1["Xb"];
		Module["_lua_yieldk"] = _lua_yieldk = wasmExports$1["Yb"];
		Module["_lua_isyieldable"] = _lua_isyieldable = wasmExports$1["Zb"];
		Module["_lua_resetthread"] = _lua_resetthread = wasmExports$1["_b"];
		Module["_lua_resume"] = _lua_resume = wasmExports$1["$b"];
		Module["_luaopen_debug"] = _luaopen_debug = wasmExports$1["ac"];
		Module["_lua_gethookmask"] = _lua_gethookmask = wasmExports$1["bc"];
		Module["_lua_gethook"] = _lua_gethook = wasmExports$1["cc"];
		Module["_lua_gethookcount"] = _lua_gethookcount = wasmExports$1["dc"];
		Module["_lua_getlocal"] = _lua_getlocal = wasmExports$1["ec"];
		Module["_lua_sethook"] = _lua_sethook = wasmExports$1["fc"];
		Module["_lua_setlocal"] = _lua_setlocal = wasmExports$1["gc"];
		Module["_lua_setcstacklimit"] = _lua_setcstacklimit = wasmExports$1["hc"];
		Module["_luaL_openlibs"] = _luaL_openlibs = wasmExports$1["ic"];
		Module["_luaopen_package"] = _luaopen_package = wasmExports$1["jc"];
		Module["_luaopen_table"] = _luaopen_table = wasmExports$1["kc"];
		Module["_luaopen_io"] = _luaopen_io = wasmExports$1["lc"];
		Module["_luaopen_os"] = _luaopen_os = wasmExports$1["mc"];
		Module["_luaopen_string"] = _luaopen_string = wasmExports$1["nc"];
		Module["_luaopen_math"] = _luaopen_math = wasmExports$1["oc"];
		Module["_luaopen_utf8"] = _luaopen_utf8 = wasmExports$1["pc"];
		Module["_lua_close"] = _lua_close = wasmExports$1["qc"];
		Module["_malloc"] = _malloc = wasmExports$1["rc"];
		_setThrew = wasmExports$1["sc"];
		__emscripten_stack_restore = wasmExports$1["tc"];
		__emscripten_stack_alloc = wasmExports$1["uc"];
		_emscripten_stack_get_current = wasmExports$1["vc"];
	}
	var wasmImports = {
		x: ___syscall_dup3,
		a: ___syscall_fcntl64,
		g: ___syscall_ioctl,
		d: ___syscall_openat,
		l: ___syscall_readlinkat,
		n: ___syscall_renameat,
		o: ___syscall_rmdir,
		e: ___syscall_unlinkat,
		p: __abort_js,
		m: __emscripten_system,
		j: __emscripten_throw_longjmp,
		q: __gmtime_js,
		r: __localtime_js,
		s: __mktime_js,
		t: __tzset_js,
		i: _clock_time_get,
		h: _emscripten_date_now,
		k: _emscripten_resize_heap,
		v: _environ_get,
		w: _environ_sizes_get,
		y: _exit,
		b: _fd_close,
		f: _fd_read,
		u: _fd_seek,
		c: _fd_write,
		z: invoke_vii
	};
	var wasmExports = await createWasm();
	function invoke_vii(index, a1, a2) {
		var sp = stackSave();
		try {
			getWasmTableEntry(index)(a1, a2);
		} catch (e) {
			stackRestore(sp);
			if (e !== e + 0) throw e;
			_setThrew(1, 0);
		}
	}
	function run() {
		if (runDependencies > 0) {
			dependenciesFulfilled = run;
			return;
		}
		preRun();
		if (runDependencies > 0) {
			dependenciesFulfilled = run;
			return;
		}
		function doRun() {
			Module["calledRun"] = true;
			if (ABORT) return;
			initRuntime();
			readyPromiseResolve?.(Module);
			postRun();
		}
		doRun();
	}
	function preInit() {}
	preInit();
	run();
	if (runtimeInitialized) moduleRtn = Module;
	else moduleRtn = new Promise((resolve, reject) => {
		readyPromiseResolve = resolve;
		readyPromiseReject = reject;
	});
	return moduleRtn;
}
var glue_default = initWasmModule;

//#endregion
//#region src/luawasm.ts
var LuaWasm = class LuaWasm {
	static async initialize(customWasmFileLocation, environmentVariables) {
		const module = await glue_default({
			locateFile: (path, scriptDirectory) => {
				return customWasmFileLocation || scriptDirectory + path;
			},
			preRun: (initializedModule) => {
				if (typeof environmentVariables === "object") Object.entries(environmentVariables).forEach(([k, v]) => initializedModule.ENV[k] = v);
			}
		});
		return new LuaWasm(module);
	}
	module;
	luaL_checkversion_;
	luaL_getmetafield;
	luaL_callmeta;
	luaL_tolstring;
	luaL_argerror;
	luaL_typeerror;
	luaL_checklstring;
	luaL_optlstring;
	luaL_checknumber;
	luaL_optnumber;
	luaL_checkinteger;
	luaL_optinteger;
	luaL_checkstack;
	luaL_checktype;
	luaL_checkany;
	luaL_newmetatable;
	luaL_setmetatable;
	luaL_testudata;
	luaL_checkudata;
	luaL_where;
	luaL_fileresult;
	luaL_execresult;
	luaL_ref;
	luaL_unref;
	luaL_loadfilex;
	luaL_loadbufferx;
	luaL_loadstring;
	luaL_newstate;
	luaL_len;
	luaL_addgsub;
	luaL_gsub;
	luaL_setfuncs;
	luaL_getsubtable;
	luaL_traceback;
	luaL_requiref;
	luaL_buffinit;
	luaL_prepbuffsize;
	luaL_addlstring;
	luaL_addstring;
	luaL_addvalue;
	luaL_pushresult;
	luaL_pushresultsize;
	luaL_buffinitsize;
	lua_newstate;
	lua_close;
	lua_newthread;
	lua_resetthread;
	lua_atpanic;
	lua_version;
	lua_absindex;
	lua_gettop;
	lua_settop;
	lua_pushvalue;
	lua_rotate;
	lua_copy;
	lua_checkstack;
	lua_xmove;
	lua_isnumber;
	lua_isstring;
	lua_iscfunction;
	lua_isinteger;
	lua_isuserdata;
	lua_type;
	lua_typename;
	lua_tonumberx;
	lua_tointegerx;
	lua_toboolean;
	lua_tolstring;
	lua_rawlen;
	lua_tocfunction;
	lua_touserdata;
	lua_tothread;
	lua_topointer;
	lua_arith;
	lua_rawequal;
	lua_compare;
	lua_pushnil;
	lua_pushnumber;
	lua_pushinteger;
	lua_pushlstring;
	lua_pushstring;
	lua_pushcclosure;
	lua_pushboolean;
	lua_pushlightuserdata;
	lua_pushthread;
	lua_getglobal;
	lua_gettable;
	lua_getfield;
	lua_geti;
	lua_rawget;
	lua_rawgeti;
	lua_rawgetp;
	lua_createtable;
	lua_newuserdatauv;
	lua_getmetatable;
	lua_getiuservalue;
	lua_setglobal;
	lua_settable;
	lua_setfield;
	lua_seti;
	lua_rawset;
	lua_rawseti;
	lua_rawsetp;
	lua_setmetatable;
	lua_setiuservalue;
	lua_callk;
	lua_pcallk;
	lua_load;
	lua_dump;
	lua_yieldk;
	lua_resume;
	lua_status;
	lua_isyieldable;
	lua_setwarnf;
	lua_warning;
	lua_error;
	lua_next;
	lua_concat;
	lua_len;
	lua_stringtonumber;
	lua_getallocf;
	lua_setallocf;
	lua_toclose;
	lua_closeslot;
	lua_getstack;
	lua_getinfo;
	lua_getlocal;
	lua_setlocal;
	lua_getupvalue;
	lua_setupvalue;
	lua_upvalueid;
	lua_upvaluejoin;
	lua_sethook;
	lua_gethook;
	lua_gethookmask;
	lua_gethookcount;
	lua_setcstacklimit;
	luaopen_base;
	luaopen_coroutine;
	luaopen_table;
	luaopen_io;
	luaopen_os;
	luaopen_string;
	luaopen_utf8;
	luaopen_math;
	luaopen_debug;
	luaopen_package;
	luaL_openlibs;
	referenceTracker = new WeakMap();
	referenceMap = new Map();
	availableReferences = [];
	lastRefIndex;
	constructor(module) {
		this.module = module;
		this.luaL_checkversion_ = this.cwrap("luaL_checkversion_", null, [
			"number",
			"number",
			"number"
		]);
		this.luaL_getmetafield = this.cwrap("luaL_getmetafield", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_callmeta = this.cwrap("luaL_callmeta", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_tolstring = this.cwrap("luaL_tolstring", "string", [
			"number",
			"number",
			"number"
		]);
		this.luaL_argerror = this.cwrap("luaL_argerror", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_typeerror = this.cwrap("luaL_typeerror", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_checklstring = this.cwrap("luaL_checklstring", "string", [
			"number",
			"number",
			"number"
		]);
		this.luaL_optlstring = this.cwrap("luaL_optlstring", "string", [
			"number",
			"number",
			"string",
			"number"
		]);
		this.luaL_checknumber = this.cwrap("luaL_checknumber", "number", ["number", "number"]);
		this.luaL_optnumber = this.cwrap("luaL_optnumber", "number", [
			"number",
			"number",
			"number"
		]);
		this.luaL_checkinteger = this.cwrap("luaL_checkinteger", "number", ["number", "number"]);
		this.luaL_optinteger = this.cwrap("luaL_optinteger", "number", [
			"number",
			"number",
			"number"
		]);
		this.luaL_checkstack = this.cwrap("luaL_checkstack", null, [
			"number",
			"number",
			"string"
		]);
		this.luaL_checktype = this.cwrap("luaL_checktype", null, [
			"number",
			"number",
			"number"
		]);
		this.luaL_checkany = this.cwrap("luaL_checkany", null, ["number", "number"]);
		this.luaL_newmetatable = this.cwrap("luaL_newmetatable", "number", ["number", "string"]);
		this.luaL_setmetatable = this.cwrap("luaL_setmetatable", null, ["number", "string"]);
		this.luaL_testudata = this.cwrap("luaL_testudata", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_checkudata = this.cwrap("luaL_checkudata", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_where = this.cwrap("luaL_where", null, ["number", "number"]);
		this.luaL_fileresult = this.cwrap("luaL_fileresult", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_execresult = this.cwrap("luaL_execresult", "number", ["number", "number"]);
		this.luaL_ref = this.cwrap("luaL_ref", "number", ["number", "number"]);
		this.luaL_unref = this.cwrap("luaL_unref", null, [
			"number",
			"number",
			"number"
		]);
		this.luaL_loadfilex = this.cwrap("luaL_loadfilex", "number", [
			"number",
			"string",
			"string"
		]);
		this.luaL_loadbufferx = this.cwrap("luaL_loadbufferx", "number", [
			"number",
			"string|number",
			"number",
			"string|number",
			"string"
		]);
		this.luaL_loadstring = this.cwrap("luaL_loadstring", "number", ["number", "string"]);
		this.luaL_newstate = this.cwrap("luaL_newstate", "number", []);
		this.luaL_len = this.cwrap("luaL_len", "number", ["number", "number"]);
		this.luaL_addgsub = this.cwrap("luaL_addgsub", null, [
			"number",
			"string",
			"string",
			"string"
		]);
		this.luaL_gsub = this.cwrap("luaL_gsub", "string", [
			"number",
			"string",
			"string",
			"string"
		]);
		this.luaL_setfuncs = this.cwrap("luaL_setfuncs", null, [
			"number",
			"number",
			"number"
		]);
		this.luaL_getsubtable = this.cwrap("luaL_getsubtable", "number", [
			"number",
			"number",
			"string"
		]);
		this.luaL_traceback = this.cwrap("luaL_traceback", null, [
			"number",
			"number",
			"string",
			"number"
		]);
		this.luaL_requiref = this.cwrap("luaL_requiref", null, [
			"number",
			"string",
			"number",
			"number"
		]);
		this.luaL_buffinit = this.cwrap("luaL_buffinit", null, ["number", "number"]);
		this.luaL_prepbuffsize = this.cwrap("luaL_prepbuffsize", "string", ["number", "number"]);
		this.luaL_addlstring = this.cwrap("luaL_addlstring", null, [
			"number",
			"string",
			"number"
		]);
		this.luaL_addstring = this.cwrap("luaL_addstring", null, ["number", "string"]);
		this.luaL_addvalue = this.cwrap("luaL_addvalue", null, ["number"]);
		this.luaL_pushresult = this.cwrap("luaL_pushresult", null, ["number"]);
		this.luaL_pushresultsize = this.cwrap("luaL_pushresultsize", null, ["number", "number"]);
		this.luaL_buffinitsize = this.cwrap("luaL_buffinitsize", "string", [
			"number",
			"number",
			"number"
		]);
		this.lua_newstate = this.cwrap("lua_newstate", "number", ["number", "number"]);
		this.lua_close = this.cwrap("lua_close", null, ["number"]);
		this.lua_newthread = this.cwrap("lua_newthread", "number", ["number"]);
		this.lua_resetthread = this.cwrap("lua_resetthread", "number", ["number"]);
		this.lua_atpanic = this.cwrap("lua_atpanic", "number", ["number", "number"]);
		this.lua_version = this.cwrap("lua_version", "number", ["number"]);
		this.lua_absindex = this.cwrap("lua_absindex", "number", ["number", "number"]);
		this.lua_gettop = this.cwrap("lua_gettop", "number", ["number"]);
		this.lua_settop = this.cwrap("lua_settop", null, ["number", "number"]);
		this.lua_pushvalue = this.cwrap("lua_pushvalue", null, ["number", "number"]);
		this.lua_rotate = this.cwrap("lua_rotate", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_copy = this.cwrap("lua_copy", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_checkstack = this.cwrap("lua_checkstack", "number", ["number", "number"]);
		this.lua_xmove = this.cwrap("lua_xmove", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_isnumber = this.cwrap("lua_isnumber", "number", ["number", "number"]);
		this.lua_isstring = this.cwrap("lua_isstring", "number", ["number", "number"]);
		this.lua_iscfunction = this.cwrap("lua_iscfunction", "number", ["number", "number"]);
		this.lua_isinteger = this.cwrap("lua_isinteger", "number", ["number", "number"]);
		this.lua_isuserdata = this.cwrap("lua_isuserdata", "number", ["number", "number"]);
		this.lua_type = this.cwrap("lua_type", "number", ["number", "number"]);
		this.lua_typename = this.cwrap("lua_typename", "string", ["number", "number"]);
		this.lua_tonumberx = this.cwrap("lua_tonumberx", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_tointegerx = this.cwrap("lua_tointegerx", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_toboolean = this.cwrap("lua_toboolean", "number", ["number", "number"]);
		this.lua_tolstring = this.cwrap("lua_tolstring", "string", [
			"number",
			"number",
			"number"
		]);
		this.lua_rawlen = this.cwrap("lua_rawlen", "number", ["number", "number"]);
		this.lua_tocfunction = this.cwrap("lua_tocfunction", "number", ["number", "number"]);
		this.lua_touserdata = this.cwrap("lua_touserdata", "number", ["number", "number"]);
		this.lua_tothread = this.cwrap("lua_tothread", "number", ["number", "number"]);
		this.lua_topointer = this.cwrap("lua_topointer", "number", ["number", "number"]);
		this.lua_arith = this.cwrap("lua_arith", null, ["number", "number"]);
		this.lua_rawequal = this.cwrap("lua_rawequal", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_compare = this.cwrap("lua_compare", "number", [
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_pushnil = this.cwrap("lua_pushnil", null, ["number"]);
		this.lua_pushnumber = this.cwrap("lua_pushnumber", null, ["number", "number"]);
		this.lua_pushinteger = this.cwrap("lua_pushinteger", null, ["number", "number"]);
		this.lua_pushlstring = this.cwrap("lua_pushlstring", "string", [
			"number",
			"string|number",
			"number"
		]);
		this.lua_pushstring = this.cwrap("lua_pushstring", "string", ["number", "string|number"]);
		this.lua_pushcclosure = this.cwrap("lua_pushcclosure", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_pushboolean = this.cwrap("lua_pushboolean", null, ["number", "number"]);
		this.lua_pushlightuserdata = this.cwrap("lua_pushlightuserdata", null, ["number", "number"]);
		this.lua_pushthread = this.cwrap("lua_pushthread", "number", ["number"]);
		this.lua_getglobal = this.cwrap("lua_getglobal", "number", ["number", "string"]);
		this.lua_gettable = this.cwrap("lua_gettable", "number", ["number", "number"]);
		this.lua_getfield = this.cwrap("lua_getfield", "number", [
			"number",
			"number",
			"string"
		]);
		this.lua_geti = this.cwrap("lua_geti", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_rawget = this.cwrap("lua_rawget", "number", ["number", "number"]);
		this.lua_rawgeti = this.cwrap("lua_rawgeti", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_rawgetp = this.cwrap("lua_rawgetp", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_createtable = this.cwrap("lua_createtable", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_newuserdatauv = this.cwrap("lua_newuserdatauv", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_getmetatable = this.cwrap("lua_getmetatable", "number", ["number", "number"]);
		this.lua_getiuservalue = this.cwrap("lua_getiuservalue", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_setglobal = this.cwrap("lua_setglobal", null, ["number", "string"]);
		this.lua_settable = this.cwrap("lua_settable", null, ["number", "number"]);
		this.lua_setfield = this.cwrap("lua_setfield", null, [
			"number",
			"number",
			"string"
		]);
		this.lua_seti = this.cwrap("lua_seti", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_rawset = this.cwrap("lua_rawset", null, ["number", "number"]);
		this.lua_rawseti = this.cwrap("lua_rawseti", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_rawsetp = this.cwrap("lua_rawsetp", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_setmetatable = this.cwrap("lua_setmetatable", "number", ["number", "number"]);
		this.lua_setiuservalue = this.cwrap("lua_setiuservalue", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_callk = this.cwrap("lua_callk", null, [
			"number",
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_pcallk = this.cwrap("lua_pcallk", "number", [
			"number",
			"number",
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_load = this.cwrap("lua_load", "number", [
			"number",
			"number",
			"number",
			"string",
			"string"
		]);
		this.lua_dump = this.cwrap("lua_dump", "number", [
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_yieldk = this.cwrap("lua_yieldk", "number", [
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_resume = this.cwrap("lua_resume", "number", [
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_status = this.cwrap("lua_status", "number", ["number"]);
		this.lua_isyieldable = this.cwrap("lua_isyieldable", "number", ["number"]);
		this.lua_setwarnf = this.cwrap("lua_setwarnf", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_warning = this.cwrap("lua_warning", null, [
			"number",
			"string",
			"number"
		]);
		this.lua_error = this.cwrap("lua_error", "number", ["number"]);
		this.lua_next = this.cwrap("lua_next", "number", ["number", "number"]);
		this.lua_concat = this.cwrap("lua_concat", null, ["number", "number"]);
		this.lua_len = this.cwrap("lua_len", null, ["number", "number"]);
		this.lua_stringtonumber = this.cwrap("lua_stringtonumber", "number", ["number", "string"]);
		this.lua_getallocf = this.cwrap("lua_getallocf", "number", ["number", "number"]);
		this.lua_setallocf = this.cwrap("lua_setallocf", null, [
			"number",
			"number",
			"number"
		]);
		this.lua_toclose = this.cwrap("lua_toclose", null, ["number", "number"]);
		this.lua_closeslot = this.cwrap("lua_closeslot", null, ["number", "number"]);
		this.lua_getstack = this.cwrap("lua_getstack", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_getinfo = this.cwrap("lua_getinfo", "number", [
			"number",
			"string",
			"number"
		]);
		this.lua_getlocal = this.cwrap("lua_getlocal", "string", [
			"number",
			"number",
			"number"
		]);
		this.lua_setlocal = this.cwrap("lua_setlocal", "string", [
			"number",
			"number",
			"number"
		]);
		this.lua_getupvalue = this.cwrap("lua_getupvalue", "string", [
			"number",
			"number",
			"number"
		]);
		this.lua_setupvalue = this.cwrap("lua_setupvalue", "string", [
			"number",
			"number",
			"number"
		]);
		this.lua_upvalueid = this.cwrap("lua_upvalueid", "number", [
			"number",
			"number",
			"number"
		]);
		this.lua_upvaluejoin = this.cwrap("lua_upvaluejoin", null, [
			"number",
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_sethook = this.cwrap("lua_sethook", null, [
			"number",
			"number",
			"number",
			"number"
		]);
		this.lua_gethook = this.cwrap("lua_gethook", "number", ["number"]);
		this.lua_gethookmask = this.cwrap("lua_gethookmask", "number", ["number"]);
		this.lua_gethookcount = this.cwrap("lua_gethookcount", "number", ["number"]);
		this.lua_setcstacklimit = this.cwrap("lua_setcstacklimit", "number", ["number", "number"]);
		this.luaopen_base = this.cwrap("luaopen_base", "number", ["number"]);
		this.luaopen_coroutine = this.cwrap("luaopen_coroutine", "number", ["number"]);
		this.luaopen_table = this.cwrap("luaopen_table", "number", ["number"]);
		this.luaopen_io = this.cwrap("luaopen_io", "number", ["number"]);
		this.luaopen_os = this.cwrap("luaopen_os", "number", ["number"]);
		this.luaopen_string = this.cwrap("luaopen_string", "number", ["number"]);
		this.luaopen_utf8 = this.cwrap("luaopen_utf8", "number", ["number"]);
		this.luaopen_math = this.cwrap("luaopen_math", "number", ["number"]);
		this.luaopen_debug = this.cwrap("luaopen_debug", "number", ["number"]);
		this.luaopen_package = this.cwrap("luaopen_package", "number", ["number"]);
		this.luaL_openlibs = this.cwrap("luaL_openlibs", null, ["number"]);
	}
	lua_remove(luaState, index) {
		this.lua_rotate(luaState, index, -1);
		this.lua_pop(luaState, 1);
	}
	lua_pop(luaState, count) {
		this.lua_settop(luaState, -count - 1);
	}
	luaL_getmetatable(luaState, name) {
		return this.lua_getfield(luaState, LUA_REGISTRYINDEX, name);
	}
	lua_yield(luaState, count) {
		return this.lua_yieldk(luaState, count, 0, null);
	}
	lua_upvalueindex(index) {
		return LUA_REGISTRYINDEX - index;
	}
	ref(data) {
		const existing = this.referenceTracker.get(data);
		if (existing) {
			existing.refCount++;
			return existing.index;
		}
		const availableIndex = this.availableReferences.pop();
		const index = availableIndex === undefined ? this.referenceMap.size + 1 : availableIndex;
		this.referenceMap.set(index, data);
		this.referenceTracker.set(data, {
			refCount: 1,
			index
		});
		this.lastRefIndex = index;
		return index;
	}
	unref(index) {
		const ref = this.referenceMap.get(index);
		if (ref === undefined) return;
		const metadata = this.referenceTracker.get(ref);
		if (metadata === undefined) {
			this.referenceTracker.delete(ref);
			this.availableReferences.push(index);
			return;
		}
		metadata.refCount--;
		if (metadata.refCount <= 0) {
			this.referenceTracker.delete(ref);
			this.referenceMap.delete(index);
			this.availableReferences.push(index);
		}
	}
	getRef(index) {
		return this.referenceMap.get(index);
	}
	getLastRefIndex() {
		return this.lastRefIndex;
	}
	printRefs() {
		for (const [key, value] of this.referenceMap.entries()) console.log(key, value);
	}
	cwrap(name, returnType, argTypes) {
		const hasStringOrNumber = argTypes.some((argType) => argType === "string|number");
		if (!hasStringOrNumber) return (...args) => this.module.ccall(name, returnType, argTypes, args);
		return (...args) => {
			const pointersToBeFreed = [];
			const resolvedArgTypes = argTypes.map((argType, i) => {
				if (argType === "string|number") if (typeof args[i] === "number") return "number";
				else if (args[i]?.length > 1024) {
					const bufferPointer = this.module.stringToNewUTF8(args[i]);
					args[i] = bufferPointer;
					pointersToBeFreed.push(bufferPointer);
					return "number";
				} else return "string";
				return argType;
			});
			try {
				return this.module.ccall(name, returnType, resolvedArgTypes, args);
			} finally {
				for (const pointer of pointersToBeFreed) this.module._free(pointer);
			}
		};
	}
};

//#endregion
//#region src/factory.ts
var LuaFactory = class {
	luaWasmPromise;
	/**
	
	* Constructs a new LuaFactory instance.
	
	* @param [customWasmUri] - Custom URI for the Lua WebAssembly module.
	
	* @param [environmentVariables] - Environment variables for the Lua engine.
	
	*/
	constructor(customWasmUri, environmentVariables) {
		if (customWasmUri === undefined) {
			const isBrowser = typeof window === "object" && typeof window.document !== "undefined" || typeof self === "object" && self?.constructor?.name === "DedicatedWorkerGlobalScope";
			if (isBrowser) customWasmUri = `https://inventionpro.github.io/Webx-viewer/media/wasmoon/glue.wasm`;
		}
		this.luaWasmPromise = LuaWasm.initialize(customWasmUri, environmentVariables);
	}
	/**
	
	* Mounts a file in the Lua environment asynchronously.
	
	* @param path - Path to the file in the Lua environment.
	
	* @param content - Content of the file to be mounted.
	
	* @returns - A Promise that resolves once the file is mounted.
	
	*/
	async mountFile(path, content) {
		this.mountFileSync(await this.getLuaModule(), path, content);
	}
	/**
	
	* Mounts a file in the Lua environment synchronously.
	
	* @param luaWasm - Lua WebAssembly module.
	
	* @param path - Path to the file in the Lua environment.
	
	* @param content - Content of the file to be mounted.
	
	*/
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
	/**
	
	* Creates a Lua engine with the specified options.
	
	* @param [options] - Configuration options for the Lua engine.
	
	* @returns - A Promise that resolves to a new LuaEngine instance.
	
	*/
	async createEngine(options = {}) {
		return new LuaEngine(await this.getLuaModule(), options);
	}
	/**
	
	* Gets the Lua WebAssembly module.
	
	* @returns - A Promise that resolves to the Lua WebAssembly module.
	
	*/
	async getLuaModule() {
		return this.luaWasmPromise;
	}
};

//#endregion
export { Decoration, LUAI_MAXSTACK, LUA_MULTRET, LUA_REGISTRYINDEX, LuaEngine, LuaEventCodes, LuaEventMasks, LuaFactory, Global as LuaGlobal, LuaLibraries, MultiReturn as LuaMultiReturn, RawResult as LuaRawResult, LuaReturn, Thread as LuaThread, LuaTimeoutError, LuaType, LuaTypeExtension, LuaWasm, PointerSize, decorate, decorateFunction, decorateProxy, decorateUserdata };
//# sourceMappingURL=index.js.map