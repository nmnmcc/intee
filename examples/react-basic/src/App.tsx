import {useState} from "react"
import {useTranslation} from "./i18n"

const LOCALES = ["en-US", "zh-CN", "ja-JP"] as const

export default function App() {
	const [locale, setLocale] = useState<string | undefined>(undefined)
	const {t} = useTranslation(locale ? [locale] : undefined)

	return (
		<div
			style={{
				fontFamily: "sans-serif",
				maxWidth: 480,
				margin: "60px auto",
				padding: "0 16px"
			}}>
			<h1>intee React example</h1>
			<label>
				{t.switchLocale}{" "}
				<select
					value={locale ?? ""}
					onChange={e => setLocale(e.target.value || undefined)}>
					<option value="">Auto (browser)</option>
					{LOCALES.map(l => (
						<option key={l} value={l}>
							{l}
						</option>
					))}
				</select>
			</label>
			<div
				style={{
					background: "#f4f4f4",
					borderRadius: 6,
					padding: 20,
					marginTop: 16
				}}>
				<p>
					<strong>{t.greeting}</strong>
				</p>
				<p>{t.description}</p>
				<p>{t.welcome("Alice")}</p>
				<p>{t("itemCount")(3)}</p>
				<p>{t("farewell")}</p>
				<p>
					Items: {t.items.apple}, {t.items.banana}, {t.items.cherry}
				</p>
			</div>
		</div>
	)
}
