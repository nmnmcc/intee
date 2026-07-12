# IntEE

Your translations are your types.

## Why IntEE?

Most i18n libraries took a wrong turn somewhere.

They made you register namespaces, configure plugins, wrap your app in
providers, learn their own interpolation syntax, and maintain separate type
declaration files just to get autocompletion. Some solved the type safety
problem by generating code. Others asked you to learn a new DSL. All of them
grew complex enough to need a migration guide.

The root mistake was treating i18n as infrastructure — something to install,
configure, and manage — rather than what it actually is: **loading the right
data for the user's locale**.

IntEE does exactly that and nothing more. Your translations are plain objects.
The match logic is a single function call. Types flow automatically because your
data _is_ the type. Lazy loading is opt-in per language, not a build-time
concern. There's no runtime format string parser because you don't need one —
template literals exist.

The result is an API small enough to read in five minutes and powerful enough to
handle real apps. No config. No codegen. No magic. Just the right abstraction.

## Installation

```bash
npm install @nmnmcc/intee
# or
yarn add @nmnmcc/intee
```

React integration requires React ≥ 18 as a peer dependency.

## Usage

### Core

Define your languages once, then create a matcher:

```ts
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
const t = await match(navigator.languages)

console.log(t.greeting)
console.log(t.items.apple)
console.log(t.welcome("Alice"))
```

The first language is the fallback, so it must be available synchronously. It
also defines the shape of every other language. Every later language can be
plain data, a sync loader, or an async loader, but the data it returns still has
to match the fallback shape.

Matching uses BCP 47 locale tags with the `best fit` algorithm. You pass the
user's preferred tags in order, IntEE picks the best available language, and
only that language's loader runs.

`match(tags)` returns a `DataPromise<T, D>` — a `Promise<D>` with `.locale` and
`.fallback` properties available immediately, before the promise resolves.

`locale.current` is the language backing the data you can render right now.
`locale.target` is the best matched language IntEE is loading or has loaded.
Before a lazy language resolves, `current` is the fallback language and `target`
is the matched language. After server-side `await` or a suspenseful client
render, both point at the matched language.

### React

```tsx
import {create} from "@nmnmcc/intee/react"
import enUS from "./languages/en-US"

const en = {tag: "en-US", data: enUS} as const
const zh = {
	tag: "zh-CN",
	data: () => import("./languages/zh-CN").then(m => m.default)
} as const

const {useTranslation} = create([en, zh])

function App() {
	const {t, locale} = useTranslation() // uses navigator.languages by default

	return (
		<div lang={locale.current}>
			<h1>{t.greeting}</h1>
			<p>{t.welcome("Alice")}</p>
			<p>{t("items.apple")}</p>
		</div>
	)
}
```

`useTranslation` accepts either a locale tag array or an options object. Without
explicit tags, React uses `navigator.languages`.

It returns `{ t, data, locale }`, where `t` works both as your translation
object and as a leaf-path lookup function.

That means these are equivalent:

```ts
t.items.apple
t("items.apple")
```

Leaf-path calls are typed. If your data has `items.apple`, `t("items.apple")`
returns the same type as `t.items.apple`. Function-valued translations stay
functions, so this also works with full type inference:

```ts
t.welcome("Alice")
t("welcome")("Alice")
```

By default, the hook renders immediately with the resolved translation set if
one exists, otherwise with the fallback language. In that fallback render,
`locale.current` is the fallback tag and `locale.target` is the matched tag.
Then it updates when the matched language finishes loading.

For UI that should wait for the target language, opt into Suspense:

```tsx
const {t, locale} = useTranslation({suspense: true})
```

For apps that already loaded translation data on the server, seed the client
cache:

```tsx
const translation = await getTranslation(["zh-CN"])

<TranslationProvider tags={["zh-CN"]} initial={translation}>
  {children}
</TranslationProvider>
```

Only pass `initial` across a Server Component boundary when the translation data
is serializable. If your translation objects contain functions, use Suspense
instead.

For RSC-friendly apps, use the explicit server/client entry points:

