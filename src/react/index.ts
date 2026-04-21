import {useCallback, useMemo, useSyncExternalStore} from "react"
import {create as _create, type Data, type Languages} from ".."
import {type FromLeaves, type Leaves} from "../utils"

type Entry<T extends string, D extends Data> = {
	readonly data: D
	readonly tag: T
}

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>
) => {
	const match = _create(languages)
	const fallback: Entry<T, D> = {
		data: languages[0].data,
		tag: languages[0].tag
	}

	const cache = new Map<string, Entry<T, D>>()
	const pending = new Set<string>()
	const listeners = new Set<() => void>()

	const subscribe = (listener: () => void) => {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}

	const getServerSnapshot = () => fallback

	const load = (key: string, tags: string[]) => {
		if (cache.has(key) || pending.has(key)) return
		pending.add(key)
		const result = match(tags)
		result.then(
			data => {
				pending.delete(key)
				cache.set(key, {data, tag: result.tag})
				for (const listener of listeners) listener()
			},
			() => {
				pending.delete(key)
			}
		)
	}

	return {
		useTranslation: (tags?: string[]) => {
			const _tags = useMemo(
				() =>
					tags ??
					(typeof navigator !== "undefined"
						? [...navigator.languages]
						: []),
				[tags]
			)
			const key = useMemo(() => JSON.stringify(_tags), [_tags])

			load(key, _tags)

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
		},
		match
	}
}

export type DataFunction<D extends Data, N = never> = {
	<L extends Leaves<D, N>>(leaves: L): FromLeaves<D, L, N>
} & D

export const toDataFunction = <D extends Data>(data: D): DataFunction<D> => {
	const translation = (leaves: Leaves<D>) => {
		let value: unknown = data

		for (const key of leaves.split(".")) {
			value = (value as Record<string, unknown>)[key]
		}

		return value
	}

	return Object.assign(translation, data) as DataFunction<D>
}
