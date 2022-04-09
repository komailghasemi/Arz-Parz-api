import express from 'express'
import publicController from '../controllers/PublicController'
const router = express.Router()

router.get('/global', publicController.getGlobalMetrics)
router.get('/search/:market', publicController.searchMarket)
router.get('/market/:market', publicController.getMarket)

export = router