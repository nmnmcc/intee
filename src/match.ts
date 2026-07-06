import {match as _match} from "@formatjs/intl-localematcher"
import {type Data, type Languages} from "./index"

export const matchTag = <const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	tags: readonly string[]
): T =>
	_match(
		tags,
		languages.map(l => l.tag),
		languages[0].tag,
		{algorithm: "best fit"}
	) as T
