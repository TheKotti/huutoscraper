import axios from "axios";
import moment, { Moment } from "moment";
import { useCallback, useEffect, useState } from "react";
import "./App.css";

type Auction = {
  platform: string;
  price: string;
  timeStamp: Moment;
  title: string;
  url: string;
};

type Config = {
  targetUrls: string[];
};

const App = () => {
  const [config, setConfig] = useState<Config>({ targetUrls: [] });
  const [result, setResult] = useState<Auction[]>([]);

  const fetchAll = useCallback(() => {
    const results: any = {};
    console.log("do the thing", config);
    config.targetUrls.forEach((url) => {
      axios
        .get("http://localhost:3001", {
          params: {
            url,
          },
        })
        .then((x) => {
          const asd = (x.data as any[]).map((x) => {
            return { ...x, timeStamp: moment(x.timeStamp) } as Auction;
          });
          results[url] = asd;
          if (Object.keys(results).length === config.targetUrls.length) {
            const flattened: Auction[] =
              Object.values<Auction>(results).flat<Auction[]>();
            setResult(flattened);
          }
        });
    });
  }, [config]);

  useEffect(() => {
    fetch("config.json").then((res) => {
      res.json().then((config) => {
        setConfig(config);
        console.log(config);
      });
    });
    fetchAll();
    setInterval(() => {
      fetchAll();
    }, 30000);
  }, [fetchAll]);

  const all = result
    .sort(
      (a: Auction, b: Auction) =>
        b.timeStamp.diff(a.timeStamp) || a.title.localeCompare(b.title)
    )
    .filter(
      (x: Auction) =>
        x.title && !(x.title as string).toLowerCase().includes("skylanders")
    );

  return (
    <div className="App">
      {all.map((x: Auction, i: number) => {
        return (
          <div key={i} className="row">
            <div>{x.timeStamp.format("HH:mm")}</div>

            <div>{x.price}</div>

            <div>
              <img src={`/${x.platform}.png`} alt=""></img>
            </div>

            <div>
              <a href={"//" + x.url} target="_blank" rel="noreferrer">
                {x.title}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default App;
