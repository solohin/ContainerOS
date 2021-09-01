import consulInstance from "./consul/consulInstance";
import safePatch from "./consul/safepatch";

export async function getStack(stackName: string): Promise<DockerStack> {
    const result = await consulInstance.kv.get(`stacks/${stackName}`)
    console.log('getStack result', result)
    return JSON.parse(result?.Value || JSON.stringify(getEmptyStack(stackName)))
}

function getEmptyStack(stackName: string): DockerStack {
    return {
        version: "3.9",
        services: {},
        networks: {
            [stackName]: null,
            caddy: { external: true }
        },
    }
}

export function updateStack(stackName: string, patch: (oldValue: DockerStack) => DockerStack): Promise<void> {
    const defaultString = JSON.stringify(getEmptyStack(stackName))
    return safePatch(`stacks/${stackName}`, patch, defaultString)
}


export interface DockerStack {
    version: "3.9";
    services: {
        [key: string]: DockerStackService;
    };
    networks: {
        [key: string]: null | { external: boolean };
    };
}

export interface DockerStackService {
    environment?: {
        [key: string]: string;
    };
    image: string;
    networks: {
        [key: string]: {
            aliases: string[];
        }
    };
    command?: string;
    ports?: string[];
    labels?: {
        [key: string]: string;
    }
}
