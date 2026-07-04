import enUS from "./languages/en-US"

export const languages = [
	{tag: "en-US", data: enUS},
	{
		tag: "zh-CN",
		data: () => import("./languages/zh-CN").then(m => m.default)
	},
	{
		tag: "ja-JP",
		data: () => import("./languages/ja-JP").then(m => m.default)
	}
] as const
