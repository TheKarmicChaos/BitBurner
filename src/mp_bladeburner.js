import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.tail('mp_bladeburner.js'); //ns.disableLog("ALL"); ns.clearLog();

    while (!await nstb.RunCom(ns, 'ns.bladeburner.joinBladeburnerDivision()')) await ns.sleep(10000);
    nstb.UpdPort(ns, 9, "dict", ["hasBB", true, "wantBB", false]);


    const player = ns.getPlayer();
    const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
    let [curSta, maxSta] = await nstb.RunCom(ns, 'ns.bladeburner.getStamina()')
    let curCity = await nstb.RunCom(ns, 'ns.bladeburner.getCity()'); // get current city
    const curAct = () => ns.bladeburner.getCurrentAction();

    const shouldRecover = (/*player.hp.current / player.hp.max < 0.5 ||*/ curSta / maxSta < 0.80)
    const hasSimu = nstb.PeekPort(ns, 9)["hasSimu"]

    // Main function calls ---------------------------------
    await updateCity();
    await levelSkills();
    if (hasSimu || !ns.singularity.isBusy() || ns.singularity.getCurrentWork().type != "GRAFTING") {
        if (!hasSimu) await nstb.RunCom(ns, 'ns.singularity.stopAction()');

        // if we are not at max health or stamina, recover.
        if (shouldRecover && curAct().name != 'Hyperbolic Regeneration Chamber') {
            ns.bladeburner.startAction('General', 'Hyperbolic Regeneration Chamber')
        }
        // if we are not currently recovering back to full stamina, start automating actions.
        else if (!(shouldRecover && curAct().name == 'Hyperbolic Regeneration Chamber')) {
            await doNextAction();
        }
    }

    // Function definitions --------------------------------
    async function updateCity() {
        let [bestCity, bestPop] = await getBestCity(); // city with highest population
        let curCityPop = await nstb.RunCom(ns, 'ns.bladeburner.getCityEstimatedPopulation()', [curCity]); 
        // If current city's pop is < 1b or 20% less than best city pop, switch to best city
        if (curCityPop < 1e9 || curCityPop < bestPop * 0.8) await nstb.RunCom(ns, 'ns.bladeburner.switchCity()', [bestCity]);
        curCity = await nstb.RunCom(ns, 'ns.bladeburner.getCity()'); // update current city
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

        let cityChaos = await nstb.RunCom(ns, 'ns.bladeburner.getCityChaos()', [curCity]);
        let actType;
        let actName;
        let sleeveShock = nstb.PeekPort(ns, 6)["sleeveShock"]
        // Determine what our best action would be
        if (sleeveShock > 0 && cityChaos > 4) {
            actType = "General";
            actName = "Diplomacy";
        } else if (sleeveShock > 0 && Math.max(trackHi - trackLo, bountyHi - bountyLo, raidHi - raidLo, assLo - assHi) > 0) {
            actType = "General";
            actName = "Field Analysis";
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
        // Start doing our best action if we aren't already.
        if (curAct().name != actName) ns.bladeburner.startAction(actType, actName);
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
                await levelUpSelection(["Blade's Intuition", "Overclock", "Digital Observer", "Short-Circuit", "Cloak"]);
                break;
            case "Raid":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Digital Observer", "Short-Circuit"]);
                break;
            case "Bounty Hunter":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Tracer", "Short-Circuit"]);
                break;
            case "Tracking":
                await levelUpSelection(["Blade's Intuition", "Overclock", "Tracer", "Cloak"]);
                break;
            default:
                await levelUpSelection(["Blade's Intuition", "Overclock"]);
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
            // If this upgrade is the cheapest thus far, remember it.
            let skillCost = await nstb.RunCom(ns, 'ns.bladeburner.getSkillUpgradeCost()', [skill]);
            if (bestSkillCost == null || bestSkillCost > skillCost) {
                bestSkill = skill;
                bestSkillCost = skillCost;
            }
        }
        ns.print(`sp: ${sp}\nbestSkill: ${bestSkill}\nbestSkillCost: ${bestSkillCost}`)
        // If we can afford the best skill, buy it.
        if (sp >= bestSkillCost) await nstb.RunCom(ns, 'ns.bladeburner.upgradeSkill()', [bestSkill]);
    }
}