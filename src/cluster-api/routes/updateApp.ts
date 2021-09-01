import express from 'express';
import { assert, create } from 'superstruct'
import { AppUpdate, ScaleCheck } from "../validators"
import stackDeploy from '../../lib/docker/stackDeploy';
import { DockerStack, updateStack as updateStackInDatabase, getStack } from "../../lib/database"
import yaml from "js-yaml"
import logger from '../../lib/logger';
export default async function (req: express.Request, res: express.Response) {
    const validatedBody = create(req.body, AppUpdate)
    assert(validatedBody.scale, ScaleCheck)

    await updateStackInDatabase(validatedBody.namespace, function (stack: DockerStack): DockerStack {
        stack.services[validatedBody.name] = {
            image: validatedBody.image,
            networks: {
                [validatedBody.namespace]: {
                    aliases: [`${validatedBody.namespace}--${validatedBody.namespace}`]
                }
            },
        }

        const internetPort = validatedBody.internetPort || 80

        if (validatedBody.internetDomain) {
            stack.services[validatedBody.name].networks["caddy"] = {
                aliases: [`${validatedBody.namespace}--${validatedBody.namespace}`]
            }
            stack.services[validatedBody.name].labels = {
                "caddy": validatedBody.internetDomain,
                "caddy.reverse_proxy": `{{upstreams ${internetPort}}}`,
            }
        }

        return stack
    })

    const stack = await getStack(validatedBody.namespace)
    logger.debug("Deploing stack", yaml.dump(stack))

    await stackDeploy(yaml.dump(stack), validatedBody.namespace)

    return res.send({
        success: true,
        acceptedValues: validatedBody
    })
}