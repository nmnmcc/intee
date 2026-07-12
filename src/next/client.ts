"use client"

import {
	Suspense,
	createElement,
	type ReactNode,
	startTransition,
	useCallback
} from "react"
import {useRouter} from "next/navigation"
import {
	create as createReactClient,
	type ClientCreateResult,
	type TranslationProviderProps,
	type UseTranslationOptions
} from "../react/client"
import {type Data, type Languages, type TranslationResult} from ".."
import {normalizeLanguageTag} from "../locale"

export type NextClientCreateOptions = {
	readonly cookieName?: string | false
	readonly cookieMaxAge?: number
	readonly cookiePath?: string
	readonly cookieSameSite?: "lax" | "strict" | "none"
	readonly cookieSecure?: boolean
}

export type NextUseTranslationOptions<T extends string, D extends Data> = Omit<
	UseTranslationOptions<T, D>,
	"suspense"
> & {readonly suspense?: true}

export type NextTranslationProviderProps<
	T extends string = string,
	D extends Data = Data
> = TranslationProviderProps<T, D> & {readonly fallback?: ReactNode}

type NextClientCreateResultBase<T extends string, D extends Data> = Omit<
	ClientCreateResult<T, D>,
	"TranslationProvider" | "useTranslation" | "useLocale"
> & {
	readonly TranslationProvider: (
		props: NextTranslationProviderProps<T, D>
	) => ReactNode
	readonly useTranslation: (
		options?: readonly string[] | NextUseTranslationOptions<T, D>
	) => TranslationResult<T, D>
	readonly useLocale: ClientCreateResult<T, D>["useLocale"]
}

type NextClientCreateResultWithSetter<
	T extends string,
	D extends Data
> = NextClientCreateResultBase<T, D> & {
	readonly useSetLocale: () => (locale?: string | null) => void
}

export type NextClientCreateResult<
	T extends string,
	D extends Data
> = NextClientCreateResultWithSetter<T, D>

export type NextClientCreateResultWithoutLocaleSetter<
	T extends string,
	D extends Data
> = NextClientCreateResultBase<T, D>

const defaultCookieName = "NEXT_LOCALE"
const defaultCookieMaxAge = 60 * 60 * 24 * 365
const defaultCookiePath = "/"

export function create<const T extends string, const D extends Data>(
	languages: Languages<T, D>
): NextClientCreateResult<T, D>
export function create<const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	options: NextClientCreateOptions & {readonly cookieName: false}
): NextClientCreateResultWithoutLocaleSetter<T, D>
export function create<const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	options: Omit<NextClientCreateOptions, "cookieName"> & {
		readonly cookieName?: string
	}
): NextClientCreateResult<T, D>
export function create<
	const T extends string,
	const D extends Data,
	const O extends NextClientCreateOptions
>(
	languages: Languages<T, D>,
	options: O
): O extends {readonly cookieName: false}
	? NextClientCreateResultWithoutLocaleSetter<T, D>
	: false extends O["cookieName"]
		?
				| NextClientCreateResultWithoutLocaleSetter<T, D>
				| NextClientCreateResult<T, D>
		: NextClientCreateResult<T, D>
export function create<const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	options: NextClientCreateOptions = {}
):
	| NextClientCreateResultWithoutLocaleSetter<T, D>
	| NextClientCreateResult<T, D> {
	const resolvedOptions = options
	const react = createReactClient(languages)
	const cookieName = resolvedOptions.cookieName ?? defaultCookieName

	const TranslationProvider: NextClientCreateResultBase<
		T,
		D
	>["TranslationProvider"] = ({children, fallback = null, ...props}) =>
		createElement(
			react.TranslationProvider,
			props,
			createElement(Suspense, {fallback}, children)
		)

	const useTranslation = (
		hookOptions?: readonly string[] | NextUseTranslationOptions<T, D>
	) =>
		react.useTranslation(
			Array.isArray(hookOptions)
				? {tags: hookOptions, suspense: true}
				: {...hookOptions, suspense: true}
		)

	const useLocale: ClientCreateResult<T, D>["useLocale"] = hookOptions =>
		useTranslation(hookOptions).locale

	const useSetLocale = () => {
		const router = useRouter()

		return useCallback(
			(locale?: string | null) => {
				const target = locale ? normalizeLanguageTag(locale) : locale

				if (locale && !target) return

				if (cookieName !== false) {
					document.cookie = serializeCookie(
						cookieName,
						target,
						resolvedOptions
					)
				}

				if (target) void react.preload([target])
				startTransition(() => {
					router.refresh()
				})
			},
			[cookieName, react, resolvedOptions, router]
		)
	}

	const result: NextClientCreateResultBase<T, D> = {
		...react,
		TranslationProvider,
		useTranslation,
		useLocale
	}

	if (cookieName === false) return result

	return {...result, useSetLocale}
}

const serializeCookie = (
	name: string,
	value: string | null | undefined,
	options: NextClientCreateOptions
) => {
	const secure =
		options.cookieSecure ??
		(typeof location !== "undefined" && location.protocol === "https:")
	const sameSite =
		options.cookieSameSite === "none" && !secure
			? "lax"
			: (options.cookieSameSite ?? "lax")
	const parts = [
		`${encodeURIComponent(name)}=${encodeURIComponent(value ?? "")}`,
		`Path=${options.cookiePath ?? defaultCookiePath}`,
		`Max-Age=${value ? (options.cookieMaxAge ?? defaultCookieMaxAge) : 0}`,
		`SameSite=${sameSite}`
	]

	if (secure) parts.push("Secure")

	return parts.join("; ")
}
