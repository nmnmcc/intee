import {cookies, headers} from "next/headers"
import {create as _create, type Data, type Languages} from ".."
import {parseAcceptLanguage} from "../locale"
import {toDataFunction, type DataFunction} from "../translation"

export type NextCreateOptions = {
	readonly cookieName?: string | false
}

export type NextCreateResult<T extends string, D extends Data> = {
	readonly getTranslation: (
		tags?: readonly string[]
	) => Promise<readonly [DataFunction<D>, T]>
	readonly getLocaleTags: () => Promise<string[]>
	readonly match: ReturnType<typeof _create<T, D>>
}

const defaultCookieName = "NEXT_LOCALE"

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	options: NextCreateOptions = {}
): NextCreateResult<T, D> => {
	const match = _create(languages)
	const cookieName = options.cookieName ?? defaultCookieName

	const getLocaleTags = async () => {
		const [cookieStore, headersList] = await Promise.all([
			cookieName === false ? Promise.resolve(undefined) : cookies(),
			headers()
		])
		const cookieLocale =
			cookieName === false ? undefined : cookieStore?.get(cookieName)?.value
		const headerLocales = parseAcceptLanguage(
			headersList.get("accept-language")
		)

		return [cookieLocale, ...headerLocales].filter(
			(locale, index, locales): locale is string =>
				Boolean(locale) && locales.indexOf(locale) === index
		)
	}

	const getTranslation = async (tags?: readonly string[]) => {
		const result = match([...(tags ?? (await getLocaleTags()))])
		const data = await result
		return [toDataFunction(data), result.tag] as const
	}

	return {getTranslation, getLocaleTags, match}
}
