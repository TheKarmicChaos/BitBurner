/** @param {import("../..").NS} ns */
export async function main(ns) {
    let rootX = ns.args[0];
    let rootY = ns.args[1];

    await ns.stanek.chargeFragment(rootX, rootY);
}