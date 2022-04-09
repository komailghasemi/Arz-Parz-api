import express from 'express'
import Auth from '../auth/Auth'
import userController from '../controllers/UserController'
const router = express.Router()

router.post('/newUser', userController.newUser)
router.get('/requestAuthCode/:email', Auth.auth, userController.requestAuthCode)
router.post('/register', Auth.auth, userController.register)
router.post('/login', userController.login)
router.post('/token', userController.token)
router.post('/resetPassword', userController.resetPassword)
router.get('/me', Auth.auth, userController.me)
router.get('/putMe/:name', Auth.auth, userController.putMe)

export = router