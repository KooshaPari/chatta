export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.B0-_yAtD.js",app:"_app/immutable/entry/app.UenZSExH.js",imports:["_app/immutable/entry/start.B0-_yAtD.js","_app/immutable/chunks/BlMICQIi.js","_app/immutable/chunks/BZtECCt2.js","_app/immutable/chunks/MiCMhR6y.js","_app/immutable/chunks/DvdL4hNs.js","_app/immutable/entry/app.UenZSExH.js","_app/immutable/chunks/BZtECCt2.js","_app/immutable/chunks/CoFn8rbt.js","_app/immutable/chunks/J7HdI13O.js","_app/immutable/chunks/DvdL4hNs.js","_app/immutable/chunks/DxzjP2hj.js","_app/immutable/chunks/DpfQXnXm.js","_app/immutable/chunks/CUIGiVVm.js","_app/immutable/chunks/D1Fcn4GT.js","_app/immutable/chunks/MiCMhR6y.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/chat",
				pattern: /^\/chat\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/signup",
				pattern: /^\/signup\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
