export default {
	greeting: "来自 Server Components 的你好！",
	farewell: "找不到这个页面。",
	description: "这个页面使用 IntEE 的 Next.js 辅助函数。",
	switchLocale: "切换语言：",
	welcome: (name: string) => `欢迎，${name}！`,
	itemCount: (n: number) => `你有 ${n} 件物品。`
} satisfies typeof import("./en-US").default
