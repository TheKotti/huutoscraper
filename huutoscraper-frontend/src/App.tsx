import axios from 'axios'
import moment, { Moment } from 'moment'
import { useCallback, useEffect, useState } from 'react'
import './App.css'

type Auction = {
  category: string
  price: string
  timeStamp: Moment
  title: string
  url: string
}

type Config = {
  targetUrls: Array<{ url: string; category: string }>
  blacklist: string[]
  interval: number
}

const App = () => {
  const [config, setConfig] = useState<Config>({ targetUrls: [], blacklist: [], interval: 30000 })
  const [result, setResult] = useState<Auction[]>([])

  const fetchAll = useCallback(() => {
    const results: any = {}
    config.targetUrls.forEach((target, i) => {
      axios
        .get('http://localhost:3001', {
          params: {
            url: target.url,
            category: target.category,
          },
        })
        .then((x) => {
          const listing = (x.data as any[]).map((x) => {
            return { ...x, timeStamp: moment(x.timeStamp) } as Auction
          })
          results[i] = listing
          if (Object.keys(results).length === config.targetUrls.length) {
            const flattened: Auction[] = Object.values<Auction>(results).flat<Auction[]>()
            setResult(flattened)
          }
        })
    })
  }, [config])

  useEffect(() => {
    fetch('config.json').then((res) => {
      res.json().then((config) => {
        setConfig(config)
      })
    })
  }, [])

  useEffect(() => {
    fetchAll()
    setInterval(() => {
      fetchAll()
    }, config.interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  const all = result
    .filter((x: Auction) => {
      const titleWords = x.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, ' ')
        .split(' ')
      const gotem = titleWords.filter((value) => config.blacklist.includes(value)).length > 0
      return !gotem
    })
    .sort((a: Auction, b: Auction) => b.timeStamp.diff(a.timeStamp) || a.title.localeCompare(b.title))

  return (
    <div className='App'>
      {all.map((x: Auction, i: number) => {
        return (
          <div key={i} className='row'>
            <div>{x.timeStamp.format('HH:mm')}</div>

            <div>{x.price}</div>

            <div>
              <img src={`/${x.category}.png`} alt=''></img>
            </div>

            <div>
              <a href={'//' + x.url} target='_blank' rel='noreferrer'>
                {x.title}
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default App
