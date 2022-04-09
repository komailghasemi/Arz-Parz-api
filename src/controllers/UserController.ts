import { NextFunction, Request, Response } from "express"
import Container from "typedi"
import Database from "../database/Database"
import User from "../database/models/User"
import jwt from 'jsonwebtoken'
import { randomInt } from "crypto"
import AuthCodeStore from "../database/models/AuthCodeStore"
import EmailService from "../email/EmailService"
import bcrypt from 'bcrypt'

// no Auth // post
const newUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        let id = req.body.id
        let manager = Container.get(Database).getManager()
        let user = new User()

        user.ClientId = id
        user.CreateAt = new Date()
        user.UpdateAt = user.CreateAt
        user.LastLoginAt = user.CreateAt
        user.IsActive = true
        user.IsAdmin = false

        await manager?.save(user)

        res.sendStatus(200)
    } catch (e) {
        next(e)
    }
}

// Auth // get
const requestAuthCode = async (req: Request, res: Response, next: NextFunction) => {

    try {
        let id = req.params.id
        let email = req.params.email

        let manager = Container.get(Database).getManager()
        let user = await manager?.findOne(User, {
            where: {
                Email: email
            }
        }) || await manager?.findOne(User, {
            where: {
                ClientId: id
            }
        })

        let authCode = randomInt(123456, 987654)
        let auth = (await manager?.findOne(AuthCodeStore, {
            relations: ["User"],
            where: {
                User: user
            }
        })) || new AuthCodeStore()
        auth.Code = authCode
        auth.Expire = Date.now() + (5 * 60 * 1000)
        auth.User = user

        await manager?.save(auth)

        await Container.get(EmailService).send("Arz Parz Authentication System", authCode.toString(), email)
        res.sendStatus(200)
    } catch (e) {
        next(e)
    }
}

// Auth // post
const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let name = req.body.name
        let email = req.body.email
        let password = req.body.password
        let code = req.body.code
        let najvaToken = req.body.najvaToken

        let manager = Container.get(Database).getManager()
        let authCodeStore = await manager?.findOne(AuthCodeStore, {
            relations: ["User", "User.Markets"],
            where: {
                Code: code
            }
        })


        if (!authCodeStore || !authCodeStore.User || authCodeStore.User?.ClientId !== id) {
            res.status(200).json('Code')
            return
        }

        if ((authCodeStore?.Expire || 0) < Date.now()) {
            res.status(200).json('Expire')
            return
        }


        let checkUser = await manager?.findOne(User, {
            where: {
                Email: email
            }
        })

        if (checkUser) {
            res.status(200).json('Email')
            return
        }

        let user = authCodeStore.User
        user!.Name = name
        user!.Email = email
        let salt = await bcrypt.genSalt()
        let passCrypt = await bcrypt.hash(password, salt)
        user!.PasswordSalt = salt
        user!.Password = passCrypt
        user!.NajvaToken = najvaToken
        await manager?.save(user)

        res.sendStatus(200)
    } catch (e) {
        next(e)
    }
}


// no Auth // post
const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let email = req.body.email
        let password = req.body.password
        let manager = Container.get(Database).getManager()

        let user = await manager?.findOne(User, {
            where: {
                Email: email
            }
        })

        if (user) {
            let passCrypt = await bcrypt.hash(password, user!.PasswordSalt?.toString() || "")
            if (passCrypt === user.Password && user.IsActive === true) {
                res.status(200).json(user.ClientId)
            } else if (user.IsActive === false) {
                res.status(200).json('Deactive')
            }
            else {
                res.status(200).json('Password')
            }
        } else {
            res.status(200).json('Email')

        }

    } catch (e) {
        next(e)
    }
}

// no auth // post
const token = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.body.id
        let manager = Container.get(Database).getManager()

        let user = await manager?.findOne(User, {
            where: {
                ClientId: id
            }
        })

        if (user) {
            let expire = Date.now() + 10 * 60 * 1000 // 10 min

            let token = jwt.sign({ id: user.ClientId!, expire: expire }, "secret")
            let data = { token: token, expire: 10 }
            res.status(200).json(data)
        } else {
            res.sendStatus(401)
        }
    } catch (e) {
        next(e)
    }
}

// no auth //post
const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let email = req.body.email
        let password = req.body.password
        let code = req.body.code

        let manager = Container.get(Database).getManager()
        let authCodeStore = await manager?.findOne(AuthCodeStore, {
            relations: ["User", "User.Markets"],
            where: {
                Code: code
            }
        })

        if (!authCodeStore || !authCodeStore.User || authCodeStore.User?.Email !== email) {
            res.status(200).json('Code')
            return
        }

        if ((authCodeStore?.Expire || 0) < Date.now()) {
            res.status(200).json('Expire')
            return
        }

        let user = authCodeStore.User

        let salt = await bcrypt.genSalt()
        let passCrypt = await bcrypt.hash(password, salt)
        user!.PasswordSalt = salt
        user!.Password = passCrypt
        user!.UpdateAt = new Date()

        await manager?.save(user)

        res.sendStatus(200)

    } catch (e) {
        next(e)
    }
}

// auth - get
const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let manager = Container.get(Database).getManager()

        let user = await manager?.findOne(User, {
            where: { ClientId: id }
        })
        if(user){

            res.status(200).json({
                name : user.Name,
                email : user.Email
            })
            return
        }

        res.sendStatus(500)
    } catch (e) {
        next(e)
    }
}

// auth - get
const putMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let name = req.params.name

        let manager = Container.get(Database).getManager()

        let user = await manager?.findOne(User, {
            where: { ClientId: id }
        })
      
        if(user){
            user!.Name = name
            await manager?.save(user)

            res.sendStatus(200)
            return
        }

        res.sendStatus(500)
    } catch (e) {
        next(e)
    }
}

export default {
    newUser,
    requestAuthCode,
    register,
    login,
    token,
    resetPassword,
    me,
    putMe
}