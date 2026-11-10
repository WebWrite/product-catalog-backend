const ALIGN = [/^(left|center|right)$/]

const richTextConfig = {
  allowedTags: [
    "p",
    "br",
    "hr",
    "h1",
    "h2",
    "h3",
    "strong",
    "em",
    "u",
    "s",
    "code",
    "ul",
    "ol",
    "li",
    "blockquote"
  ],

  allowedAttributes: {
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"]
  },

  allowedStyles: {
    "*": { "text-align": ALIGN }
  },

  disallowedTagsMode: "discard",
  nonTextTags: ["script", "style", "textarea", "noscript", "iframe"]
}

export default richTextConfig
