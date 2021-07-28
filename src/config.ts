import delay from "delay"
import { keyable } from "./types"
import md5 from "md5"
import os from "os"

const genConsulKey = base => Buffer.from(md5(md5(base) + base)).toString('base64')

const config: keyable<any> = {
    CLUSTER_API_PORT: 8000,
    DEPLOYMENT_MAX_SCALING: 5,
    API_PASSWORD: "dev",
    CONSUL_IMAGE: 'quay.io/containeros/consul:1.10.1',
    NODE_NAME: os.hostname(),
    NODE_HEALTH_INTERVAL: 5 * 1000,
    CPU_OVERBOOKING_RATE: 3,
    MEMORY_OVERBOOKING_RATE: 3,
}

set("CONSUL_ENCRYPTION_KEY", genConsulKey(get("API_PASSWORD")))

function get(key: string) {
    if (typeof config[key] === "undefined") {
        throw "Config key " + key + " does not exist. May be you have to wait for it to appear?"
    }
    return config[key]
}

function set(key: string, value: any) {
    config[key] = value
}

async function waitAndGet(key: string) {
    for (let i = 0; i < 100; i++) {
        if (typeof config[key] === "undefined") {
            await delay(i * 100)
        }
    }
    return config[key]
}

//TODO: get from CLI
set("EXPECTED_CONTROLLER_IPS", [])

//ENV
const looksLikeTestEnv = process.env.NODE_ENV === "test"
    || process.env.npm_lifecycle_event === "test"
    || process.env.npm_lifecycle_event === "test-watch"
    || String(process.env._).endsWith('mocha')

set("ENV", looksLikeTestEnv ? "test" : "dev")
set("IS_TEST", get("ENV") === "test")
set("IS_DEV", get("ENV") === "dev")
set("IS_PROD", get("ENV") === "prod")

export default { get, set, waitAndGet }