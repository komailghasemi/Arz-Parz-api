import { NextFunction, Request, Response } from "express";
import Container from "typedi";
import { Like } from "typeorm";
import Database from "../database/Database";
import News from "../database/models/News";


// no auth - get
const getLastNews = async (req: Request, res: Response, next: NextFunction) => {
    try {

        let manager = Container.get(Database).getManager()

        let news = await manager?.find(News, {
            order: { id: 'DESC' },
            take: 5,
            select: ["Title"]
        })
        res.status(200).json(news)
    } catch (e) {
        next(e)
    }
}

// no auth - get
const getNews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let skip = +req.params.skip
        let take = +req.params.take

        let manager = Container.get(Database).getManager()

        let news = await manager?.find(News, {
            order: { id: 'DESC' },
            skip: skip,
            take: take
        })
        res.status(200).json(news)

    } catch (e) {
        next(e)
    }
}

// no auth - get
const searchNews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let skip = +req.params.skip
        let take = +req.params.take
        let search = req.params.search

        let manager = Container.get(Database).getManager()

        let news = await manager?.find(News, {
            where: [{
                Title: Like(`%${search}%`)
            }, {
                Message: Like(`%${search}%`)
            }],
            order: { id: 'DESC' },
            skip: skip,
            take: take
        })

        res.status(200).json(news)

    } catch (e) {
        next(e)
    }
}

// no auth - get
const getNewsById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let manager = Container.get(Database).getManager()

        let news = await manager?.findOne(News, {
            where: {
                id: id
            }
        })
        res.status(200).json(news)

    } catch (e) {
        next(e)
    }
}

// auth - post
const postNews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let title = req.body.title
        let message = req.body.message
        let image = req.file

        let manager = Container.get(Database).getManager()

        let news = new News()
        news.CreateAt = new Date()
        news.Image = image?.filename
        news.Title = title
        news.Message = message

        await manager?.save(news)

        res.status(200).json(news.id)
    } catch (e) {
        next(e)
    }
}
export default {
    getLastNews,
    getNews,
    getNewsById,
    searchNews,
    postNews
}