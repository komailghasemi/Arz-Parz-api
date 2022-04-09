import express from 'express'
import Auth from '../auth/Auth'
import newsController from '../controllers/NewsController'
import multer from 'multer'
import path from 'path'
import {v4 as uuidv4} from 'uuid';
const router = express.Router()

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../logos/news/'))
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + file.originalname.substring(file.originalname.lastIndexOf('.') , file.originalname.length))
    }
});

router.get('/latest', newsController.getLastNews)
router.get('/list/:skip/:take', newsController.getNews)
router.get('/search/:search/:skip/:take', newsController.searchNews)
router.get('/:id', newsController.getNewsById)
router.post('/postNews', Auth.auth, multer({ storage: fileStorage }).single('image'), newsController.postNews)


export = router