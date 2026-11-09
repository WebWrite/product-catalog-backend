import sanitizeHtml from "sanitize-html"
import richTextConfig from "./sanitizerOptions.util.js"
export const cleanText = (dirty) => {
  if (typeof dirty !== "string") return ""
  return sanitizeHtml(dirty, richTextConfig)
}
