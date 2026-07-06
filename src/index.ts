import {matchTag} from "./match"
import {type DataFunction} from "./translation"
export {parseAcceptLanguage} from "./locale"

export type Data = {[K in string]: any}

export interface Language<
	T extends string,
	D extends Data,
	L extends boolean = true
> {
	readonly tag: T
	readonly data: L extends false ? D : D | (() => Promise<D>) | (() => D)
}

export type Languages<T extends string, D extends Data> = readonly [
	Language<T, D, false>,
	...(readonly Language<T, NoInfer<D>>[])
]

export type Locale<T extends string> = {readonly current: T; readonly target: T}

export type Translation<T extends string, D extends Data> = {
	readonly data: D
	readonly locale: Locale<T>
}

export type TranslationResult<T extends string, D extends Data> = Translation<
	T,
	D
> & {readonly t: DataFunction<D>}

export const create =
	<const T extends string, const D extends Data>(
		languages: Languages<T, D>
	) =>
	(tags: string[]): DataPromise<T, D> => {
		const fallback = languages[0]
		const target = matchTag(languages, tags)
		const locale = {current: fallback.tag, target} as const

		const {data} = languages.find(({tag}) => tag === target)!

		return new DataPromise(locale, fallback.data, (resolve, reject) => {
			try {
				if (data instanceof Function) {
					resolve(data())
				} else {
					resolve(data)
				}
			} catch (e) {
				reject(e)
			}
		})
	}

export class DataPromise<T extends string, F extends Data> extends Promise<F> {
	static override get [Symbol.species]() {
		return Promise
	}

	get tag() {
		return this.locale.target
	}

	constructor(
		public readonly locale: Locale<T>,
		public readonly fallback: F,
		executor: (
			resolve: (value: F | PromiseLike<F>) => void,
			reject: (reason?: any) => void
		) => void
	) {
		super(executor)
	}
}
