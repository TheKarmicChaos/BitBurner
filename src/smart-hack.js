/** @param {import("../").NS} ns */
export async function main(ns) {
	var target = ns.args[0];
	var actionID = ns.args[1];
	var opts = {};
	opts.stock = ns.args[2];

	if (actionID == 0) { await ns.weaken(target) }
	else if (actionID == 1) { await ns.grow(target, opts) }
	else { await ns.hack(target, opts) }
}