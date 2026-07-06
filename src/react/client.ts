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

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>
): ClientCreateResult<T, D> => {
	const match = _create(languages)
	const fallback: Translation<T, D> = {
		data: languages[0].data,
		locale: {current: languages[0].tag, target: languages[0].tag}
	}

	const TagsContext = createContext<readonly string[] | undefined>(undefined)
	const cache = new Map<string, Translation<T, D>>()
	const pending = new Map<string, Promise<Translation<T, D>>>()
	const listeners = new Set<() => void>()

	const subscribe = (listener: () => void) => {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}

	const fallbackFor = (tags: readonly string[]): Translation<T, D> => ({
		data: fallback.data,
		locale: {
			current: fallback.locale.current,
			target: matchTag(languages, tags)
		}
	})

	const load = (key: string, tags: readonly string[]) => {
		const cached = cache.get(key)
		if (cached) return Promise.resolve(cached)

		const active = pending.get(key)
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
				pending.delete(key)
				cache.set(key, entry)
				for (const listener of listeners) listener()
				return entry
			},
			() => {
				const entry = fallbackFor(tags)
				pending.delete(key)
				cache.set(key, entry)
				for (const listener of listeners) listener()
				return entry
			}
		)

		pending.set(key, promise)
		return promise
	}

	const resolveTags = (
		tags: readonly string[] | undefined,
		contextTags?: readonly string[]
	) =>
		tags ??
		contextTags ??
		(typeof navigator !== "undefined" ? [...navigator.languages] : [])

	const normalizeOptions = (
		options?: readonly string[] | UseTranslationOptions<T, D>
	) => (Array.isArray(options) ? {tags: options} : (options ?? {}))

	const keyFor = (tags: readonly string[]) => JSON.stringify(tags)

	const writeInitial = (
		key: string,
		initial: Translation<T, D> | undefined
	) => {
		if (initial && !cache.has(key)) cache.set(key, initial)
	}

	const preload = async (tags?: readonly string[]) => {
		const resolvedTags = resolveTags(tags)
		const entry = await load(keyFor(resolvedTags), resolvedTags)
		return entry
	}

	const useTranslation = (
		options?: readonly string[] | UseTranslationOptions<T, D>
	) => {
		const {tags, initial, suspense = false} = normalizeOptions(options)
		const contextTags = useContext(TagsContext)
		const resolvedTags = useMemo(
			() => resolveTags(tags, contextTags),
			[contextTags, tags]
		)
		const key = useMemo(() => keyFor(resolvedTags), [resolvedTags])
		const fallbackEntry = useMemo(
			() => fallbackFor(resolvedTags),
			[resolvedTags]
		)

		writeInitial(key, initial)

		if (suspense && !cache.has(key)) throw load(key, resolvedTags)
		if (!suspense) void load(key, resolvedTags)

		const getSnapshot = useCallback(
			() => cache.get(key) ?? fallbackEntry,
			[fallbackEntry, key]
		)
		const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
		const t = useMemo(() => toDataFunction(entry.data), [entry.data])

		return {...entry, t}
	}

	const useLocale = (
		options?: readonly string[] | Pick<UseTranslationOptions<T, D>, "tags">
	) => {
		const {tags} = Array.isArray(options)
			? {tags: options}
			: (options ?? {})
		const contextTags = useContext(TagsContext)
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
		const getSnapshot = useCallback(
			() => cache.get(key)?.locale ?? fallbackLocale,
			[fallbackLocale, key]
		)

		return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
	}

	const TranslationProvider = ({
		tags,
		initial,
		children
	}: TranslationProviderProps<T, D>) => {
		const value = tags ?? (initial ? [initial.locale.target] : undefined)

		if (initial && value) cache.set(keyFor(value), initial)

		return createElement(TagsContext.Provider, {value}, children)
	}

	return {TranslationProvider, useTranslation, useLocale, preload, match}
}
