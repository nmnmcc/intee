import {createElement} from "react"
import {renderToString} from "react-dom/server"
import {describe, expect, test} from "vitest"
import {create} from "./client"

const en = {tag: "en-US", data: {greeting: "Hello"}}
const zh = {tag: "zh-CN", data: async () => ({greeting: "你好"})}

describe("react/client", () => {
	test("keeps the hydration snapshot on fallback when initial is absent", async () => {
		const {TranslationProvider, preload, useTranslation} = create([en, zh])

		await preload(["zh-CN"])

		const html = renderToString(
			createElement(
				TranslationProvider,
				{tags: ["zh-CN"]},
				createElement(function Login() {
					const {t, locale} = useTranslation()

					return createElement(
						"p",
						null,
						`${locale.current}/${locale.target}:${t.greeting}`
					)
				})
			)
		)

		expect(html).toContain("en-US/zh-CN:Hello")
	})

	test("uses provider initial data for the hydration snapshot", async () => {
		const {TranslationProvider, useTranslation} = create([en, zh])

		const html = renderToString(
			createElement(
				TranslationProvider,
				{
					tags: ["zh-CN"],
					initial: {
						data: {greeting: "你好"},
						locale: {current: "zh-CN", target: "zh-CN"}
					}
				},
				createElement(function Login() {
					const {t, locale} = useTranslation()

					return createElement(
						"p",
						null,
						`${locale.current}/${locale.target}:${t.greeting}`
					)
				})
			)
		)

		expect(html).toContain("zh-CN/zh-CN:你好")
	})
})
