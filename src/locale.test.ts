import {describe, expect, test} from "vitest"
import {normalizeLanguageTag, parseAcceptLanguage} from "./locale"

describe("parseAcceptLanguage", () => {
	test("sorts by q value and preserves stable order", () => {
		expect(
			parseAcceptLanguage("en-US,en;q=0.8, zh-CN;q=0.9, ja-JP;q=0.9")
		).toEqual(["en-US", "zh-CN", "ja-JP", "en"])
	})

	test("filters invalid, wildcard, zero-quality, and duplicate tags", () => {
		expect(
			parseAcceptLanguage(
				"*, bogus tag, en-US;q=0, en-us;q=0.8, en-US;q=0.7"
			)
		).toEqual(["en-US"])
	})

	test("returns an empty array for missing headers", () => {
		expect(parseAcceptLanguage()).toEqual([])
		expect(parseAcceptLanguage(null)).toEqual([])
	})

	test("normalizes individual BCP 47 tags", () => {
		expect(normalizeLanguageTag("zh-cn")).toBe("zh-CN")
		expect(normalizeLanguageTag("en_US")).toBeUndefined()
	})
})
