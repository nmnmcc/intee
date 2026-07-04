import path from "node:path"
import {fileURLToPath} from "node:url"
import type {NextConfig} from "next"

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..")

const nextConfig: NextConfig = {
	experimental: {
		globalNotFound: true
	},
	transpilePackages: ["@nmnmcc/intee"],
	outputFileTracingRoot: monorepoRoot
}

export default nextConfig
