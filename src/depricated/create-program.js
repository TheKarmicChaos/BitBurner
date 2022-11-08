/** @param {import("../").NS} ns */
export async function main(ns) {
	function CreateProgram() {
		var hackLv = ns.getHackingLevel();
		if ((!(ns.fileExists("BruteSSH.exe", "home"))) && (hackLv >= 50)) {
			ns.singularity.createProgram("BruteSSH.exe", true);
		} else if ((!(ns.fileExists("FTPCrack.exe", "home"))) && (hackLv >= 100)) {
			ns.singularity.createProgram("FTPCrack.exe", true);
		} else if ((!(ns.fileExists("relaySMTP.exe", "home"))) && (hackLv >= 250)) {
			ns.singularity.createProgram("relaySMTP.exe", true);
		} else if ((!(ns.fileExists("HTTPWorm.exe", "home"))) && (hackLv >= 500)) {
			ns.singularity.createProgram("HTTPWorm.exe", true);
		} else if ((!(ns.fileExists("SQLInject.exe", "home"))) && (hackLv >= 750)) {
			ns.singularity.createProgram("SQLInject.exe", true);
		}
	}

	CreateProgram();
}