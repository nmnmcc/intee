"use client"

import {useTransition} from "react"
import {useSetLocale, useTranslation} from "./i18n/client"

const locales = ["en-US", "zh-CN", "ja-JP"] as const

export function LocaleSwitcher() {
	const {t, locale} = useTranslation({suspense: true})
	const setLocale = useSetLocale()
	const [pending, startTransition] = useTransition()

	return (
		<label style={{display: "grid", gap: 6, maxWidth: 220}}>
			<span>{t.switchLocale}</span>
			<select
				disabled={pending}
				value={locale.target}
				onChange={event => {
					startTransition(() => {
						setLocale(event.currentTarget.value)
					})
				}}>
				{locales.map(locale => (
					<option key={locale} value={locale}>
						{locale}
					</option>
				))}
			</select>
		</label>
	)
}
