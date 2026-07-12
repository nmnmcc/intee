import {createElement} from "react"
import {renderToReadableStream} from "react-dom/server"
import {useRouter} from "next/navigation"
import {afterEach, beforeEach, describe, expect, test, vi} from "vitest"
import {create, type NextClientCreateOptions} from "./client"

vi.mock("next/navigation", () => ({useRouter: vi.fn()}))

const en = {tag: "en-US", data: {greeting: "Hello"}}
const zh = {tag: "zh-CN", data: async () => ({greeting: "你好"})}

describe("next/client", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	test("does not expose a locale setter when cookie persistence is disabled", () => {
		const options: NextClientCreateOptions = {cookieName: false}
		const client = create([en, zh], options)
		const disabled = create([en, zh], {cookieName: false})

		expect(client).not.toHaveProperty("useSetLocale")
		expect(
			// @ts-expect-error `cookieName: false` has no client locale setter.
			disabled.useSetLocale
		).toBeUndefined()
	})

	test("normalizes a locale preference before persisting it", async () => {
		const refresh = vi.fn()
		vi.mocked(useRouter).mockReturnValue({refresh} as unknown as ReturnType<
			typeof useRouter
		>)
		vi.stubGlobal("document", {cookie: ""})
		vi.stubGlobal("location", {protocol: "https:"})
		const {useSetLocale} = create([en, zh])
		let setLocale: (locale?: string | null) => void = () => undefined

		const stream = await renderToReadableStream(
			createElement(function Locale() {
				setLocale = useSetLocale()
				return null
			})
		)
		await stream.allReady
		await new Response(stream).text()

		setLocale("zh-cn")

		expect(document.cookie).toBe(
			"NEXT_LOCALE=zh-CN; Path=/; Max-Age=31536000; SameSite=lax; Secure"
		)
		expect(refresh).toHaveBeenCalledOnce()
	})

	test("ignores an invalid locale preference", async () => {
		const refresh = vi.fn()
		vi.mocked(useRouter).mockReturnValue({refresh} as unknown as ReturnType<
			typeof useRouter
		>)
		vi.stubGlobal("document", {cookie: ""})
		const {useSetLocale} = create([en, zh])
		let setLocale: (locale?: string | null) => void = () => undefined

		const stream = await renderToReadableStream(
			createElement(function Locale() {
				setLocale = useSetLocale()
				return null
			})
		)
		await stream.allReady
		await new Response(stream).text()

		setLocale("zh_CN")

		expect(document.cookie).toBe("")
		expect(refresh).not.toHaveBeenCalled()
	})

	test("downgrades SameSite=None without a secure cookie", async () => {
		const refresh = vi.fn()
		vi.mocked(useRouter).mockReturnValue({refresh} as unknown as ReturnType<
			typeof useRouter
		>)
		vi.stubGlobal("document", {cookie: ""})
		vi.stubGlobal("location", {protocol: "http:"})
		const {useSetLocale} = create([en, zh], {
			cookieSameSite: "none",
			cookieSecure: false
		})
		let setLocale: (locale?: string | null) => void = () => undefined

		const stream = await renderToReadableStream(
			createElement(function Locale() {
				setLocale = useSetLocale()
				return null
			})
		)
		await stream.allReady
		await new Response(stream).text()

		setLocale("zh-CN")

		expect(document.cookie).toBe(
			"NEXT_LOCALE=zh-CN; Path=/; Max-Age=31536000; SameSite=lax"
		)
	})

	test("streams the resolved target translation instead of fallback text", async () => {
		const {TranslationProvider, useTranslation} = create([en, zh])

		const stream = await renderToReadableStream(
			createElement(
				TranslationProvider,
				{tags: ["zh-CN"]},
				createElement(function Login() {
					const {t, locale} = useTranslation({
						suspense: false
					} as never)

					return createElement(
						"p",
						null,
						`${locale.current}/${locale.target}:${t.greeting}`
					)
				})
			)
		)
		await stream.allReady
		const html = await new Response(stream).text()

		expect(html).toContain("zh-CN/zh-CN:你好")
		expect(html).not.toContain("en-US/zh-CN:Hello")
	})

	test("suspends useLocale until the target language is resolved", async () => {
		const {TranslationProvider, useLocale} = create([en, zh])

		const stream = await renderToReadableStream(
			createElement(
				TranslationProvider,
				{tags: ["zh-CN"]},
				createElement(function Locale() {
					const locale = useLocale()

					return createElement(
						"p",
						null,
						`${locale.current}/${locale.target}`
					)
				})
			)
		)
		await stream.allReady
		const html = await new Response(stream).text()

		expect(html).toContain("zh-CN/zh-CN")
		expect(html).not.toContain("en-US/zh-CN")
	})
})
