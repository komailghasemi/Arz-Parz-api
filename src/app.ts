import express from 'express'
import Container from 'typedi';
import Database from './database/Database';
import dotenv from 'dotenv'
import { cron } from './job/crons';
import helmet from 'helmet'
import publicRouter from './routers/PublicRouter'
import userRouter from './routers/UserRouter'
import marketRouter from './routers/MarketRouter'
import assetRouter from './routers/AssetRouter'
import newsRouter from './routers/NewsRouter'
import chatRouter from './routers/ChatRouter'
import path from 'path'
import { error } from './error/ErrorHandler';
import cors from 'cors'
import SocketServerRouter from './ws/SocketServerRouter';

dotenv.config()

const app = express();


//app.use(cors())
app.use(helmet())
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }
    next();
});
// Public Folders 
app.use('/crypto', express.static(path.join(__dirname, '/logos/crypto')))
app.use('/news', express.static(path.join(__dirname, '/logos/news')))


app.use('/api/public', publicRouter)
app.use('/api/user', userRouter)
app.use('/api/market', marketRouter)
app.use('/api/asset', assetRouter)
app.use('/api/news', newsRouter)
app.use('/api/chat', chatRouter)

app.use(error);

Container.get(Database).init().then(result => {
    if (result == true) {
    
        let server = app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is Running on Port ${process.env.PORT || 3000}`);
            cron()
        })
        Container.get(SocketServerRouter).listen(server)
    }
}).catch(e => console.log('Errrrr -> ' + e))