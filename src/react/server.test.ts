import {describe, expect, test} from "vitest"
import {create} from "./server"

const en = {
	tag: "en-US",
	data: {greeting: "Hello", welcome: (name: string) => `Hello, ${name}`}
} as const
const zh = {
	tag: "zh-CN",
	data: async () => ({
		greeting: "你好",
		welcome: (name: string) => `你好，${name}`
	})
} as const

describe("react/server", () => {
	test("returns a data function and matched tag", async () => {
		const {getTranslation} = create([en, zh])
		const {t, locale} = await getTranslation(["zh-CN"])

		expect(locale).toEqual({current: "zh-CN", target: "zh-CN"})
		expect(t.greeting).toBe("你好")
		expect(t("welcome")("Ada")).toBe("你好，Ada")
	})
})
