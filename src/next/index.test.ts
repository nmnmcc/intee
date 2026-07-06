import {beforeEach, describe, expect, test, vi} from "vitest"
import {cookies, headers} from "next/headers"
import {create} from "./index"

vi.mock("next/headers", () => ({cookies: vi.fn(), headers: vi.fn()}))

const en = {tag: "en-US", data: {greeting: "Hello"}}
const zh = {tag: "zh-CN", data: {greeting: "你好"}}
const ja = {tag: "ja-JP", data: {greeting: "こんにちは"}}

describe("next", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test("prefers locale cookie before accept-language", async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: (name: string) =>
				name === "NEXT_LOCALE" ? {value: "ja-JP"} : undefined
		} as Awaited<ReturnType<typeof cookies>>)
		vi.mocked(headers).mockResolvedValue({
			get: (name: string) =>
				name === "accept-language" ? "zh-CN;q=0.9,en-US;q=0.8" : null
		} as Awaited<ReturnType<typeof headers>>)

		const {getLocaleTags, getTranslation} = create([en, zh, ja])

		expect(await getLocaleTags()).toEqual(["ja-JP", "zh-CN", "en-US"])

		const {t, locale} = await getTranslation()
		expect(locale).toEqual({current: "ja-JP", target: "ja-JP"})
		expect(t.greeting).toBe("こんにちは")
	})

	test("can disable cookie lookup", async () => {
		vi.mocked(headers).mockResolvedValue({
			get: (name: string) =>
				name === "accept-language" ? "zh-CN,en-US;q=0.8" : null
		} as Awaited<ReturnType<typeof headers>>)

		const {getLocaleTags} = create([en, zh, ja], {cookieName: false})

		expect(await getLocaleTags()).toEqual(["zh-CN", "en-US"])
		expect(cookies).not.toHaveBeenCalled()
	})
})
