import { Moment } from 'moment'

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

const getToriTimeStamp = (timeText: string) => {
  const timeNumber = timeText.match(/\d+/)?.[0] || 1
  const currentTime: Moment = moment()

  if (timeText.includes('minuutti')) {
    return currentTime.add(-timeNumber, 'minute')
  } else if (timeText.includes('tunti')) {
    return currentTime.add(-timeNumber, 'hour')
  } else {
    return currentTime
  }
}

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
      const itemList = dom.window.document.querySelector('.sf-result-list')
      if (!itemList) return []

      const a = Array.from(itemList.children)
        .filter((x: HTMLElement) => {
          const time = x.querySelector('.s-text-subtle span')?.textContent.trim()
          return (time?.includes('minuutti') || time?.includes('tunti')) && x.tagName === 'ARTICLE'
        })
        .map((x: any) => {
          return {
            title: x.querySelector('div h2 a')?.textContent.trim() || '',
            url: x.querySelector('div h2 a')?.getAttribute('href').substring(8) || '',
            timeStamp: getToriTimeStamp(x.querySelector('.s-text-subtle span')?.textContent.trim()),
            price: x.querySelector('.m-16 .mt-16').textContent.trim() || '',
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