```tsx
// i18n/server.ts
import {create} from "@nmnmcc/intee/react/server"
import {languages} from "./languages"

export const {getTranslation} = create(languages)
```

```tsx
// app/page.tsx
import {getTranslation} from "./i18n/server"

export default async function Page() {
	const {t, locale} = await getTranslation(["zh-CN"])

	return (
		<main lang={locale.current}>
			<h1>{t.greeting}</h1>
			<p>{t.welcome("Alice")}</p>
		</main>
	)
}
```

```tsx
// i18n/client.ts
"use client"

import {create} from "@nmnmcc/intee/react/client"
import {languages} from "./languages"

export const {TranslationProvider, useTranslation} = create(languages)
```

Only pass serializable values across the RSC boundary. Locale tags are always
safe. A translation `initial` snapshot is safe only when your translation data
is serializable.

### Next.js App Router

Next.js support lives in a separate entry point:

```tsx
// app/i18n/server.ts
import {create} from "@nmnmcc/intee/next"
import {languages} from "./languages"

export const {getLocaleTags, getTranslation} = create(languages)
```

```tsx
// app/i18n/client.ts
"use client"

import {create} from "@nmnmcc/intee/next/client"
import {languages} from "./languages"

export const {TranslationProvider, useSetLocale, useTranslation} =
	create(languages)
```

In the Next.js client entry point, `useTranslation` and `useLocale` always use
Suspense. This keeps Server Component HTML in place during hydration until the
target language is ready on the client, instead of briefly rendering
fallback-language text. `TranslationProvider` includes the Suspense boundary for
its children. For a client-only update that may suspend after mount, place a
closer `<Suspense>` boundary around that feature, or pass a scoped `fallback` to
`TranslationProvider`, so unrelated UI stays visible.

```tsx
// app/layout.tsx
import {TranslationProvider} from "./i18n/client"
import {getLocaleTags, getTranslation} from "./i18n/server"

export default async function RootLayout({children}) {
	const tags = await getLocaleTags()
	const {locale} = await getTranslation(tags)

	return (
		<html lang={locale.current}>
			<body>
				<TranslationProvider tags={tags}>
					{children}
				</TranslationProvider>
			</body>
		</html>
	)
}
```

`getLocaleTags()` reads the request in App Router Server Components. It checks
the `NEXT_LOCALE` cookie first, then falls back to the `accept-language` header.
You can change or disable the cookie with `create(languages, { cookieName })`.
When you disable it with `cookieName: false`, the client result does not include
`useSetLocale`; use locale-aware routes or another app-owned persistence
strategy instead.

Client language switchers can call `useSetLocale()`. It writes the locale cookie
and calls `router.refresh()`, so the next Server Component render uses the
chosen locale. Locale tags are canonicalized before they are stored; invalid
values are ignored. The cookie defaults to `SameSite=Lax` and automatically adds
`Secure` on HTTPS. It is intentionally client-readable so this hook can update
it. If your application requires an `HttpOnly` preference cookie, set it in an
app-owned Server Action or Route Handler instead, then refresh the route.

## Examples

### Synchronous fallback access

The returned promise exposes `.locale` and `.fallback` immediately, before
resolution:

```ts
const result = match(navigator.languages)

console.log(result.locale.current) // "en-US" — data available now
console.log(result.locale.target) // "zh-CN" — matched locale
console.log(result.fallback) // en-US data, always available

const t = await result // zh-CN data, once loaded
```

### Leaf-path lookup (React)

`t` doubles as a function that accepts dot-separated leaf paths:

```ts
t.items.apple
t("items.apple") // equivalent

t.welcome("Alice")
t("welcome")("Alice") // equivalent
```

Only leaf paths are valid — `t("items")` won't compile. Keys starting with `$`
are treated as literal leaves, not nested path prefixes.

### Custom locale override (React)

```tsx
const {t, locale} = useTranslation(["ja-JP"])
```

### Using `match` outside React

The React binding also exports `match` for use in non-component code:

```ts
const {useTranslation, match} = create([en, zh, ja])

// in a loader, server handler, etc.
const t = await match(["en-US"])
```

## License

MIT
