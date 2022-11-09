import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	ns.closeTail(); await ns.sleep(1); ns.tail('lp_gang.js'); await ns.sleep(1); ns.resizeTail(340, 60); await ns.sleep(1); ns.moveTail(1500, 225);
	ns.disableLog("ALL"); ns.clearLog();

	let player = await nstb.RunCom(ns, 'ns.getPlayer()');

	// Prep phase (getting a gang)
	// ==============================================================================================
	await TrackKarma();
	while (!(await nstb.RunCom(ns, 'ns.gang.inGang()'))) {
		await TrackKarma();
		await nstb.RunCom(ns, 'ns.gang.createGang()', ['Slum Snakes']);
		ns.clearLog(); ns.print("Generating Karma...");
		await ns.sleep(1000);
	}

	nstb.UpdPort(ns, 7, "dict", ["wantGang", false, "hasGang", true]); // Update port, since we now have a gang.
	ns.run("hud.js", 1, "upd", "gangtimer"); // Clear HUD gang timer
	ns.resizeTail(385, 675); await ns.sleep(1); ns.moveTail(1455, 225); // Resize tail window to fit the increased info we will print.


	// Sets DEFAULT VARIABLES (DONT CHANGE ANYTHING)
	// ==============================================================================================
	let loops = 0;	// keeps track of loops
	let rnkmem = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; 	// Set default ascension ranks of members. Members are named Thug-0, Thug-1, etc
	let memlocalMult = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Relative multiplier for gang member
	let memascThresh = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Threshold for gang member to ascend
	let didasc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];// Did we ascend?
	let warfare = false; // Set territory warfare to false	
	var gangt0 = 0; var gangt1 = 0; var gangt2 = 0; let gangtx = 0; // Set default gang territory (need more variables as turnover is longer)
	let ganginwar = 0; // Set counter for number members in territory warfare
	let resCap = 0; // current cap for generating respect. when reached, highest priority will be money making.
	const hackingEquipment = // array of equipment for hacking gangs (we ignore these)
		["NUKE Rootkit", "Soulstealer Rootkit", "Demon Rootkit", "Hmap Node",
		"Jack the Ripper", "DataJack", "Neuralstimulator",  "BitWire"];


	// Settings for tinkering (these will not change unless done by hand)
	// ==============================================================================================
	// Misc Settings ---------------
	const lenCom = 13;  //Text length of gang member's task displayed
	const buyStuff = true; //Can gang members buy equipment?
	const defaulttask = "Train Combat"; //Default task if no criteria met
	const sleepdelay = 2000; // Pause in milliseconds between each loop

	// War Settings ----------------
	const warguysmin = 3;	// Number of gang members to engage in territory warfare when above warchance. Will be set to 0 once at 100% territory
	const warguysmax = 11;	// Number of gang members to engage in territory warfare when below warchance
	let warguys = warguysmax; // Starting value
	const warchance = 0.61; // Minimum win chance before we start war with gangs
	const minwarguys = 12;

	// Ascension Settings ----------
	const ascend = true; // do we check ascensions?
	const equiprank = 2; // Rank at which members can buy equipment (default: 2)
	const rnkThresh = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64]; // Rank Ascension Multiplier Thresholds
	// i.e. rank 0 is when gang mem has an avg combat stat asc multiplier >= (x1) 
	//		rank 1 is >=(x2)
	//		rank 2 is >=(x4)
	//		rank 3 is >=(x6), etc.
	const minmult = 1.50	// 1.5 minimum (relative) multiplier before we ascend if at the final rank

	// Vigilante Settings -----------
	const minVResp = 1;	// Minimum respect to do vigilante work
	const minVPen = 10;	// If Penalty above this then do vigi work
	const minVWant = 5;	// If Wanted level above this then do vigi
	const minVRank = 2;	// Minimum member ascension rank to vigi


	// Variable declarations (stats to update and keep track of as we loop)
	// ==============================================================================================
	let myGang = await nstb.RunCom(ns, 'ns.gang.getGangInformation()');
	player = await nstb.RunCom(ns, 'ns.getPlayer()');
	let allEquipment = await nstb.RunCom(ns, 'ns.gang.getEquipmentNames()');
	let curResp2 = myGang.respect;
	var curResp = ns.nFormat(curResp2, "0,0.a");
	let members = await nstb.RunCom(ns, 'ns.gang.getMemberNames()');
	let ganginfo = await nstb.RunCom(ns, 'ns.gang.getGangInformation()');
	gangtx = ganginfo.territory;
	curResp = ganginfo.respect;
	let curWant = ganginfo.wantedLevel;
	let curPena2b = ganginfo.wantedLevel / ganginfo.respect * 100;


	// Main "while" loop
	// ==============================================================================================
	while (true) {
		ns.clearLog();
		await UpdateStats();
		await Recruit();
		await BuyEquipment();
		await AssignTasks();
		await Ascend();
		await ShowStats();
		loops++; // Increment loop counter
		await ns.sleep(sleepdelay);
	}


	// Functions
	// ==============================================================================================

	/** Track our karma gain rate to create a HUD timer estimating how long until we get a gang. */
	async function TrackKarma() {
		var augs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()')
		var hasNMI = augs.includes('Neuroreceptor Management Implant')
		var karma = ns.heart.break();

		let curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()');
		let playerkps = 0; 
		let plcrime;
		if (curWork != null && curWork.type == 'CRIME') {
			plcrime = curWork.crimeType
			playerkps = await nstb.GetCrimeGains(ns, plcrime, "karma")
		}

		let numsleeves = await nstb.RunCom(ns, 'ns.sleeve.getNumSleeves()')
		var sleevekps = 0;
		for (var x = 0; x < numsleeves; ++x) {
			let sltask = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [x])
			if (sltask != null && sltask.type == "CRIME") {
				sleevekps += await nstb.GetCrimeGains(ns, sltask.crimeType, "karma", await nstb.GetSleeveCrimeChance(ns,  x, sltask.crimeType))
			}
		}

		if (!(await nstb.RunCom(ns, 'ns.singularity.isFocused()')) && !hasNMI) { playerkps *= 0.8 }
		let totalkps = playerkps + sleevekps
		var tUntilGang = Math.ceil((54000 - Math.abs(karma)) / totalkps)

		if (tUntilGang > 0 && totalkps > 0 && !nstb.PeekPort(ns, 7)["hasGang"]) {
			ns.run("hud.js", 1, "upd", "gangtimer", "Gang in", tb.StandardTime(tUntilGang));
		} else { ns.run("hud.js", 1, "upd", "gangtimer"); }
	}

	/** Updates all variable stats that need updating each loop. */
	async function UpdateStats() {
		myGang = await nstb.RunCom(ns, 'ns.gang.getGangInformation()');
		player = await nstb.RunCom(ns, 'ns.getPlayer()');
		allEquipment = await nstb.RunCom(ns, 'ns.gang.getEquipmentNames()');
		curResp2 = myGang.respect;
		curResp = ns.nFormat(curResp2, "0,0.a");
		members = await nstb.RunCom(ns, 'ns.gang.getMemberNames()');
		ganginfo = await nstb.RunCom(ns, 'ns.gang.getGangInformation()');
		gangtx = ganginfo.territory;
		curResp = ganginfo.respect;
		curWant = ganginfo.wantedLevel;
		curPena2b = ganginfo.wantedLevel / ganginfo.respect * 100;

		//Reset check for gang members in territory warfare & reset warfare status
		ganginwar = 0;
		warfare = false;
		didasc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Reset "Did we ascend?"
	}

	/** Recruits more thugs if possible. */
	async function Recruit() {
		var canrecruitmore = await nstb.RunCom(ns, 'ns.gang.canRecruitMember()');
		while (canrecruitmore == true) {
			members = await nstb.RunCom(ns, 'ns.gang.getMemberNames()');
			var didrecruit = await nstb.RunCom(ns, 'ns.gang.recruitMember()', ["Thug-" + members.length]);
			if (didrecruit == true) { ns.toast("RECRUITED: Thug-" + members.length, "warning", 10000) }
			canrecruitmore = await nstb.RunCom(ns, 'ns.gang.canRecruitMember()');
			await ns.sleep(10);
		}
	}

	/** Iterates through all thugs, records their ascension data, and ascends them if they meet the requirements. */
	async function Ascend() {
		if (ascend) {
			for (let ij = 0; ij < members.length; ++ij) {
				let member = members[ij];

				// Get member stats again
				var memberInfo = await nstb.RunCom(ns, 'ns.gang.getMemberInformation()', [member]);
				var memAvgmulti = (memberInfo.str_asc_mult + memberInfo.def_asc_mult + memberInfo.dex_asc_mult + memberInfo.agi_asc_mult) / 4

				// (To get CURRENT multiplier use memberInfo.str_asc_mult)
				// Now get member FUTURE multipliers (returns a multiple)
				var localData = ns.gang.getAscensionResult(member);
				var localMult;
				if (localData == null) { localMult = 0; }
				else { localMult = (localData.str + localData.def + localData.dex + localData.agi) / 4 }

				if (localMult == null) { memlocalMult[ij] = 0; }// NULL means we can't ascend
				else { memlocalMult[ij] = Number(localMult); } // Store this data for later

				// Determine and update their current ascension rank
				var currnk = 0;
				for (let x = 0; x < rnkThresh.length; ++x) { if (memAvgmulti >= rnkThresh[x]) currnk = x; }
				var nextrankThresh; var nextrankReq;
				if (currnk < (rnkThresh.length - 1)) { nextrankThresh = rnkThresh[currnk + 1] / memAvgmulti }
				else {
					nextrankReq = (rnkThresh[currnk] * minmult);
					while (nextrankReq <= memAvgmulti) { nextrankReq *= minmult; currnk += 1; }
					nextrankThresh = nextrankReq / memAvgmulti;
				}

				// Ascend if requirements are met
				if (localMult > nextrankThresh) {
					ns.toast("Ascended Thug-" + ij + "(Asc #" + currnk + ")", "warning", 1000)
					await nstb.RunCom(ns, 'ns.gang.ascendMember()', [member]);
					didasc[ij] = 1;
					//ns.print(`${ij}: Ascended to ${currnk + 1}`)
				}

				// Store this data for later
				memascThresh[ij] = Number(nextrankThresh);
				rnkmem[ij] = currnk;
			}
		}
	}

	/** Iterates through all thugs, buying them missing equipment. */
	async function BuyEquipment() {
		for (let ij = 0; ij < members.length; ++ij) {
			var member = members[ij];
			var memberInfo = await nstb.RunCom(ns, 'ns.gang.getMemberInformation()', [member]);
			// ns.print(memberInfo)

			if (buyStuff) {
				var didbuy = false; var totalCost = 0; var eqStr = "";
				//ns.print(allEquipment)
				for (var j = 0; j < allEquipment.length; ++j) {
					var equipment = allEquipment[j]; //ns.print("Checking: ", equipment); // DEBUG
					// If thug at certain rank & doesn't have NON-HACKING stuff, buy it
					if ((memberInfo.upgrades.indexOf(equipment) == -1 || memberInfo.augmentations.indexOf(equipment) == -1) && rnkmem[ij] >= equiprank && !hackingEquipment.includes(equipment)) {
						var cost = await nstb.RunCom(ns, 'ns.gang.getEquipmentCost()', [equipment]); var costMulti = 80;
						//ns.print()`CAN BUY: ${equipment} for $ ${cost}`);
						if (player.money >= (cost * (costMulti / rnkmem[ij]))) {
							//ns.print("BUYING: ", equipment); // DEBUG
							var gangbuy = await nstb.RunCom(ns, 'ns.gang.purchaseEquipment()', [member, equipment]);
							//ns.print("Was bought?: " + gangbuy); // DEBUG
							if (gangbuy) {
								totalCost += cost; eqStr += "  " + equipment;
								if (didbuy == false) { didbuy = true }
							}
						}
					}
				}
				if (didbuy) { ns.toast("B>Equipment @" + member + "(-$" + tb.StandardNotation(totalCost, 3) + "): " + eqStr.substring(0, 30), "warning", 2000); }
			}
		}
	}

	/** Iterates through all thugs, assigning them tasks and printing their stats to log. */
	async function AssignTasks() {
		var getGang = await nstb.RunCom(ns, 'ns.gang.getGangInformation()');
		for (let ij = 0; ij < members.length; ++ij) {
			// Get member variables
			var member = members[ij];
			var memberInfo = await nstb.RunCom(ns, 'ns.gang.getMemberInformation()', [member]);
			var memstr = memberInfo.str;	// Strength
			var memdef = memberInfo.def;	// Defence
			var memdex = memberInfo.dex;	// Dexterity
			var memagi = memberInfo.agi;	// Agility
			var memavg = (memstr + memdef + memdex + memagi) / 4
			var memAvgmulti = (memberInfo.str_asc_mult + memberInfo.def_asc_mult + memberInfo.dex_asc_mult + memberInfo.agi_asc_mult) / 4;
			var memAvgmultiStr = tb.StandardNotation(memAvgmulti, 1);

			var memResCap = ((ganginfo.territory ** 4) * (rnkmem[ij] ** 2) * memstr * 200)
			if (memResCap > resCap) { resCap = memResCap }
			resCap = Math.min(resCap, 5e9) // 5b respect hard cap

			var gangtask;

			// TOP PRIORITY: lower wanted level if too high
			if (curResp > minVResp && curPena2b > minVPen && curWant > minVWant && rnkmem[ij] > minVRank) {
				gangtask = "Vigilante Justice"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]);
			}
			// TOP PRIORITY: If very close to ranking up, train until that happens
			else if (memascThresh[ij] - mult <= 0.05) { gangtask = "Train Combat"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }

			// Step 1a: Train until rank 2
			else if (rnkmem[ij] < 2 || memavg < 500) { gangtask = "Train Combat"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }
			// Step 1b: Generate respect until we have 11 members
			else if (members.length < 11) { gangtask = "Terrorism"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }
			// Step 1c: Train until rank 4 and have decent stats
			else if (rnkmem[ij] < 4 || memavg < (300 * rnkmem[ij])) { gangtask = "Train Combat"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }
			// Step 1d: Generate respect until we have 12 members and at least 1m resp
			else if (members.length < 12 || curResp2 < 1e6) { gangtask = "Terrorism"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }

			// Step 2a: Train until this thug's rank matches that of the highest-ranked thug. (also slightly improve stats over step 1c )
			else if (rnkmem[ij] < tb.GetMaxOfArray(rnkmem) || memavg < (340 * rnkmem[ij])) { gangtask = "Train Combat"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }
			// Step 2b: If we want to do gang warfare and not enough thugs are assigned to it, assign this thug to warfare.
			else if (rnkmem[ij] >= tb.GetMaxOfArray(rnkmem) && members.length >= minwarguys && ganginwar < warguys && gangtx < 1) {
				//Check war chances against clans
				const dowewar = await checkgangwar(ns, warchance); //Warcheck function
				if (dowewar) {
					warfare = true;
					await nstb.RunCom(ns, 'ns.gang.setTerritoryWarfare()', [true], false);
					warguys = warguysmin; //ns.print("WARN War status changed: "+ warfare ); //DEBUG
				} else {
					await nstb.RunCom(ns, 'ns.gang.setTerritoryWarfare()', [false], false);
					warguys = warguysmax
				}
				if (ganginwar < warguys && ganginfo.territory < 1) {
					ganginwar = ganginwar + 1; // Increment counter for thugs in warfare
					gangtask = "Territory Warfare"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]);
				}
			}

			// Step 3a: Generate respect until we have at least 10m rep
			else if (curResp2 < 10e6) { gangtask = "Terrorism"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }
			// Step 3b: If player has low money (<$1b) and thug has high enough stats, generate money
			else if (memavg > (500 * rnkmem[ij]) && player.money <= 1e9) { gangtask = "Traffick Illegal Arms"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }

			// Step 4a: If respect is below the ever-scaling resCap, generate resp until it is reached.
			else if (curResp2 < resCap && memavg > (500 * rnkmem[ij])) { gangtask = "Terrorism"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }
			// Step 4b: Generate money IFF we meet the resCap, thug has great stats, and have good reason to generate money (territory >= 0.5 or low player money)
			else if (curResp2 >= resCap && memavg > (1000 * rnkmem[ij]) && (player.money <= (curResp2 * 100) || getGang.territory >= 0.5)) {
				gangtask = "Traffick Illegal Arms"; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]);
			}

			// DEFAULT: If all else above fails, set thug to default task
			else { gangtask = defaulttask; await nstb.RunCom(ns, 'ns.gang.setMemberTask()', [member, gangtask]); }


			// Print stats of thug -------------------------------------------------------------------
			var mult = tb.StandardNotation(memlocalMult[ij], 3); // ❌ Multiplier (cross)
			var memascThreshStr = tb.StandardNotation(memascThresh[ij], 2);
			var mstr = tb.StandardNotation(memstr, 0);	// 💪 Strength (muscle)
			var mdef = tb.StandardNotation(memdef, 0); // 🦴 Defense (bone)
			var mdex = tb.StandardNotation(memdex, 0); // 👀 Dexterity (eyes)
			var magi = tb.StandardNotation(memagi, 0); // 🦶 Agility (feet)

			ns.print(tb.TextFloat(39, member + " [" + gangtask.substring(0, lenCom) + "]", null, "🧠" + rnkmem[ij] + " x" + memAvgmultiStr));
			ns.print(tb.TextFloat(38, "💪" + mstr + " 🦴" + mdef + " 👀" + mdex + " 🦶" + magi, " ", "❌" + mult + "/" + memascThreshStr));
			//ns.print(memavg)
			//ns.print(((ganginfo.territory ** 3) * memstr * rnkmem[ij] * 1112.22))
		}
	}

	/** Checks chances of war against other gangs. */
	async function checkgangwar(ns, winchance) {
		var gangresult = true; // By default we CAN engage in warfare

		// Gang names for reference: Tetrads, The Syndicate, Speakers for the Dead
		//   The Black Hand, The Dark Army, NiteSec
		//const othergang = ns.gang.getOtherGangInformation();	// DEBUG
		//ns.print("Name : "+JSON.stringify(othergang['Tetrads']) ); //DEBUG
		//ns.print("Power: "+JSON.stringify(othergang['Tetrads'].power) ); //DEBUG
		//ns.print("Terro: "+JSON.stringify(othergang['Tetrads'].territory));//DEB
		//ns.print("Clash: "+ns.gang.getChanceToWinClash('Tetrads') ); //DEBUG

		// Get chances to win wars for all other gangs:
		var chantetr = await nstb.RunCom(ns, 'ns.gang.getChanceToWinClash()', ["Tetrads"]);
		var chansynd = await nstb.RunCom(ns, 'ns.gang.getChanceToWinClash()', ["The Syndicate"]);
		var chanspea = await nstb.RunCom(ns, 'ns.gang.getChanceToWinClash()', ["Speakers for the Dead"]);
		var chanblac = await nstb.RunCom(ns, 'ns.gang.getChanceToWinClash()', ["The Black Hand"]);
		var chandark = await nstb.RunCom(ns, 'ns.gang.getChanceToWinClash()', ["The Dark Army"]);
		var channite = await nstb.RunCom(ns, 'ns.gang.getChanceToWinClash()', ["NiteSec"]);
		//ns.print("Tetrads   %: " + ns.nFormat(chantetr, "0.00%")); //DEBUG
		//ns.print("Syndicate %: " + ns.nFormat(chansynd, "0.00%")); //DEBUG
		//ns.print("Speakers  %: " + ns.nFormat(chanspea, "0.00%")); //DEBUG
		//ns.print("Black Hand%: " + ns.nFormat(chanblac, "0.00%")); //DEBUG
		//ns.print("Dark Army %: " + ns.nFormat(chandark, "0.00%")); //DEBUG
		//ns.print("NiteSec   %: " + ns.nFormat(channite, "0.00%")); //DEBUG

		// Check chances are good for warfare, if not then don't engage 
		if (chantetr < winchance) { gangresult = false; }
		if (chansynd < winchance) { gangresult = false; }
		if (chanspea < winchance) { gangresult = false; }
		if (chanblac < winchance) { gangresult = false; }
		if (chandark < winchance) { gangresult = false; }
		if (channite < winchance) { gangresult = false; }

		//ns.print("INFO GangResult : " + gangresult ); //DEBUG
		if (gangresult == true) { return true; }
		if (gangresult == false) { return false; }

	}

	/** Prints general gang info to log (stats that are not thug-specific) and updates port data. */
	async function ShowStats() {
		var getGang = await nstb.RunCom(ns, 'ns.gang.getGangInformation()');
		var curResp = ns.nFormat(getGang.respect, "0,0.0a"); // Respect: 🩸Res
		var curRespCap = ns.nFormat(resCap, "0,0.0a"); // Respect Cap

		var curWant = ns.nFormat(getGang.wantedLevel, "0,0.0a");//Wanted level: 🔥W
		var curPena = ns.nFormat(myGang.wantedPenalty, "0.00a");//Penalty level: W
		var curPenaRatio = getGang.wantedLevel / getGang.respect * 100;//Penalty ratio
		var curPenaRatio2 = ns.nFormat(curPenaRatio, "0.00a"); //Nicer format

		gangt2 = gangt1; gangt1 = gangt0; gangt0 = gangtx;//Add territory history
		gangtx = getGang.territory;	// Get current territory history
		let gangt2p = ns.nFormat(gangt2, "0.00%"); // Convert to percentage
		let gangtxp = ns.nFormat(gangtx, "0.00%"); // Convert to percentage

		ns.print("#: " + loops + " 🩸Res: " + curResp + "/" + curRespCap + " 🔥W: " + curWant);
		ns.print("W Pen:" + curPena + "%" + "  Wan/Resp:" + curPenaRatio2 + "%");
		if (gangt2 == 1) { ns.print("🗡:" + warfare + "  ✊:" + ganginwar + "/" + warguys + "  🥥Tr: " + gangt2p); }
		else { ns.print("🗡:" + warfare + "  ✊:" + ganginwar + "/" + warguys + "  🥥Tr: " + gangt2p + "> " + gangtxp); }

		nstb.UpdPort(ns, 2, "dict", ["gang", 5 * ns.gang.getGangInformation().moneyGainRate])
		nstb.UpdPort(ns, 7, "dict", ["territory", gangtx])
	}
}