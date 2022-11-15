===========================
        Global Vars:
===========================
{
	bnMults: {},
	sourceFiles: [ {"n": 1, "lvl": 3}, {"n": 2, "lvl" 2}, ... ],
	strats: {},
	backdoors: ["home"],
	bitNode: 0,
	runType: "",
	income: { base: 0, hacknet: 0, gang: 0, corp: 0, playerCrime: 0, sleeveCrime: 0, playerWork: 0, sleeveWork: 0, hacking: 0, bladeburner: 0 },
	hash: { count: 0, income: 0, max: 1 },
	sleeve: { shock: 100 },
	gang: { want: false, has: false, territory: 0, respect: 0},
	corp: { want: false, has: false, hasProd: false, hasLab: false, hasTAII: false, research: 0, funds: 0, profit: 0, products: [] },
	bb: { want: false, has: false, hasSimu: false, city: "Sector-12", doneOps: ["failsafe"], allOpsDone: false }
}

===========================
    File Name Prefixes:
===========================

Prefix  | Unabbreviation        | Description
--------+-----------------------+--------------------------
lp_     | looping               | When this file is run, it will loop forever, remaining constantly active. Must be killed to stop.
op_     | one pass              | Runs once when called, and quickly ends with minimal delay/loops. Will not run again until called again.
mp_     | mixed/multi pass      | Either an lp_ file that switches to op_ if a condition is met, OR an op_ file with a delay/loop that can cause it to run for extended periods.



