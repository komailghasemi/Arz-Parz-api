
import { CronJob } from 'cron'
import Container from 'typedi'
import CleanerJob from './CleanerJob'
import GlobalMetricsJob from './GlobalMetricsJob'
import MarketJob from './MarketJob'

export const cron = () => {

    //  Container.get(MarketJob).sync()
    //  Container.get(GlobalMetricsJob).sync()


    const cleaner = new CronJob({
        cronTime: '0 6 * * *',
        onTick: async () => {
            await Container.get(CleanerJob).clean()
        },
        start: false,
    })

    cleaner.start()

    const market = new CronJob({
        cronTime: '0 1 * * *',
        onTick: async () => {
            await Container.get(MarketJob).sync()
        },
        start: false,
    })

    market.start()

    const global = new CronJob({
        cronTime: '0,10,20,30,40,50,52 * * * *',
        onTick: async () => {
            await Container.get(GlobalMetricsJob).sync()
        },
        start: false,
    })

    global.start()

}