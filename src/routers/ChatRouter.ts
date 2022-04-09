import express from 'express'
import Auth from '../auth/Auth'
import chatController from '../controllers/ChatController'
const router = express.Router()

router.get('/list/:channel/:skip/:take', Auth.auth, chatController.getChats)

export = router