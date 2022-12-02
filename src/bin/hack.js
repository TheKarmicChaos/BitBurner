/** @param {import("../..").NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let beginT  = ns.args[1];
    let opts = { stock: ns.args[2] };

    if (beginT > performance.now()) {
        await ns.sleep(beginT - performance.now());
    }
    
    await ns.hack(target, opts);
}