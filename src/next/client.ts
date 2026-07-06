"use client"

import {Suspense, createElement, useCallback} from "react"
import {useRouter} from "next/navigation"
import {
	create as createReactClient,
	type ClientCreateResult,
	type UseTranslationOptions
} from "../react/client"
import {type Data, type Languages, type TranslationResult} from ".."

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

export type NextClientCreateResult<T extends string, D extends Data> = Omit<
	ClientCreateResult<T, D>,
	"TranslationProvider" | "useTranslation"
> & {
	readonly TranslationProvider: ClientCreateResult<
		T,
		D
	>["TranslationProvider"]
	readonly useTranslation: (
		options?: readonly string[] | NextUseTranslationOptions<T, D>
	) => TranslationResult<T, D>
	readonly useSetLocale: () => (locale?: string | null) => void
}

const defaultCookieName = "NEXT_LOCALE"
const defaultCookieMaxAge = 60 * 60 * 24 * 365
const defaultCookiePath = "/"

export const create = <const T extends string, const D extends Data>(
	languages: Languages<T, D>,
	options: NextClientCreateOptions = {}
): NextClientCreateResult<T, D> => {
	const react = createReactClient(languages)
	const cookieName = options.cookieName ?? defaultCookieName

	const TranslationProvider: ClientCreateResult<
		T,
		D
	>["TranslationProvider"] = ({children, ...props}) =>
		createElement(
			react.TranslationProvider,
			props,
			createElement(Suspense, {fallback: null}, children)
		)

	const useTranslation = (
		hookOptions?: readonly string[] | NextUseTranslationOptions<T, D>
	) =>
		react.useTranslation(
			Array.isArray(hookOptions)
				? {tags: hookOptions, suspense: true}
				: {...hookOptions, suspense: true}
		)

	const useSetLocale = () => {
		const router = useRouter()

		return useCallback(
			(locale?: string | null) => {
				if (cookieName !== false) {
					document.cookie = serializeCookie(
						cookieName,
						locale,
						options
					)
				}

				if (locale) void react.preload([locale])
				router.refresh()
			},
			[router]
		)
	}

	return {...react, TranslationProvider, useTranslation, useSetLocale}
}

const serializeCookie = (
	name: string,
	value: string | null | undefined,
	options: NextClientCreateOptions
) => {
	const parts = [
		`${encodeURIComponent(name)}=${encodeURIComponent(value ?? "")}`,
		`Path=${options.cookiePath ?? defaultCookiePath}`,
		`Max-Age=${value ? (options.cookieMaxAge ?? defaultCookieMaxAge) : 0}`,
		`SameSite=${options.cookieSameSite ?? "lax"}`
	]

	if (options.cookieSecure) parts.push("Secure")

	return parts.join("; ")
}
