export default {
	greeting: "Hello from Server Components!",
	farewell: "This page could not be found.",
	description: "This page uses IntEE's Next.js helpers.",
	switchLocale: "Switch locale:",
	welcome: (name: string) => `Welcome, ${name}!`,
	itemCount: (n: number) => `You have ${n} item${n === 1 ? "" : "s"}.`
}
