import {createElement} from "react"
import {renderToReadableStream, renderToString} from "react-dom/server"
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

	test("keeps server translation stores isolated between renders", async () => {
		const {TranslationProvider, useTranslation} = create([
			en,
			{tag: "zh-CN", data: async () => ({greeting: "loader-value"})}
		])
		const render = async (initial?: {
			readonly data: {readonly greeting: string}
			readonly locale: {
				readonly current: "zh-CN"
				readonly target: "zh-CN"
			}
		}) => {
			const providerProps = initial
				? {tags: ["zh-CN"], initial}
				: {tags: ["zh-CN"]}
			const stream = await renderToReadableStream(
				createElement(
					TranslationProvider,
					providerProps,
					createElement(function Login() {
						const {t} = useTranslation({suspense: true})

						return createElement("p", null, t.greeting)
					})
				)
			)
			await stream.allReady
			return new Response(stream).text()
		}

		expect(
			await render({
				data: {greeting: "request-A-only"},
				locale: {current: "zh-CN", target: "zh-CN"}
			})
		).toContain("request-A-only")
		expect(await render()).toContain("loader-value")
	})
})
