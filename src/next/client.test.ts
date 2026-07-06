import {createElement} from "react"
import {renderToString} from "react-dom/server"
import {describe, expect, test, vi} from "vitest"
import {create} from "./client"

vi.mock("next/navigation", () => ({useRouter: vi.fn()}))

const en = {tag: "en-US", data: {greeting: "Hello"}}
const zh = {tag: "zh-CN", data: async () => ({greeting: "你好"})}

describe("next/client", () => {
	test("always suspends translations instead of rendering fallback text", () => {
		const {TranslationProvider, useTranslation} = create([en, zh])

		const html = renderToString(
			createElement(
				TranslationProvider,
				{tags: ["zh-CN"]},
				createElement(function Login() {
					const {t} = useTranslation({suspense: false} as never)

					return createElement("p", null, t.greeting)
				})
			)
		)

		expect(html).not.toContain("Hello")
	})
})
