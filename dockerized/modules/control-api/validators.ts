import { assert, object, number, string, array, boolean, optional, defaulted, refine, create, pattern } from 'superstruct'
import { DEPLOYMENT_MAX_SCALING } from "../../config"

export const DeploymentUpdate = object({
    name: pattern(string(), /^[a-z]{1}[a-z0-9-]{2,}$/),
    image: string(),
    httpPorts: defaulted(object(), {}),
    memLimit: defaulted(string(), "1000m"),
    cpus: defaulted(number(), 1),
    env: defaulted(array(string()), []),
    scale: defaulted(number(), () => 2)
})

export const ScaleCheck = refine(
    number(),
    'min 1, max ' + DEPLOYMENT_MAX_SCALING,
    v => v >= 1 && v <= DEPLOYMENT_MAX_SCALING
)