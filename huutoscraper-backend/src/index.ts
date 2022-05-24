const axios = require('axios')
const express = require('express')
const jsdom = require('jsdom')
const moment = require('moment')
const compression = require('compression')
const cors = require('cors')

const PORT = 3001

const app = express()
app.use(compression())
app.use(cors())

const getHuutoData = (url: string, category: string) =>
  axios(url)
    .then((response) => {
      const dom = new jsdom.JSDOM(response.data)
      const itemListOptions = dom.window.document.querySelectorAll('#search-grid-container')
      const itemList = itemListOptions[itemListOptions.length - 1]

      if (!itemList) return []

      const a = Array.from(itemList.children)
        .filter((x: any) =>
          // Filter out elements without titles, Huuto started doing weird shit with HtmlStyleElements
          x.querySelector('a div div.item-card__header div.item-card__header-left div.item-card__title')
        )
        .map((x: any) => {
          return {
            title:
              x
                .querySelector('a div div.item-card__header div.item-card__header-left div.item-card__title')
                ?.textContent.trim() || '',
            url: new URL(url).hostname + x.querySelector('a')?.getAttribute('href') || '',
            timeStamp: moment(
              x
                .querySelector('a div div.item-card__header div.item-card__header-left div.item-card__time span span')
                ?.textContent.trim() || '',
              'DD.MM.YYYY HH:mm'
            ),
            price:
              x
                .querySelector('a div div.item-card__footer div.item-card__footer-column--right div.item-card__price')
                ?.textContent.trim() || '',
            category: category,
          }
        })
      return a
    })
    .catch(() => {
      return []
    })

const getToriData = (url: string, category: string) =>
  axios(url)
    .then((response) => {
      const dom = new jsdom.JSDOM(response.data)
      const itemList = dom.window.document.querySelector('#blocket div.main div div div.list_mode_thumb')
      if (!itemList) return []

      const a = Array.from(itemList.children)
        .filter((x: any) => {
          const notBuying = x
            .querySelector('a div.desc_flex div.ad-details-right div.date-cat-container div.cat_geo')
            ?.textContent.trim()
          const time = x
            .querySelector('a div.desc_flex div.ad-details-right div.date-cat-container div.date_image')
            ?.textContent.trim()
          return (time?.includes('t�n��n') && !notBuying.includes('Ostetaan')) || false
        })
        .map((x: any) => {
          return {
            title: x.querySelector('a div.desc_flex div.ad-details-left div.li-title')?.textContent.trim() || '',
            url: x?.getAttribute('href').substring(8) || '',
            timeStamp: moment(
              x
                .querySelector('a div.desc_flex div.ad-details-right div.date-cat-container div.date_image')
                ?.textContent.trim()
                .slice(-5) || '',
              'HH:mm'
            ),
            price:
              x.querySelector('a div.desc_flex div.ad-details-left div.list-details-container p')?.textContent.trim() ||
              '',
            category: category,
          }
        })
      return a
    })
    .catch(() => {
      return []
    })

app.get('/', (req, res) => {
  const { url, category } = req.query
  switch (true) {
    case url.includes('huuto.net'):
      getHuutoData(url, category).then((x) => res.json(x))
      break

    case url.includes('tori.fi'):
      getToriData(url, category).then((x) => res.json(x))
      break

    default:
      res.json([])
      break
  }
})

app.listen(PORT, () => console.log(`server running in port ${PORT}`))
