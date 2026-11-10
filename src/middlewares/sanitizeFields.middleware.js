import { sanitizeString } from "../utils/cleanText.js"

export const sanitizeFields = (fields) => (req, res, next) => {
  for (const field of fields) {
    const path = field.split(".")
    let target = req.body

    for (const key of path.slice(0, -1)) {
      if (target === null || typeof target !== "object") {
        target = undefined
        break
      }
      target = target[key]
    }

    const key = path[path.length - 1]
    if (target && target[key] !== undefined) {
      target[key] = sanitizeString(target[key])
    }
  }

  next()
}
