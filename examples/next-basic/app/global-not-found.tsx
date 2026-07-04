import type {Metadata} from "next"

export const metadata: Metadata = {
	title: "404 - Page Not Found"
}

export default function GlobalNotFound() {
	return (
		<html lang="en">
			<body>
				<main
					style={{
						fontFamily: "sans-serif",
						margin: "60px auto",
						maxWidth: 560,
						padding: "0 16px"
					}}>
					<h1>404</h1>
					<p>This page could not be found.</p>
				</main>
			</body>
		</html>
	)
}
