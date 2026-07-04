import {describe, expect, test} from "vitest"
import {toDataFunction} from "./translation"

describe("toDataFunction", () => {
	test("supports object and leaf-path access", () => {
		const t = toDataFunction({
			greeting: "Hello",
			items: {apple: "Apple"},
			welcome: (name: string) => `Hello, ${name}`
		})

		expect(t.greeting).toBe("Hello")
		expect(t.items.apple).toBe("Apple")
		expect(t("items.apple")).toBe("Apple")
		expect(t("welcome")("Ada")).toBe("Hello, Ada")
	})
})
