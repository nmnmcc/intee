import {defineConfig} from "tsdown"

export default defineConfig([
	{
		entry: {
			index: "src/index.ts",
			"react/index": "src/react/index.ts",
			"react/client": "src/react/client.ts",
			"react/server": "src/react/server.ts",
			"next/index": "src/next/index.ts",
			"next/client": "src/next/client.ts",
		},
		outDir: "dist",
		format: ["esm", "cjs"],
		dts: true,
		clean: true,
		hash: false,
		external: ["react", "next/headers", "next/navigation"],
	},
])
