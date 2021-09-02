import bodyParser from "body-parser"
import express from "express"
import cors from "cors"
import config from "../../config"
import authMiddleware from "../../lib/http/singlePaswordAuthMiddleware"

export default {
    init(app: express.Application) {
        app.use(bodyParser.json());
        app.use(cors())
        app.use(function (req, res, next) {
            //соберем все данные по запросу
            req.body = Object.assign({}, req.query, req.body)
            next()
        })

        app.use(authMiddleware(config.get("API_PASSWORD"), [`/v1/public/`]))
    }
}