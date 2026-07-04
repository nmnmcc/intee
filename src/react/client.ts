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
import {create as _create, type Data, type Languages} from ".."
import {toDataFunction, type DataFunction} from "../translation"

type Entry<T extends string, D extends Data> = {
	readonly data: D
	readonly tag: T
}

export type TranslationProviderProps = {
	readonly tags?: readonly string[]
	readonly children?: ReactNode
}

export type ClientCreateResult<T extends string, D extends Data> = {
	readonly TranslationProvider: (props: TranslationProviderProps) => ReactNode
	readonly useTranslation: (
		tags?: readonly string[]
	) => readonly [DataFunction<D>, T]
	readonly useLocale: (tags?: readonly string[]) => T
	readonly preload: (tags?: readonly string[]) => Promise<readonly [D, T]>
	readonly match: ReturnType<typeof _create<T, D>>
}

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>
): ClientCreateResult<T, D> => {
	const match = _create(languages)
	const fallback: Entry<T, D> = {
		data: languages[0].data,
		tag: languages[0].tag
	}

	const TranslationContext = createContext<readonly string[] | undefined>(
		undefined
	)
	const cache = new Map<string, Entry<T, D>>()
	const pending = new Map<string, Promise<Entry<T, D>>>()
	const listeners = new Set<() => void>()

	const subscribe = (listener: () => void) => {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}

	const getServerSnapshot = () => fallback

	const load = (key: string, tags: readonly string[]) => {
		const cached = cache.get(key)
		if (cached) return Promise.resolve(cached)

		const active = pending.get(key)
		if (active) return active

		const result = match([...tags])
		const promise = result.then(
			data => {
				const entry = {data, tag: result.tag}
				pending.delete(key)
				cache.set(key, entry)
				for (const listener of listeners) listener()
				return entry
			},
			() => {
				pending.delete(key)
				cache.set(key, fallback)
				for (const listener of listeners) listener()
				return fallback
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

	const preload = async (tags?: readonly string[]) => {
		const resolvedTags = resolveTags(tags)
		const entry = await load(JSON.stringify(resolvedTags), resolvedTags)
		return [entry.data, entry.tag] as const
	}

	const useTranslation = (tags?: readonly string[]) => {
		const contextTags = useContext(TranslationContext)
		const resolvedTags = useMemo(
			() => resolveTags(tags, contextTags),
			[contextTags, tags]
		)
		const key = useMemo(() => JSON.stringify(resolvedTags), [resolvedTags])

		void load(key, resolvedTags)

		const getSnapshot = useCallback(
			() => cache.get(key) ?? fallback,
			[key]
		)
		const entry = useSyncExternalStore(
			subscribe,
			getSnapshot,
			getServerSnapshot
		)
		const df = useMemo(() => toDataFunction(entry.data), [entry.data])

		return [df, entry.tag] as const
	}

	const useLocale = (tags?: readonly string[]) => {
		const [, tag] = useTranslation(tags)
		return tag
	}

	const TranslationProvider = ({
		tags,
		children
	}: TranslationProviderProps) =>
		createElement(TranslationContext.Provider, {value: tags}, children)

	return {TranslationProvider, useTranslation, useLocale, preload, match}
}
