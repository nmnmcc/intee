"use client"

import {
	createContext,
	createElement,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useSyncExternalStore
} from "react"
import {
	create as _create,
	type Data,
	type Languages,
	type Locale,
	type Translation,
	type TranslationResult
} from ".."
import {matchTag} from "../match"
import {toDataFunction} from "../translation"

export type TranslationProviderProps<
	T extends string = string,
	D extends Data = Data
> = {
	readonly tags?: readonly string[]
	readonly initial?: Translation<T, D>
	readonly children?: ReactNode
}

export type UseTranslationOptions<T extends string, D extends Data> = {
	readonly tags?: readonly string[]
	readonly initial?: Translation<T, D>
	readonly suspense?: boolean
}

export type ClientCreateResult<T extends string, D extends Data> = {
	readonly TranslationProvider: (
		props: TranslationProviderProps<T, D>
	) => ReactNode
	readonly useTranslation: (
		options?: readonly string[] | UseTranslationOptions<T, D>
	) => TranslationResult<T, D>
	readonly useLocale: (
		options?: readonly string[] | Pick<UseTranslationOptions<T, D>, "tags">
	) => Locale<T>
	readonly preload: (tags?: readonly string[]) => Promise<Translation<T, D>>
	readonly match: ReturnType<typeof _create<T, D>>
}

type TranslationStore<T extends string, D extends Data> = {
	readonly cache: Map<string, Translation<T, D>>
	readonly pending: Map<string, Promise<Translation<T, D>>>
	readonly listeners: Set<() => void>
}

