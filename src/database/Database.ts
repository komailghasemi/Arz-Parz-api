import { Service } from "typedi";
import { Connection, createConnection } from "typeorm";
import GlobalMetrics from "./models/GlobalMetrics";
import sql from 'mssql'
import "reflect-metadata";
import Market from "./models/Market";
import Exchange from "./models/Exchange";
import User from "./models/User";
import Error from "./models/Error";
import AuthCodeStore from "./models/AuthCodeStore";
import Asset from "./models/Assest";
import TransactionHistory from "./models/TransactionHistory";
import Wallet from "./models/Wallet";
import ChatRoom from "./models/ChatRoom";
import News from "./models/News";

@Service()
export default class Database {

    private connection: Connection | undefined

    async init(): Promise<Boolean> {
        const connection = await createConnection({
            type: "mssql",
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            driver: sql,
            entities: [
                GlobalMetrics,
                Market,
                Exchange,
                User,
                AuthCodeStore,
                Error,
                Asset,
                TransactionHistory,
                Wallet,
                ChatRoom,
                News
            ],
            extra: {
                options: {
                    trustedConnection: true,
                    trustServerCertificate: true
                }
            },
            synchronize: true,
            logging: false
        });
        this.connection = connection;
        return connection != undefined;
    }

    getManager() {
        return this.connection?.manager
    }

}