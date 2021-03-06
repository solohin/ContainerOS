import express from 'express';
import { assert, create } from 'superstruct'
import { AppUpdate, ScaleCheck } from "../validators"
import stackDeploy from '../../lib/docker/stackDeploy';
import { updateStack as updateStackInDatabase, getStack } from "../../lib/database"
import yaml from "js-yaml"
import logger from '../../lib/logger';
import { DockerStack } from '../../types';
export default async function (req: express.Request, res: express.Response) {
    const validatedBody = create(req.body, AppUpdate)
    assert(validatedBody.scale, ScaleCheck)

    await updateStackInDatabase(validatedBody.team, function (stack: DockerStack): DockerStack {
        stack.services[validatedBody.name] = {
            image: validatedBody.image,
            networks: {
                [validatedBody.team]: {
                    aliases: [`${validatedBody.name}`]
                }
            },
            environment: validatedBody.env,
            deploy: {
                replicas: validatedBody.scale,
                resources: {
                    limits: {
                        cpus: String(validatedBody.hardCpuLimit),
                        memory: String(validatedBody.hardMemoryLimit) + 'm'
                    },
                    reservations: {
                        cpus: String(validatedBody.hardCpuLimit / 4),
                        memory: String(validatedBody.hardMemoryLimit / 4) + 'm'
                    }
                },
                update_config: {
                    parallelism: 1,
                    delay: '10s',
                    order: 'start-first',
                    failure_action: 'rollback'
                }
            },
        }

        const internetPort = validatedBody.internetPort || 80

        if (validatedBody.internetDomain) {
            stack.services[validatedBody.name].networks["caddy"] = {
                aliases: [`${validatedBody.team}--${validatedBody.name}`]
            }
            stack.services[validatedBody.name].deploy.labels = {
                "caddy": validatedBody.internetDomain,
                "caddy.reverse_proxy": `{{upstreams ${internetPort}}}`,
            }
        }

        return stack
    })

    const stack = await getStack(validatedBody.team)
    logger.debug("Deploing stack", yaml.dump(stack))

    await stackDeploy(yaml.dump(stack), validatedBody.team)

    return res.send({
        success: true,
        debug: validatedBody
    })
}