type TranslationContextValue<T extends string, D extends Data> = {
	readonly tags: readonly string[] | undefined
	readonly initial: Translation<T, D> | undefined
	readonly initialKey: string | undefined
	readonly store: TranslationStore<T, D>
}

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>
): ClientCreateResult<T, D> => {
	const match = _create(languages)
	const fallback: Translation<T, D> = {
		data: languages[0].data,
		locale: {current: languages[0].tag, target: languages[0].tag}
	}

	const TranslationContext = createContext<
		TranslationContextValue<T, D> | undefined
	>(undefined)
	const createStore = (): TranslationStore<T, D> => ({
		cache: new Map<string, Translation<T, D>>(),
		pending: new Map<string, Promise<Translation<T, D>>>(),
		listeners: new Set<() => void>()
	})
	const clientStore = createStore()

	const subscribe = (store: TranslationStore<T, D>, listener: () => void) => {
		store.listeners.add(listener)
		return () => {
			store.listeners.delete(listener)
		}
	}

	const fallbackFor = (tags: readonly string[]): Translation<T, D> => ({
		data: fallback.data,
		locale: {
			current: fallback.locale.current,
			target: matchTag(languages, tags)
		}
	})

	const load = (
		store: TranslationStore<T, D>,
		key: string,
		tags: readonly string[]
	) => {
		const cached = store.cache.get(key)
		if (cached) return Promise.resolve(cached)

		const active = store.pending.get(key)
		if (active) return active

		const result = match([...tags])
		const promise = result.then(
			data => {
				const entry = {
					data,
					locale: {
						current: result.locale.target,
						target: result.locale.target
					}
				}
				store.pending.delete(key)
				store.cache.set(key, entry)
				for (const listener of store.listeners) listener()
				return entry
			},
			() => {
				const entry = fallbackFor(tags)
				store.pending.delete(key)
				store.cache.set(key, entry)
				for (const listener of store.listeners) listener()
				return entry
			}
		)

		store.pending.set(key, promise)
		return promise
	}

	const resolveTags = (
		tags: readonly string[] | undefined,
		contextTags?: readonly string[]
	) =>
		tags ??
		contextTags ??
		(typeof navigator !== "undefined" ? [...navigator.languages] : [])

	const isTags = (
		options:
			| readonly string[]
			| UseTranslationOptions<T, D>
			| Pick<UseTranslationOptions<T, D>, "tags">
			| undefined
	): options is readonly string[] => Array.isArray(options)

	const normalizeOptions = (
		options?: readonly string[] | UseTranslationOptions<T, D>
	): UseTranslationOptions<T, D> =>
		isTags(options) ? {tags: options} : (options ?? {})

	const keyFor = (tags: readonly string[]) => JSON.stringify(tags)

	const writeInitial = (
		store: TranslationStore<T, D> | undefined,
		key: string,
		initial: Translation<T, D> | undefined
	) => {
		if (initial && store && !store.cache.has(key))
			store.cache.set(key, initial)
	}

	const preload = async (tags?: readonly string[]) => {
		const resolvedTags = resolveTags(tags)
		const store =
			typeof window === "undefined" ? createStore() : clientStore
		const entry = await load(store, keyFor(resolvedTags), resolvedTags)
		return entry
	}

	const useTranslation = (
		options?: readonly string[] | UseTranslationOptions<T, D>
	) => {
		const {tags, initial, suspense = false} = normalizeOptions(options)
		const context = useContext(TranslationContext)
		const store =
			context?.store ??
			(typeof window === "undefined" ? undefined : clientStore)
		const contextTags = context?.tags
		const resolvedTags = useMemo(
			() => resolveTags(tags, contextTags),
			[contextTags, tags]
		)
		const key = useMemo(() => keyFor(resolvedTags), [resolvedTags])
		const fallbackEntry = useMemo(
			() => fallbackFor(resolvedTags),
			[resolvedTags]
		)
		const serverTags = tags ?? contextTags ?? []
		const serverFallbackEntry = useMemo(
			() => fallbackFor(serverTags),
			[serverTags]
		)
		const initialEntry =
			initial ??
			(context?.initialKey === key ? context.initial : undefined)

		writeInitial(store, key, initialEntry)

		if (suspense && store && !store.cache.has(key)) {
			throw load(store, key, resolvedTags)
		}
		if (!suspense && store) void load(store, key, resolvedTags)

		const subscribeToStore = useCallback(
			(listener: () => void) =>
				store ? subscribe(store, listener) : () => undefined,
			[store]
		)

		const getSnapshot = useCallback(
			() => store?.cache.get(key) ?? fallbackEntry,
			[fallbackEntry, key, store]
		)
		const getServerSnapshot = useCallback(
			() =>
				initialEntry ??
				(suspense ? store?.cache.get(key) : undefined) ??
				serverFallbackEntry,
			[initialEntry, key, serverFallbackEntry, store, suspense]
		)
		const entry = useSyncExternalStore(
			subscribeToStore,
			getSnapshot,
			getServerSnapshot
		)
		const t = useMemo(() => toDataFunction(entry.data), [entry.data])

		return {...entry, t}
	}

	const useLocale = (
		options?: readonly string[] | Pick<UseTranslationOptions<T, D>, "tags">
	) => {
		const {tags} = isTags(options) ? {tags: options} : (options ?? {})
		const context = useContext(TranslationContext)
		const store =
			context?.store ??
			(typeof window === "undefined" ? undefined : clientStore)
		const contextTags = context?.tags
		const resolvedTags = useMemo(
			() => resolveTags(tags, contextTags),
			[contextTags, tags]
		)
		const key = useMemo(() => keyFor(resolvedTags), [resolvedTags])
		const fallbackLocale = useMemo(
			() => ({
				current: languages[0].tag,
				target: matchTag(languages, resolvedTags)
			}),
			[resolvedTags]
		)
		const serverTags = tags ?? contextTags ?? []
		const serverFallbackLocale = useMemo(
			() => ({
				current: languages[0].tag,
				target: matchTag(languages, serverTags)
			}),
			[serverTags]
		)
		const getSnapshot = useCallback(
			() => store?.cache.get(key)?.locale ?? fallbackLocale,
			[fallbackLocale, key, store]
		)
		const getServerSnapshot = useCallback(
			() =>
				context?.initialKey === key && context.initial
					? context.initial.locale
					: serverFallbackLocale,
			[context, key, serverFallbackLocale]
		)
		const subscribeToStore = useCallback(
			(listener: () => void) =>
				store ? subscribe(store, listener) : () => undefined,
			[store]
		)

		return useSyncExternalStore(
			subscribeToStore,
			getSnapshot,
			getServerSnapshot
		)
	}

	const TranslationProvider = ({
		tags,
		initial,
		children
	}: TranslationProviderProps<T, D>) => {
		const store = useMemo(
			() => (typeof window === "undefined" ? createStore() : clientStore),
			[]
		)
		const value = tags ?? (initial ? [initial.locale.target] : undefined)
		const initialKey = initial && value ? keyFor(value) : undefined
		const context = {tags: value, initial, initialKey, store}

		if (initial && value) store.cache.set(keyFor(value), initial)

		return createElement(
			TranslationContext.Provider,
			{value: context},
			children
		)
	}

	return {TranslationProvider, useTranslation, useLocale, preload, match}
}
