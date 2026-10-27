// Stand-in for the `cloudflare:workers` module, which only exists inside the Workers runtime.
export class DurableObject<Env = unknown> {
    ctx: DurableObjectState;
    env: Env;

    constructor(ctx: DurableObjectState, env: Env) {
        this.ctx = ctx;
        this.env = env;
    }
}
