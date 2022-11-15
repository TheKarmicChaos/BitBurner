import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("..").NS} ns */
export async function main(ns) {
	//ns.tail('mp_nuke-backdoor.js'); ns.disableLog("ALL"); ns.clearLog();
	
	let [ serversList, servDict ] = nstb.ScanAll(ns);
	await AutoNuke(serversList);
	await BackdoorAll( tb.ArrSubtract(serversList, ['home', 'w0r1d_d43m0n']) );

	async function AutoNuke(servs) {
		for (let servname of servs) { // iterate through every server in servs
			// if we don't have root access
			if (!(ns.hasRootAccess(servname))) {

				// Open all server ports (that you can)
				var openports = 0;
				if (ns.fileExists("BruteSSH.exe", "home")) { ns.brutessh(servname); ++openports }
				if (ns.fileExists("FTPCrack.exe", "home")) { ns.ftpcrack(servname); ++openports }
				if (ns.fileExists("relaySMTP.exe", "home")) { ns.relaysmtp(servname); ++openports }
				if (ns.fileExists("HTTPWorm.exe", "home")) { ns.httpworm(servname); ++openports }
				if (ns.fileExists("SQLInject.exe", "home")) { ns.sqlinject(servname); ++openports }

				// If we now meet the minimum requirements to nuke the server, nuke it
				if (ns.getServerRequiredHackingLevel(servname) <= ns.getHackingLevel() && ns.getServerNumPortsRequired(servname) <= openports) {
					await ns.nuke(servname);
				}
			}
		}
	}

	async function BackdoorAll(servs) {
		for (let node of servs) {
			let GLOBAL_VARS = nstb.getGlobals(ns);
			let backdooredServs = GLOBAL_VARS["backdoors"]
			// if we have root access but no backdoor
			if (ns.hasRootAccess(node) && !backdooredServs.includes(node)) {
				 // get at least 2 connections away from node, to test backdoor
				if (node != 'darkweb') { ns.singularity.connect('home'); ns.singularity.connect('darkweb'); }
				else if (node == 'darkweb') { ns.singularity.connect('home'); ns.singularity.connect('n00dles'); }

				// If we can already backdoor connect to this node, add it to the port 6 array and move on
				if (ns.singularity.connect(node)) { backdooredServs.push(node); nstb.updGlobals(ns, ["backdoors", backdooredServs]) }
				// otherwise, this node still needs a backdoor, so install one
				else {
					ConnectTo(node);
					await ns.singularity.installBackdoor(); // install a backdoor
					ns.toast("Installed Backdoor on " + node, "info", 2000);
					backdooredServs.push(node);
					nstb.updGlobals(ns, ["backdoors", backdooredServs]); // update port array
				}
				ns.singularity.connect('home');
			}
		}
	}

	async function ConnectTo(servname) {
		if (servname == 'home') {
			ns.singularity.connect('home');
		} else {
			var parent = servDict[servname];
			// if we can't connect to this node's parent, run this function recursively on its parent
			if (!(ns.singularity.connect(parent))) { ConnectTo(parent) }
			ns.singularity.connect(servname) // Then connect to this node.
		}
	}
}