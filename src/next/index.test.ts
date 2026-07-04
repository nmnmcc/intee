import {beforeEach, describe, expect, test, vi} from "vitest"
import {cookies, headers} from "next/headers"
import {create} from "./index"

vi.mock("next/headers", () => ({
	cookies: vi.fn(),
	headers: vi.fn()
}))

const en = {tag: "en-US", data: {greeting: "Hello"}} as const
const zh = {tag: "zh-CN", data: {greeting: "你好"}} as const
const ja = {tag: "ja-JP", data: {greeting: "こんにちは"}} as const

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
				name === "accept-language"
					? "zh-CN;q=0.9,en-US;q=0.8"
					: null
		} as Awaited<ReturnType<typeof headers>>)

		const {getLocaleTags, getTranslation} = create([en, zh, ja])

		expect(await getLocaleTags()).toEqual(["ja-JP", "zh-CN", "en-US"])

		const [t, tag] = await getTranslation()
		expect(tag).toBe("ja-JP")
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
