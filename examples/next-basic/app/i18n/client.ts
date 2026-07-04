"use client"

import {create} from "@nmnmcc/intee/next/client"
import {languages} from "./languages"

export const {
	TranslationProvider,
	useLocale,
	useSetLocale,
	useTranslation
} = create(languages)
