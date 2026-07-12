import type {Metadata} from "next"
import {getTranslation} from "./i18n/server"

export const metadata: Metadata = {title: "404"}

export default async function NotFound() {
	const {t} = await getTranslation()

	return (
		<main
			style={{
				fontFamily: "sans-serif",
				margin: "60px auto",
				maxWidth: 560,
				padding: "0 16px"
			}}>
			<h1>404</h1>
			<p>{t.farewell}</p>
		</main>
	)
}
