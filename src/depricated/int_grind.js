/** @param {import("../").NS} ns */
export async function main(ns) {
	if (ns.getPlayer().skills.intelligence < 255) {
		ns.run('join-factions.js');
		await ns.sleep(100)
		ns.singularity.softReset('int_grind.js');
	} else { ns.run('initRun.js') }
}