import {TranslationProvider} from "./i18n/client"
import {getLocaleTags, getTranslation} from "./i18n/server"

export default async function RootLayout({
	children
}: Readonly<{children: React.ReactNode}>) {
	const tags = await getLocaleTags()
	const [, tag] = await getTranslation(tags)

	return (
		<html lang={tag}>
			<body>
				<TranslationProvider tags={tags}>{children}</TranslationProvider>
			</body>
		</html>
	)
}
