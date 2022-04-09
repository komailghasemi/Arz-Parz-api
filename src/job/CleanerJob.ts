import { Service } from "typedi";
import { IsNull, LessThan } from "typeorm";
import Database from "../database/Database";
import AuthCodeStore from "../database/models/AuthCodeStore";
import User from "../database/models/User";
import ChatRoom from "../database/models/ChatRoom";
import Error from "../database/models/Error";

@Service({ transient: true })
export default class CleanerJob {
    constructor(private readonly database: Database) {

    }

    async clean() {
        try{
            await this.cleanAuth()
            await this.cleanGeusts()
        }catch(err : any){
            let error = new Error()
            error.Name = err.name
            error.Message = err.message
            error.StackTrace = err.stack
    
            await this.database.getManager()?.save(error)

            console.log(err);
            
        }
      
    }

    private async cleanAuth() {
        let manager = this.database.getManager()
        let authList = await manager?.find(AuthCodeStore, {
            where: {
                Expire: LessThan(Date.now())
            }
        })
        await manager?.remove(authList)
    }

    private async cleanGeusts() {
        let manager = this.database.getManager()
        let date = new Date()
        date.setMonth(date.getMonth() - 1)
        let geusts = await manager?.find(User, {
            where: {
                Email: IsNull(),
                LastLoginAt: LessThan(date)
            },
            relations: ["Markets", "Wallets", "Wallets.TransactionHistories"]
        })

        geusts?.forEach(async (user, index, arr) => {
            // relations :  market , wallet , chatroom , TransactionHistories
            // delete markets
            user.Markets = []
            await manager?.save(user)

            // delete trx
            user.Wallets?.forEach(async (wallet, i, ar) => {
                await manager?.remove(wallet.TransactionHistories)
            })

            // delete wallets
            await manager?.remove(user.Wallets)

            // delete chats
            let chats = await manager?.find(ChatRoom , {
                where : {
                    User : user
                }
            })
            await manager?.remove(chats)

            // delete user
            await manager?.remove(user)
        })

    }
}