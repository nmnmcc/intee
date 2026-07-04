import {match as _match} from "@formatjs/intl-localematcher"
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

export const create =
	<const T extends string, const D extends Data>(
		languages: Languages<T, D>
	) =>
	(tags: string[]): DataPromise<T, D> => {
		const fallback = languages[0]

		const result = _match(
			tags,
			languages.map(l => l.tag),
			languages[0].tag,
			{algorithm: "best fit"}
		) as T

		const {data} = languages.find(({tag}) => tag === result)!

		return new DataPromise(result, fallback.data, (resolve, reject) => {
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

	constructor(
		public readonly tag: T,
		public readonly fallback: F,
		executor: (
			resolve: (value: F | PromiseLike<F>) => void,
			reject: (reason?: any) => void
		) => void
	) {
		super(executor)
	}
}
