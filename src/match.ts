import {match as _match} from "@formatjs/intl-localematcher"
import {type Data, type Languages} from "./index"
import {normalizeLanguageTag} from "./locale"

export const matchTag = <const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	tags: readonly string[]
): T => {
	const normalizedTags = tags
		.map(normalizeLanguageTag)
		.filter((tag): tag is string => Boolean(tag))

	return _match(
		normalizedTags,
		languages.map(l => l.tag),
		languages[0].tag,
		{algorithm: "best fit"}
	) as T
}
