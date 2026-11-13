import { createCn } from "cn/config";

/**
 * Class merging that knows the custom typography roles in globals.css
 * (docs/07 §11). Without this, `text-label text-foreground` would be read as two
 * colours and the role would be dropped.
 */
export const cn = createCn<"numeral">({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "body-lg",
            "body",
            "body-sm",
            "label",
            "caption",
          ],
        },
      ],
      numeral: ["text-numeral"],
    },
  },
});
