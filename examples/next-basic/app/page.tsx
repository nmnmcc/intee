import {LocaleSwitcher} from "./LocaleSwitcher"
import {getTranslation} from "./i18n/server"

export default async function Page() {
	const [t, tag] = await getTranslation()

	return (
		<main
			style={{
				fontFamily: "sans-serif",
				margin: "60px auto",
				maxWidth: 560,
				padding: "0 16px"
			}}>
			<p style={{color: "#666", marginBottom: 8}}>{tag}</p>
			<h1>{t.greeting}</h1>
			<p>{t.description}</p>
			<p>{t.welcome("Alice")}</p>
			<p>{t("itemCount")(3)}</p>
			<LocaleSwitcher />
		</main>
	)
}
