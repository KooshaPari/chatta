
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const NVM_INC: string;
	export const STARSHIP_SHELL: string;
	export const MANPATH: string;
	export const ATLASSIAN_HOST: string;
	export const THEGENT_BUNDLE_LOADED: string;
	export const NIX_PROFILES: string;
	export const GHOSTTY_RESOURCES_DIR: string;
	export const TERM_PROGRAM: string;
	export const FORGE_ENABLE_ZSH_RPROMPT_ASYNC: string;
	export const DEEPSEEK_API_KEY: string;
	export const NODE: string;
	export const XDG_DATA_HOME: string;
	export const NVM_CD_FLAGS: string;
	export const __ETC_PROFILE_NIX_SOURCED: string;
	export const THEGENT_ZSHENV_LOADED: string;
	export const TERM: string;
	export const SHELL: string;
	export const USE_BUN_TOOLS: string;
	export const SAVEHIST: string;
	export const HISTSIZE: string;
	export const TMPDIR: string;
	export const TERM_PROGRAM_VERSION: string;
	export const THGENT_NOTIFY_ENABLE: string;
	export const GIT_CONFIG_PARAMETERS: string;
	export const SOPS_AGE_KEY_FILE: string;
	export const npm_config_local_prefix: string;
	export const ZSH: string;
	export const LC_ALL: string;
	export const USER: string;
	export const THGENT_NOTIFY_VOICE_MODE: string;
	export const NVM_DIR: string;
	export const JAVA_OPTS: string;
	export const COMMAND_MODE: string;
	export const THEGENT_SHELL_SAFEGUARDS_LOADED: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const PHENOTYPE_SOPS_SECRETS: string;
	export const PAGER: string;
	export const ATLASSIAN_TOKEN: string;
	export const PATH: string;
	export const npm_package_json: string;
	export const GHOSTTY_SHELL_FEATURES: string;
	export const __CFBundleIdentifier: string;
	export const npm_command: string;
	export const THGENT_NOTIFY_VOICE_NAME: string;
	export const PWD: string;
	export const OPENROUTER_API_KEY: string;
	export const npm_lifecycle_event: string;
	export const EDITOR: string;
	export const DAYTONA_API_KEY: string;
	export const npm_package_name: string;
	export const LANG: string;
	export const XPC_FLAGS: string;
	export const NIX_SSL_CERT_FILE: string;
	export const GOOGLE_TOKEN_FILE: string;
	export const FORCE_COLOR: string;
	export const AUTHKIT_DOMAIN: string;
	export const ATUIN_TMUX_POPUP: string;
	export const ATLASSIAN_EMAIL: string;
	export const SBT_OPTS: string;
	export const npm_package_version: string;
	export const XPC_SERVICE_NAME: string;
	export const WORKOS_API_KEY: string;
	export const SHLVL: string;
	export const HOME: string;
	export const __MISE_ORIG_PATH: string;
	export const XDG_CONFIG_HOME: string;
	export const TERMINFO: string;
	export const WORKOS_CLIENT_ID: string;
	export const GREP_OPTIONS: string;
	export const ATUIN_HISTORY_ID: string;
	export const MISE_SHELL: string;
	export const XDG_CACHE_HOME: string;
	export const __MISE_ZSH_CHPWD_RAN: string;
	export const STARSHIP_SESSION_KEY: string;
	export const LOGNAME: string;
	export const LESS: string;
	export const npm_lifecycle_script: string;
	export const VISUAL: string;
	export const ATUIN_SESSION: string;
	export const XDG_DATA_DIRS: string;
	export const JINA_API_KEY: string;
	export const GHOSTTY_BIN_DIR: string;
	export const NVM_BIN: string;
	export const GOOGLE_CREDENTIALS_FILE: string;
	export const CLICOLOR_FORCE: string;
	export const npm_config_user_agent: string;
	export const DISPLAY: string;
	export const OSLogRateLimit: string;
	export const GOOGLE_AI_API_KEY: string;
	export const FORGE_EDITOR: string;
	export const THGENT_NOTIFY_COOLDOWN_SEC: string;
	export const ATUIN_SHLVL: string;
	export const __MISE_ZSH_PRECMD_RUN: string;
	export const HISTFILE: string;
	export const npm_node_execpath: string;
	export const COLORTERM: string;
	export const _: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		NVM_INC: string;
		STARSHIP_SHELL: string;
		MANPATH: string;
		ATLASSIAN_HOST: string;
		THEGENT_BUNDLE_LOADED: string;
		NIX_PROFILES: string;
		GHOSTTY_RESOURCES_DIR: string;
		TERM_PROGRAM: string;
		FORGE_ENABLE_ZSH_RPROMPT_ASYNC: string;
		DEEPSEEK_API_KEY: string;
		NODE: string;
		XDG_DATA_HOME: string;
		NVM_CD_FLAGS: string;
		__ETC_PROFILE_NIX_SOURCED: string;
		THEGENT_ZSHENV_LOADED: string;
		TERM: string;
		SHELL: string;
		USE_BUN_TOOLS: string;
		SAVEHIST: string;
		HISTSIZE: string;
		TMPDIR: string;
		TERM_PROGRAM_VERSION: string;
		THGENT_NOTIFY_ENABLE: string;
		GIT_CONFIG_PARAMETERS: string;
		SOPS_AGE_KEY_FILE: string;
		npm_config_local_prefix: string;
		ZSH: string;
		LC_ALL: string;
		USER: string;
		THGENT_NOTIFY_VOICE_MODE: string;
		NVM_DIR: string;
		JAVA_OPTS: string;
		COMMAND_MODE: string;
		THEGENT_SHELL_SAFEGUARDS_LOADED: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		PHENOTYPE_SOPS_SECRETS: string;
		PAGER: string;
		ATLASSIAN_TOKEN: string;
		PATH: string;
		npm_package_json: string;
		GHOSTTY_SHELL_FEATURES: string;
		__CFBundleIdentifier: string;
		npm_command: string;
		THGENT_NOTIFY_VOICE_NAME: string;
		PWD: string;
		OPENROUTER_API_KEY: string;
		npm_lifecycle_event: string;
		EDITOR: string;
		DAYTONA_API_KEY: string;
		npm_package_name: string;
		LANG: string;
		XPC_FLAGS: string;
		NIX_SSL_CERT_FILE: string;
		GOOGLE_TOKEN_FILE: string;
		FORCE_COLOR: string;
		AUTHKIT_DOMAIN: string;
		ATUIN_TMUX_POPUP: string;
		ATLASSIAN_EMAIL: string;
		SBT_OPTS: string;
		npm_package_version: string;
		XPC_SERVICE_NAME: string;
		WORKOS_API_KEY: string;
		SHLVL: string;
		HOME: string;
		__MISE_ORIG_PATH: string;
		XDG_CONFIG_HOME: string;
		TERMINFO: string;
		WORKOS_CLIENT_ID: string;
		GREP_OPTIONS: string;
		ATUIN_HISTORY_ID: string;
		MISE_SHELL: string;
		XDG_CACHE_HOME: string;
		__MISE_ZSH_CHPWD_RAN: string;
		STARSHIP_SESSION_KEY: string;
		LOGNAME: string;
		LESS: string;
		npm_lifecycle_script: string;
		VISUAL: string;
		ATUIN_SESSION: string;
		XDG_DATA_DIRS: string;
		JINA_API_KEY: string;
		GHOSTTY_BIN_DIR: string;
		NVM_BIN: string;
		GOOGLE_CREDENTIALS_FILE: string;
		CLICOLOR_FORCE: string;
		npm_config_user_agent: string;
		DISPLAY: string;
		OSLogRateLimit: string;
		GOOGLE_AI_API_KEY: string;
		FORGE_EDITOR: string;
		THGENT_NOTIFY_COOLDOWN_SEC: string;
		ATUIN_SHLVL: string;
		__MISE_ZSH_PRECMD_RUN: string;
		HISTFILE: string;
		npm_node_execpath: string;
		COLORTERM: string;
		_: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
