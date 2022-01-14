import jsdom from "jsdom";
import moment from "moment";
import fetch from "node-fetch";

/**
 * Return DOM of target URL
 * @param url target URL
 */
export const getDom = async (url: string) => {
  const page = await fetch(url);

  const text = await page.text();
  return new jsdom.JSDOM(text);
};

export const getHuutoData = async (url: string) => {
  const dom = await getDom(url);
  const itemList = dom.window.document.querySelector("#search-grid-container");
  if (!itemList) return [];

  const a = Array.from(itemList.children).map((x: any) => {
    return {
      title:
        x
          .querySelector(
            "a div div.item-card__header div.item-card__header-left div.item-card__title"
          )
          ?.textContent.trim() || "",
      url:
        new URL(url).hostname + x.querySelector("a")?.getAttribute("href") ||
        "",
      timeStamp: moment(
        x
          .querySelector(
            "a div div.item-card__header div.item-card__header-left div.item-card__time span span"
          )
          ?.textContent.trim() || "",
        "DD.MM.YYYY HH:mm"
      ),
      price:
        x
          .querySelector(
            "a div div.item-card__footer div.item-card__footer-column--right div.item-card__price"
          )
          ?.textContent.trim() || "",
      platform: getPlatform(url),
    };
  });

  return a;
};

export const getToriData = async (url: string) => {
  const dom = await getDom(url);
  const itemList = dom.window.document.querySelector(
    "#blocket div.main div div div.list_mode_thumb"
  );
  if (!itemList) return [];

  const a = Array.from(itemList.children)
    .filter((x: any) => {
      const time = x
        .querySelector(
          "a div.desc_flex div.ad-details-right div.date-cat-container div.date_image"
        )
        ?.textContent.trim();
      return time?.includes("t�n��n") || false;
    })
    .map((x: any) => {
      return {
        title:
          x
            .querySelector("a div.desc_flex div.ad-details-left div.li-title")
            ?.textContent.trim() || "",
        url: x?.getAttribute("href").substring(8) || "",
        timeStamp: moment(
          x
            .querySelector(
              "a div.desc_flex div.ad-details-right div.date-cat-container div.date_image"
            )
            ?.textContent.trim()
            .slice(-5) || "",
          "HH:mm"
        ),
        price:
          x
            .querySelector(
              "a div.desc_flex div.ad-details-left div.list-details-container p"
            )
            ?.textContent.trim() || "",
        platform: getPlatform(url),
      };
    });
  return a;
};

const getPlatform = (url: string) => {
  switch (url.slice(-3)) {
    case "463":
    case "=ps":
      return "ps1";

    case "459":
    case "ps2":
      return "ps2";

    case "461":
    case "ps3":
      return "ps3";

    default:
      return "ps1";
  }
};
