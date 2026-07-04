export default {
	greeting: "Server Components からこんにちは！",
	farewell: "このページは見つかりませんでした。",
	description: "このページは IntEE の Next.js ヘルパーを使っています。",
	switchLocale: "言語を切り替え：",
	welcome: (name: string) => `ようこそ、${name}！`,
	itemCount: (n: number) => `${n} 件のアイテムがあります。`
} satisfies typeof import("./en-US").default
