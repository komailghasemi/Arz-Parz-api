import { ErrorRequestHandler } from "express";
import Container from "typedi";
import Database from "../database/Database";
import Error from "../database/models/Error";

export const error: ErrorRequestHandler = async (err, req, res, next) => {
    console.log('error ->', err)

    try {

        await saveError(err)
    } catch (e) {

    }

    res.sendStatus(500)
};


export const saveError = async (err: any) => {
    let error = new Error()
    error.Name = err.name
    error.Message = err.message
    error.StackTrace = err.stack

    await Container.get(Database).getManager()?.save(error)
}