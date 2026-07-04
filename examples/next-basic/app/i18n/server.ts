import {create} from "@nmnmcc/intee/next"
import {languages} from "./languages"

export const {getLocaleTags, getTranslation, match} = create(languages)
