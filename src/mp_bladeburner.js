import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("..").NS} ns */
export async function main(ns) {
	//ns.tail('mp_bladeburner.js'); ns.disableLog("ALL"); ns.clearLog();

    while (!await nstb.RunCom(ns, 'ns.bladeburner.joinBladeburnerDivision()')) await ns.sleep(10000);
    nstb.updGlobals(ns, ["bb.has", true, "bb.want", false]);


    const player = ns.getPlayer();
    const ownedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()', [true]);
    const installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()');
    const GLOBAL_VARS = nstb.getGlobals(ns);

    const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
    let [curSta, maxSta] = await nstb.RunCom(ns, 'ns.bladeburner.getStamina()')
    let curCity = await nstb.RunCom(ns, 'ns.bladeburner.getCity()'); // get current city
    let curRank = await nstb.RunCom(ns, 'ns.bladeburner.getRank()'); // get current rank
    const curAct = () => ns.bladeburner.getCurrentAction();

    const shouldRecover = (/*player.hp.current / player.hp.max < 0.5 ||*/ curSta / maxSta < 0.80)
    const hasSimu = GLOBAL_VARS["bb"]["hasSimu"]

    // Main function calls ---------------------------------
    if (!hasSimu && installedAugs.includes("The Blade's Simulacrum")) // update global "hasSimu" if the aug is now fully installed.
        nstb.updGlobals(ns, ["bb.hasSimu", true]);
    if (player.factions.includes("Bladeburners") && !ownedAugs.includes("The Blade's Simulacrum")) // try to get Simu if it isn't yet owned
        await TryToGetSimu();
    await updateCity();
    await levelSkills();
    if (player.numPeopleKilled >= 30 && !GLOBAL_VARS["gang"]["want"] && (hasSimu || !ns.singularity.isBusy() || ns.singularity.getCurrentWork().type != "GRAFTING")) {
        // If we don't have simu, stop our non-bladeburner action
        if (!hasSimu) await nstb.RunCom(ns, 'ns.singularity.stopAction()');
        // if we are not at max health or stamina, recover.
        if (shouldRecover && curAct().name != 'Hyperbolic Regeneration Chamber')
            ns.bladeburner.startAction('General', 'Hyperbolic Regeneration Chamber');
        // if we are not currently recovering back to full stamina, start automating actions.
        else if (!(shouldRecover && curAct().name == 'Hyperbolic Regeneration Chamber'))
            await doNextAction();
    }

    // Function definitions --------------------------------
    async function TryToGetSimu() {
        const bbRep = await nstb.RunCom(ns, 'ns.singularity.getFactionRep()', ["Bladeburners"]);
        const repReq = await nstb.RunCom(ns, 'ns.singularity.getAugmentationRepReq()', ["The Blade's Simulacrum"]);
        const cost = await nstb.RunCom(ns, 'ns.singularity.getAugmentationPrice()', ["The Blade's Simulacrum"]);
        if (bbRep >= repReq && player.money >= cost) {
            if (await nstb.RunCom(ns, 'ns.singularity.purchaseAugmentation()', ["Bladeburners", "The Blade's Simulacrum"]))
                ns.toast("B> Augment The Blade's Simulacrum", "info", 2000);
        }
    }

    async function updateCity() {
        let [bestCity, bestPop] = await getBestCity(); // city with highest population
        let curCityPop = await nstb.RunCom(ns, 'ns.bladeburner.getCityEstimatedPopulation()', [curCity]); 
        // If current city's pop is < 1b or 20% less than best city pop, switch to best city
        if (curCityPop < 1e9 || curCityPop < bestPop * 0.8) await nstb.RunCom(ns, 'ns.bladeburner.switchCity()', [bestCity]);
        curCity = await nstb.RunCom(ns, 'ns.bladeburner.getCity()'); // update current city
        nstb.updGlobals(ns, ["bb.city", curCity])
    }

    async function getBestCity() {
        let bestCity = null;
        let bestPop = 0;
        for (let city of cities) {
            let cityPop = await nstb.RunCom(ns, 'ns.bladeburner.getCityEstimatedPopulation()', [city])
            if (bestCity == null || bestPop < cityPop) {
                bestCity = city;
                bestPop = cityPop;
            }
            await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Tracking']);
        }
        return [bestCity, bestPop]
    }

    async function doNextAction() {
        let [trackLo, trackHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Tracking']);
        let [bountyLo, bountyHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Bounty Hunter']);
        let bountyCount = await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Contracts', 'Bounty Hunter']);
        let [raidLo, raidHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Operations', 'Raid']);
        let raidCount = await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Operations', 'Raid']);
        let [assLo, assHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Operations', 'Assassination']);
        let assCount = await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Operations', 'Assassination'])

        let doneOps = GLOBAL_VARS["bb"]["doneOps"]
        let blackOpList = tb.ArrSubtract(await nstb.RunCom(ns, 'ns.bladeburner.getBlackOpNames()'), doneOps)
        if (blackOpList.length == 0) nstb.updGlobals(ns, ["isComplete", true]);
        let nextBlackOp = blackOpList[0]
        let [blackLo, blackHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['BlackOps', nextBlackOp]);
        let blackOpReq = await nstb.RunCom(ns, 'ns.bladeburner.getBlackOpRank()', [nextBlackOp]);

        let cityChaos = await nstb.RunCom(ns, 'ns.bladeburner.getCityChaos()', [curCity]);
        let actType;
        let actName;
        let sleeveShock = GLOBAL_VARS["sleeve"]["shock"]
        // Determine what our best action would be
        if (sleeveShock > 0 && cityChaos > 4) {
            actType = "General";
            actName = "Diplomacy";
        } else if (sleeveShock > 0 && Math.max(trackHi - trackLo, bountyHi - bountyLo, raidHi - raidLo, assLo - assHi) > 0) {
            actType = "General";
            actName = "Field Analysis";
        } else if (assLo >= 1 && blackLo >= 0.33 && blackOpReq <= curRank) {
            actType = "BlackOps";
            if (curAct().name != nextBlackOp) {
                if (!ns.bladeburner.startAction(actType, nextBlackOp)) {
                    doneOps.push(nextBlackOp);
                    nstb.updGlobals(ns, ["doneOps", doneOps])  // update global
                };
            }
        } else if (assLo >= 0.4 && assCount > 0) {
            actType = "Operations";
            actName = "Assassination";
        } else if (raidLo >= 0.4 && raidCount > 0) {
            actType = "Operations";
            actName = "Raid";
        } else if (bountyLo >= 0.4 && bountyCount > 0) {
            actType = "Contracts";
            actName = "Bounty Hunter";
        } else {
            actType = "Contracts";
            actName = "Tracking";
        }
        // Start doing our best action (excluding blackops) if we aren't already.
        if (actType != "BlackOps" && curAct().name != actName) ns.bladeburner.startAction(actType, actName);
    }

    async function levelSkills() {
        switch (curAct().name) {
            case "Diplomacy":
                await levelUpSelection(["Blade's Intuition", "Overclock"]);
                break;
            case "Field Analysis":
                await levelUpSelection(["Blade's Intuition", "Overclock"]);
                break;
            case "Assassination":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Digital Observer", "Short-Circuit", "Cloak", "Evasive System", "Reaper", "Cyber's Edge", "Datamancer", "Hands of Midas", "Hyperdrive"]);
                break;
            case "Raid":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Cyber's Edge", "Digital Observer", "Short-Circuit"]);
                break;
            case "Bounty Hunter":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Cyber's Edge", "Tracer", "Short-Circuit", "Datamancer", "Hands of Midas", "Hyperdrive"]);
                break;
            case "Tracking":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Cyber's Edge", "Tracer", "Cloak", "Datamancer", "Hands of Midas", "Hyperdrive"]);
                break;
            default:
                await levelUpSelection(["Blade's Intuition", "Overclock", "Digital Observer", "Short-Circuit", "Cloak", "Evasive System", "Reaper", "Cyber's Edge", "Datamancer", "Hands of Midas", "Hyperdrive"]);
                break;
        }
    }

    async function levelUpSelection(skills) {
        let sp = await nstb.RunCom(ns, 'ns.bladeburner.getSkillPoints()');
        let bestSkill = null;
        let bestSkillCost = null;
        for (let skill of skills) {
            // Stop certain skill upgrades at certain levels
            let skillLv = await nstb.RunCom(ns, 'ns.bladeburner.getSkillLevel()', [skill]);
            if (skill == "Overclock" && skillLv >= 90) continue;
            if (["Short-Circuit", "Cloak"].includes(skill) && skillLv >= 30) continue;
            if (["Evasive System", "Reaper"].includes(skill) && skillLv >= 15) continue;
            if (skill == "Tracer" && skillLv >= 10) continue;
            if (["Hands of Midas", "Hyperdrive", "Datamancer", "Cyber's Edge"].includes(skill) && skillLv >= 5) continue;
            // Get skill cost, and multiply it by 2 if it's not a high priority.
            let skillCost = await nstb.RunCom(ns, 'ns.bladeburner.getSkillUpgradeCost()', [skill]);
            if (["Evasive System", "Reaper", "Cyber's Edge", "Datamancer", "Hands of Midas", "Hyperdrive"].includes(skill)) skillCost *= 2;
            // If this upgrade is the cheapest thus far, remember it.
            if (bestSkillCost == null || bestSkillCost > skillCost) {
                bestSkill = skill;
                bestSkillCost = skillCost;
            }
        }
        ns.print(`sp: ${sp}\nbestSkill: ${bestSkill}\nbestSkillCost: ${bestSkillCost}`)
        // Otherwise, if we can afford the best skill, buy it.
        if (["Evasive System", "Reaper", "Cyber's Edge", "Datamancer", "Hands of Midas", "Hyperdrive"].includes(bestSkill)) bestSkillCost /= 2;
        if (sp >= bestSkillCost) await nstb.RunCom(ns, 'ns.bladeburner.upgradeSkill()', [bestSkill]);
    }
}