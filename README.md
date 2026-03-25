# IntEE

Your translations are your types.

## Why IntEE?

Most i18n libraries took a wrong turn somewhere.

They made you register namespaces, configure plugins, wrap your app in providers, learn their own interpolation syntax, and maintain separate type declaration files just to get autocompletion. Some solved the type safety problem by generating code. Others asked you to learn a new DSL. All of them grew complex enough to need a migration guide.

The root mistake was treating i18n as infrastructure — something to install, configure, and manage — rather than what it actually is: **loading the right data for the user's locale**.

IntEE does exactly that and nothing more. Your translations are plain objects. The match logic is a single function call. Types flow automatically because your data *is* the type. Lazy loading is opt-in per language, not a build-time concern. There's no runtime format string parser because you don't need one — template literals exist.

The result is an API small enough to read in five minutes and powerful enough to handle real apps. No config. No codegen. No magic. Just the right abstraction.

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
import { create } from "@nmnmcc/intee"
import enUS from "./languages/en-US"

const en = { tag: "en-US", data: enUS } as const
const zh = {
  tag: "zh-CN",
  data: () => import("./languages/zh-CN").then(m => m.default),
} as const
const ja = {
  tag: "ja-JP",
  data: () => import("./languages/ja-JP").then(m => m.default),
} as const

const match = create([en, zh, ja])
const t = await match(navigator.languages)

console.log(t.greeting)
console.log(t.items.apple)
console.log(t.welcome("Alice"))
```

The first language is the fallback, so it must be available synchronously. It also defines the shape of every other language. Every later language can be plain data, a sync loader, or an async loader, but the data it returns still has to match the fallback shape.

Matching uses BCP 47 locale tags with the `best fit` algorithm. You pass the user's preferred tags in order, IntEE picks the best available language, and only that language's loader runs.

`match(tags)` returns a `DataPromise<T, D>` — a `Promise<D>` with `.tag` (the matched locale tag) and `.fallback` (synchronous access to the fallback language data) properties. Both are available immediately, before the promise resolves.

### React

```tsx
import { create } from "@nmnmcc/intee/react"
import enUS from "./languages/en-US"

const en = { tag: "en-US", data: enUS } as const
const zh = {
  tag: "zh-CN",
  data: () => import("./languages/zh-CN").then(m => m.default),
} as const

const { useTranslation } = create([en, zh])

function App() {
  const [t, tag] = useTranslation() // uses navigator.languages by default

  return (
    <div lang={tag}>
      <h1>{t.greeting}</h1>
      <p>{t.welcome("Alice")}</p>
      <p>{t("items.apple")}</p>
    </div>
  )
}
```

`useTranslation` accepts an optional `tags` array to override the detected locales. Without it, React uses `navigator.languages`.

It returns `[t, tag]`, where `t` works both as your translation object and as a leaf-path lookup function.

That means these are equivalent:

```ts
t.items.apple
t("items.apple")
```

Leaf-path calls are typed. If your data has `items.apple`, `t("items.apple")` returns the same type as `t.items.apple`. Function-valued translations stay functions, so this also works with full type inference:

```ts
t.welcome("Alice")
t("welcome")("Alice")
```

The hook renders immediately with the last resolved translation set if one exists, otherwise with the fallback language. Then it updates when the matched language finishes loading.

## Examples

### Synchronous fallback access

The returned promise exposes `.tag` and `.fallback` immediately, before resolution:

```ts
const result = match(navigator.languages)

console.log(result.tag)      // "zh-CN" — matched locale
console.log(result.fallback) // en-US data, always available

const t = await result       // zh-CN data, once loaded
```

### Leaf-path lookup (React)

`t` doubles as a function that accepts dot-separated leaf paths:

```ts
t.items.apple
t("items.apple")        // equivalent

t.welcome("Alice")
t("welcome")("Alice")   // equivalent
```

Only leaf paths are valid — `t("items")` won't compile. Keys starting with `$` are treated as literal leaves, not nested path prefixes.

### Custom locale override (React)

```tsx
const [t, tag] = useTranslation(["ja-JP"])
```

### Using `match` outside React

The React binding also exports `match` for use in non-component code:

```ts
const { useTranslation, match } = create([en, zh, ja])

// in a loader, server handler, etc.
const t = await match(["en-US"])
```

## License

MIT
