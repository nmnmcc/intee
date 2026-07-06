import {describe, expect, test} from "vitest"
import {create} from "./index"

const en = {tag: "en-US", data: {greeting: "Hello"}} as const
const zh = {tag: "zh-CN", data: async () => ({greeting: "你好"})} as const

describe("create", () => {
	test("exposes current and target locale before and after loading", async () => {
		const match = create([en, zh])
		const result = match(["zh-CN"])

		expect(result.locale).toEqual({current: "en-US", target: "zh-CN"})
		expect(result.tag).toBe("zh-CN")
		expect(result.fallback.greeting).toBe("Hello")
		expect(await result).toEqual({greeting: "你好"})
	})
})
