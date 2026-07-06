import {Suspense} from "react"
import {LocaleSwitcher} from "./LocaleSwitcher"
import {getTranslation} from "./i18n/server"

export default async function Page() {
	const {t, locale} = await getTranslation()

	return (
		<main
			style={{
				fontFamily: "sans-serif",
				margin: "60px auto",
				maxWidth: 560,
				padding: "0 16px"
			}}>
			<p style={{color: "#666", marginBottom: 8}}>{locale.current}</p>
			<h1>{t.greeting}</h1>
			<p>{t.description}</p>
			<p>{t.welcome("Alice")}</p>
			<p>{t("itemCount")(3)}</p>
			<Suspense fallback={null}>
				<LocaleSwitcher />
			</Suspense>
		</main>
	)
}
