import express from 'express'
import Auth from '../auth/Auth'
import marketController from '../controllers/MarketController'
const router = express.Router()

router.get('/addMarket/:market', Auth.auth, marketController.addMarket)
router.get('/getMyMarkets', Auth.auth, marketController.getMyMarkets)
router.get('/deleteMarket/:market', Auth.auth, marketController.deleteMarket)


export = router