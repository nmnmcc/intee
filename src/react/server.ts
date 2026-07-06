import {
	create as _create,
	type Data,
	type Languages,
	type Translation,
	type TranslationResult
} from ".."
import {toDataFunction} from "../translation"

export type ServerCreateResult<T extends string, D extends Data> = {
	readonly getTranslation: (
		tags: readonly string[]
	) => Promise<TranslationResult<T, D>>
	readonly match: ReturnType<typeof _create<T, D>>
}

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>
): ServerCreateResult<T, D> => {
	const match = _create(languages)

	const getTranslation = async (tags: readonly string[]) => {
		const result = match([...tags])
		const data = await result
		const translation: Translation<T, D> = {
			data,
			locale: {
				current: result.locale.target,
				target: result.locale.target
			}
		}

		return {...translation, t: toDataFunction(data)}
	}

	return {getTranslation, match}
}
