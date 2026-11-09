import { cleanText } from "../utils/cleanText.js"

export const sanitizeRichText = (fields) => {
  const list = Array.isArray(fields) ? fields : [fields]

  return (req, res, next) => {
    for (const field of list) {
      if (req.body[field] !== undefined) {
        req.body[field] = cleanText(req.body[field])
      }
    }
    next()
  }
}
