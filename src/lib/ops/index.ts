import { ChildProcessWithoutNullStreams } from 'child_process';

export interface BuildOptions {
    imageName?: string;
    mounts?: string[];
    configPath?: string;
}

export interface RunOptions {
    configPath?: string;
    imageName?: string;
    mounts?: string[];
}

export interface StartInstanceOptions {
    instanceName?: string;
    ports?: string;
    udpPorts?: string;
}

export interface Ops {
    build(filePath: string, options: BuildOptions): ChildProcessWithoutNullStreams;
    run(filePath: string, options?: RunOptions): ChildProcessWithoutNullStreams;
    startInstance(name: string, options: StartInstanceOptions): ChildProcessWithoutNullStreams;
    stopInstance(name: string): ChildProcessWithoutNullStreams;
    listInstances(): string[];
    listImages(): string[];
    listVolumeIDWithName(): string[];
}