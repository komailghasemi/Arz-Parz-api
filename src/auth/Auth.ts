import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import Container from "typedi";
import Database from "../database/Database";
import User from "../database/models/User";

const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token = req.header('Authorization')
        tokenValidation(token).then((id) => {
            if (id) {
                req.params.id = id
                next()
            } else {
                res.sendStatus(401)
            }
        }).catch(e => next(e))

    } catch (e) {
        next(e)
    }
}


const tokenValidation = async (token: string | undefined): Promise<string | undefined> => {
    return new Promise<string | undefined>((resolve, reject) => {
        if (token) {
            jwt.verify(token, 'secret', async function (err, decoded) {
                if (err) {
                    resolve(undefined)
                    return
                }
                else {
                    try {
                        let id: string = (<any>decoded).id
                        let expire: number = (<any>decoded).expire
                        if (Date.now() >= expire) {
                            resolve(undefined)
                            return
                        } else {
                            // GET USER and UPDATE Login Date/ await
                            let manager = Container.get(Database).getManager()
                            let user = await manager?.findOne(User, {
                                where: { ClientId: id }
                            })

                            user!.LastLoginAt = new Date()
                            await manager?.save(user)
                            resolve(id)
                        }
                    } catch (e) {
                        reject(e)
                    }
                }
            })
        } else {
            resolve(undefined)
        }
    })
}

export default {
    auth,
    tokenValidation
}
