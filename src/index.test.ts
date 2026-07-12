import {describe, expect, test} from "vitest"
import {create} from "./index"

const en = {tag: "en-US", data: {greeting: "Hello"}}
const zh = {tag: "zh-CN", data: async () => ({greeting: "你好"})}

describe("create", () => {
	test("exposes current and target locale before and after loading", async () => {
		const match = create([en, zh])
		const result = match(["zh-CN"])

		expect(result.locale).toEqual({current: "en-US", target: "zh-CN"})
		expect(result.tag).toBe("zh-CN")
		expect(result.fallback.greeting).toBe("Hello")
		expect(await result).toEqual({greeting: "你好"})
	})

	test("ignores invalid locale tags", async () => {
		const match = create([en, zh])
		const result = match(["en_US", "zh-cn"])

		expect(result.locale).toEqual({current: "en-US", target: "zh-CN"})
		expect(await result).toEqual({greeting: "你好"})
	})
})
