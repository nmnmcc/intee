import {create} from "@nmnmcc/intee"
import enUS from "./languages/en-US"

const en = {tag: "en-US", data: enUS} as const
const zh = {
	tag: "zh-CN",
	data: () => import("./languages/zh-CN").then(m => m.default)
} as const
const ja = {
	tag: "ja-JP",
	data: () => import("./languages/ja-JP").then(m => m.default)
} as const

const match = create([en, zh, ja])

const output = document.getElementById("output")!
const select = document.getElementById("locale-select") as HTMLSelectElement

async function render(locale: string) {
	output.textContent = "Loading…"

	const result = match([locale])
	const t = await result

	output.innerHTML = `
		<p><strong>${t.greeting}</strong></p>
		<p>${t.description}</p>
		<p>${t.welcome("Alice")}</p>
		<p>${t.itemCount(3)}</p>
		<p>${t.farewell}</p>
		<p>Items: ${t.items.apple}, ${t.items.banana}, ${t.items.cherry}</p>
		<p style="color: #888; font-size: 0.85rem">Matched locale: ${result.locale.target}</p>
	`
}

render(select.value)
select.addEventListener("change", () => render(select.value))
