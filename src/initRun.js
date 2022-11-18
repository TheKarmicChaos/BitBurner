/** @param {import("../").NS} ns */
export async function main(ns) {
	ns.killall("home");
	await ns.sleep(900);
	ns.run('hud.js', 1, "clear");
	await ns.sleep(100);
	ns.run('main.js');
}