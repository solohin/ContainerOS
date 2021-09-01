import express from 'express';
import config from '../config';
import middleware from "./middleware"
import { HttpError, StructError, HttpCodes } from '../lib/http/Error';
import logger from '../lib/logger';
import { createProxyMiddleware } from "http-proxy-middleware"

const app = express();
app.get('/', (req, res) => res.send('ContainerOS cluster API server'));

app.use('/v2', createProxyMiddleware({
    target: `http://${config.REGISTRY_HOST}:5000`,
    changeOrigin: true
}));

//middleware
middleware.init(app);

//routes
import routes from "./routes"
app.use('/', routes);


function start(skipListening: boolean = false): express.Router {
    app.use(function onError(e: HttpError | StructError, req: express.Request, res: express.Response, next: Function) {
        let err = e
        if (err instanceof StructError) {
            let message = e.message
            if (err.failures()[0]) {
                message += `. Expected format: ${err.failures()[0].refinement}`
            }
            err = new HttpError(message, HttpCodes.BadRequest)
        }

        if (err instanceof HttpError) {
            res.status(err.statusCode).send({
                errorMessage: err.message,
                statusCode: err.statusCode,
                app: 'cluster-api'
            });
        } else {//Unexpected error
            logger.error("Unexpected error", err)
            res.status(HttpCodes.ServerError).send({
                errorMessage: "Internal server error. Please contact technical support.",
                statusCode: HttpCodes.ServerError
            });
        }
    });

    if (!skipListening) {
        const PORT = config.CLUSTER_API_PORT
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`⚡️ Server is running at port ${PORT}`);
        });
    }

    return app
}

export default { start }

start();
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason)
    process.exit(1)
});