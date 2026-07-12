type WeightedLanguage = {
	readonly tag: string
	readonly quality: number
	readonly index: number
}

export const parseAcceptLanguage = (header?: string | null): string[] => {
	if (!header) return []

	return header
		.split(",")
		.map((part, index): WeightedLanguage | undefined => {
			const [rawTag, ...parameters] = part.trim().split(";")
			const tag = normalizeLanguageTag(rawTag)
			if (!tag) return undefined

			const quality = parameters.reduce((result, parameter) => {
				const [name, value] = parameter.trim().split("=")
				if (name !== "q") return result

				const next = Number(value)
				return Number.isFinite(next)
					? Math.min(Math.max(next, 0), 1)
					: result
			}, 1)

			if (quality <= 0) return undefined

			return {tag, quality, index}
		})
		.filter((language): language is WeightedLanguage => Boolean(language))
		.sort((a, b) => b.quality - a.quality || a.index - b.index)
		.map(({tag}) => tag)
		.filter((tag, index, tags) => tags.indexOf(tag) === index)
}

export const normalizeLanguageTag = (tag?: string | null) => {
	if (!tag) return undefined

	const trimmed = tag.trim()
	if (!trimmed || trimmed === "*") return undefined

	try {
		return Intl.getCanonicalLocales(trimmed)[0]
	} catch {
		return undefined
	}
}
