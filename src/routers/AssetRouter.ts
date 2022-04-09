import express from 'express'
import Auth from '../auth/Auth'
import assetController from '../controllers/AssetsController'
const router = express.Router()


router.post('/addAssetTransaction', Auth.auth, assetController.addAssetTransaction)
router.get('/getMyAssets', Auth.auth, assetController.getMyAssets)
router.get('/getAssetsTransaction/:symbol', Auth.auth, assetController.getAssetsTransaction)
router.get('/removeAssetsTransaction/:symbol/:transactionId', Auth.auth, assetController.removeAssetsTransaction)
router.get('/searchAsset/:symbol', assetController.searchAsset)

export = router