import { NextFunction, Request, Response } from "express";
import Container from "typedi";
import Database from "../database/Database";
import ChatRoom from "../database/models/ChatRoom";


// auth //get
const getChats =  async (req: Request, res: Response, next: NextFunction) => {
    try{ 
        
        let channel = req.params.channel
        let skip = +req.params.skip
        let take = +req.params.take
       
        let manager = Container.get(Database).getManager()
        let chats = await manager?.find(ChatRoom, {
            relations : ["User"],
            where : {Channel : channel},
            order: { id: 'DESC' },
            skip : skip,
            take : take
        })
        res.status(200).json(chats?.map((chat , index , arr)=> {
            return {
                user: chat.User?.Name || "بدون نام",
                message: chat.Message,
                createAt: chat.CreateAt
            }
        }))
    }catch(e){
        next(e)
    }
   
}

export default {
    getChats
}