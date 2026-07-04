import {create as _create, type Data, type Languages} from ".."
import {toDataFunction, type DataFunction} from "../translation"

export type ServerCreateResult<T extends string, D extends Data> = {
	readonly getTranslation: (
		tags: readonly string[]
	) => Promise<readonly [DataFunction<D>, T]>
	readonly match: ReturnType<typeof _create<T, D>>
}

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>
): ServerCreateResult<T, D> => {
	const match = _create(languages)

	const getTranslation = async (tags: readonly string[]) => {
		const result = match([...tags])
		const data = await result
		return [toDataFunction(data), result.tag] as const
	}

	return {getTranslation, match}
}
