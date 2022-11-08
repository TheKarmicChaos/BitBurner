/** @param {import("../").NS} ns */
export async function main(ns) {
	ns.killall("home");
	await ns.sleep(1000);
	ns.run('hud.js', 1, "clear");
	await ns.sleep(2000);
	ns.run('main.js');
}