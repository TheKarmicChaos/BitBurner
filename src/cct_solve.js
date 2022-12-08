import * as nstb from "./lib/nstools";
//import { comprGenChar, comprLZGenerate, comprLZEncode, comprLZDecode } from "../utils/CompressionContracts";
//import { HammingEncode, HammingDecode, HammingEncodeProperly } from "../utils/HammingCodeTools";

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('cct_solve.js'); ns.disableLog("ALL"); ns.clearLog();

	let allServs = nstb.ScanAll(ns, true, true)[0];
	SolveAll();

	function SolveAll() {
		let cctLocations = {}
		// Iterate through all servers and save "Serv": [List of ccts] in dict
		for (let serv of allServs) {
			let docs = ns.ls(serv);
			for (const doc of docs) {
				if (doc.split(".")[1] == 'cct') {
					if (cctLocations[serv] != null) { cctLocations[serv].push(doc) }
					else { cctLocations[serv] = [doc] }
				}
			}
		}
		// Iterate through servers in dict
		for (let serv in cctLocations) {
			// Iterate through ccts this serv has to offer
			let contracts = cctLocations[serv]
			for (const contract of contracts) {
				try { if (HaveNotTried(serv, contract)) SolveContract(serv, contract); }
				catch (err) { ns.toast("ERROR:" + err, "error", 1000); }
			}
		}
	}

	function HaveNotTried(serv, cctname) {
		let triesLeft = ns.codingcontract.getNumTriesRemaining(cctname, serv);
		return (triesLeft >= 1);
	}

	function SolveContract(serv, cctname) {
		let contractType = ns.codingcontract.getContractType(cctname, serv);
		let data = ns.codingcontract.getData(cctname, serv);

		let solution = null;
		switch (contractType) {
			case "Find Largest Prime Factor":
				solution = Factor(data);
				break;
			case "Subarray with Maximum Sum":
				solution = FindMaxSubArraySum(data);
				break;
			case "Total Ways to Sum":
				solution = TotalWaysToSum(data);
				break;
			case "Total Ways to Sum II":
				//solution = TotalWaysToSum2(data);
				break;
			case "Spiralize Matrix":
				solution = String(Spiral(data));
				break;
			case "Array Jumping Game":
				solution = ArrayJumpingGame(data);
				break;
			case "Array Jumping Game II":
				solution = ArrayJumpingGame2(data);
				break;
			case "Merge Overlapping Intervals":
				solution = MergeOverlap(data);
				break;
			case "Generate IP Addresses":
				solution = String(GenerateIps(data));
				break;
			case "Algorithmic Stock Trader I":
				solution = AlgorithmicStockTrader1(data);
				break;
			case "Algorithmic Stock Trader II":
				solution = AlgorithmicStockTrader2(data);
				break;
			case "Algorithmic Stock Trader III":
				solution = AlgorithmicStockTrader3(data);
				break;
			case "Algorithmic Stock Trader IV":
				solution = AlgorithmicStockTrader4(data);
				break;
			case "Minimum Path Sum in a Triangle":
				solution = SolveTriangleSum(data);
				break;
			case "Unique Paths in a Grid I":
				solution = UniquePathsI(data);
				break;
			case "Unique Paths in a Grid II":
				solution = UniquePathsII(data);
				break;
			case "Shortest Path in a Grid":
				//solution = Func(data);
				break;
			case "Sanitize Parentheses in Expression":
				solution = SanitizeParentheses(data);
				break;
			case "Find All Valid Math Expressions":
				solution = FindAllValidMathExpr(data);
				break;
			case "HammingCodes: Integer to Encoded Binary":
				//solution = Hamming1(data);
				break;
			case "HammingCodes: Encoded Binary to Integer":
				//solution = Hamming2(data);
				break;
			case "Proper 2-Coloring of a Graph":
				solution = colorGraph2(data);
				break;
			case "Compression I: RLE Compression":
				//solution = Compression1(data);
				break;
			case "Compression II: LZ Decompression":
				//solution = Compression2(data);
				break;
			case "Compression III: LZ Compression":
				//solution = Compression3(data);
				break;
			case "Encryption I: Caesar Cipher":
				solution = CaesarCipher(data);
				break;
			case "Encryption II: Vigenère Cipher":
				solution = VigenereCipher(data);
				break;
			default:
				ns.toast("No case for " + contractType, 'error', 1000);
		}

		let opts = {};
		opts.returnReward = true;
		if (solution != null) {
			let outcome = ns.codingcontract.attempt(solution, cctname, serv, opts)
			if (outcome == false) {
				ns.toast("FAILED CONTRACT: " + contractType, 'error', 5000);
				ns.tail('cct_solve.js');
				ns.print(`ERROR - FAILED CONTRACT: ${contractType}`)
				ns.print(`DATA:\n${data}\n`)
				ns.print(`solution:\n${solution}`)
			} else {
				ns.toast("Solved cct, reward: " + outcome, 'success', 10000);
			}
		}


		// SOLVER FUNCTIONS
		// ------------------------------------------------------------------------------------

		// FIND LARGEST PRIME FACTOR

		function Factor(num) {
			for (let div = 2; div <= Math.sqrt(num); div++) {
				if (num % div != 0) { continue; }
				num = num / div;
				div = 1;
			}
			return num;
		}

		// SUBARRAY WITH MAXIMUM SUM

		function FindMaxSubArraySum(arr) {
			if (arr.length == 0) { return 0; }
			if (arr.length == 1) { return arr[0]; 
			}
			let sum = FindMaxSubArraySum(arr.slice(1));
			let s = 0;
			for (let i = 0; i < arr.length; i++) {
				s += arr[i];
				if (s > sum) { sum = s; }
			}
			return sum;
		}

		// TOTAL WAYS TO SUM

		function TotalWaysToSum(data) {
			let cache = {};
			let n = data;
			return twts(n, n, cache) - 1;
		}

		function twts(limit, n, cache) {
			if (n < 1) { return 1; }
			if (limit == 1) { return 1; }
			if (n < limit) { return twts(n, n, cache); }
			if (n in cache) {
				let c = cache[n];
				if (limit in c) { return c[limit]; }
			}

			let s = 0;
			for (let i = 1; i <= limit; i++) {
				s += twts(i, n - i, cache);
			}

			if (!(n in cache)) { cache[n] = {}; }
			cache[n][limit] = s;
			return s;
		}

		// TOTAL WAYS TO SUM II

		/*function TotalWaysToSum2(data) {
			if (typeof data !== "number") throw new Error("solver expected number");
			const ways = [1];
			ways.length = data + 1;
			ways.fill(0, 1);
			for (let i = 1; i < data; ++i) {
				for (let j = i; j <= data; ++j) {
					ways[j] += ways[j - i];
				}
			}
			return ways[data];
		}*/

		// SPIRALIZE MATRIX

		function Spiral(arr, accum = []) {
			if (arr.length === 0 || arr[0].length === 0) { return accum; }
			accum = accum.concat(arr.shift());
			if (arr.length === 0 || arr[0].length === 0) { return accum; }
			accum = accum.concat(column(arr, arr[0].length - 1));
			if (arr.length === 0 || arr[0].length === 0) { return accum; }
			accum = accum.concat(arr.pop().reverse());
			if (arr.length === 0 || arr[0].length === 0) { return accum; }
			accum = accum.concat(column(arr, 0).reverse());
			if (arr.length === 0 || arr[0].length === 0) { return accum; }
			return Spiral(arr, accum);
		}

		function column(arr, index) {
			let res = [];
			for (let i = 0; i < arr.length; i++) {
				const elm = arr[i].splice(index, 1)[0];
				if (elm) { res.push(elm); }
			}
			return res;
		}

		// ARRAY JUMPING GAME

		function ArrayJumpingGame(data) { return findJump(data, 0); }

		function findJump(data, pos) {
			let maxJump = data[pos];
			if (pos + maxJump >= data.length - 1) { return 1; }
			for (let i = 1; i <= maxJump; i++) {
				if (findJump(data, pos + i) == 1) { return 1; }
			}
			return 0;
		}

		// ARRAY JUMPING GAME II

		function ArrayJumpingGame2(data) {
			const n = data.length;
			let reach = 0;
			let jumps = 0;
			let lastJump = -1;
			while (reach < n - 1) {
				let jumpedFrom = -1;
				for (let i = reach; i > lastJump; i--) {
					if (i + data[i] > reach) {
						reach = i + data[i];
						jumpedFrom = i;
					}
				}
				if (jumpedFrom === -1) { jumps = 0; break; }
				lastJump = jumpedFrom;
				jumps++;
			}
			return jumps;
		}

		// MERGE OVERLAPPING INTERVALS

		function MergeOverlap(intervals) {
			intervals.sort(([minA], [minB]) => minA - minB);
			for (let i = 0; i < intervals.length; i++) {
				for (let j = i + 1; j < intervals.length; j++) {
					const [min, max] = intervals[i];
					const [laterMin, laterMax] = intervals[j];
					if (laterMin <= max) {
						const newMax = laterMax > max ? laterMax : max;
						const newInterval = [min, newMax];
						intervals[i] = newInterval;
						intervals.splice(j, 1);
						j = i;
					}
				}
			}
			return intervals;
		}

		// GENERATE IP ADDRESSES

		function GenerateIps(num) {
			num = num.toString();
			const ips = [];
	
			for (let a = 1; a <= 3; ++a) {
				for (let b = 1; b <= 3; ++b) {
					  for (let c = 1; c <= 3; ++c) {
						for (let d = 1; d <= 3; ++d) {
							  if (a + b + c + d === num.length) {
								const A = parseInt(num.substring(0, a), 10);
								const B = parseInt(num.substring(a, a + b), 10);
								const C = parseInt(num.substring(a + b, a + b + c), 10);
								const D = parseInt(num.substring(a + b + c, a + b + c + d), 10);
								if (A <= 255 && B <= 255 && C <= 255 && D <= 255) {
									const ip = [A.toString(), ".", B.toString(), ".", C.toString(), ".", D.toString()].join("");
									if (ip.length === num.length + 3) { ips.push(ip) }
								}
							}
						}
					}
				}
			}
			return ips;
		}

		// ALGORITHMIC STOCK TRADER I

		function AlgorithmicStockTrader1(data) {
			if (data.length == 0) { return 0; }
			let chances = findProfitChances(data);
			let mergedChances = mergeChances(chances);
			let profit = Math.max(...(mergedChances.map(cs => Math.max(...(cs.map(c => c[1] - c[0]))))));
			return profit;
		}

		// ALGORITHMIC STOCK TRADER II

		function AlgorithmicStockTrader2(data) {
			if (data.length == 0) { return 0; }
			let chances = findProfitChances(data);
			let profit = chances.map(c => c[1] - c[0]).reduce((a, b) => a + b, 0);
			return profit;
		}

		// ALGORITHMIC STOCK TRADER III

		function AlgorithmicStockTrader3(data) {
			if (data.length == 0) { return 0; }
			let chances = findProfitChances(data);
			// let mergedChances = mergeChances(chances);
			// let mp = mergedChances.map(cs=>cs.map(c=>c[1]-c[0]));
			return maxProfit(chances, 2);
		}

		// ALGORITHMIC STOCK TRADER IV

		function AlgorithmicStockTrader4(data) {
			if (data[1].length == 0) { return 0; }
			let chances = findProfitChances(data[1]);
			// let mergedChances = mergeChances(chances);
			// let mp = mergedChances.map(cs=>cs.map(c=>c[1]-c[0]));
			return maxProfit(chances, data[0]);
		}

		function maxProfit(chances, k) {
			if (k == 0 || chances.length == 0) { return 0; }
			let c0 = chances[0];
			if (chances.length == 1) { return c0[1] - c0[0]; }

			let profit = maxProfit(chances.slice(1), k);
			for (let i = 0; i < chances.length; i++) {
				let p = chances[i][1] - chances[0][0] + maxProfit(chances.slice(i + 1), k - 1);
				if (p > profit) { profit = p; }
			}
			return profit;
		}

		function findProfitChances(data) {
			let start = data[0];
			let end = start;
			let chances = [];
			for (let i = 1; i < data.length; i++) {
				let now = data[i];
				if (end < now) { end = now; }
				if (end > now) {
					if (end > start) { chances.push([start, end]); }
					start = now; end = start;
				}
			}
			if (end > start) { chances.push([start, end]); }
			return chances;
		}

		function mergeChances(chances) {
			let n = chances.length;
			let mc = [];
			let cs = chances.slice();
			mc.push(cs);
			while (cs.length > 1) {
				let ncs = [];
				for (let i = 0; i < cs.length - 1; i++) {
					ncs.push([cs[i][0], cs[i + 1][1]]);
				}
				mc.push(ncs);
				cs = ncs;
			}
			mc.reverse();
			return mc;
		}

		// MINIMUM PATH SUM IN A TRIANGLE

		function SolveTriangleSum(arrayData) {
			let triangle = arrayData;
			let nextArray;
			let previousArray = triangle[0];

			for (let i = 1; i < triangle.length; i++) {
				nextArray = [];
				for (let j = 0; j < triangle[i].length; j++) {
					if (j == 0) {
						nextArray.push(previousArray[j] + triangle[i][j]);
					} else if (j == triangle[i].length - 1) {
						nextArray.push(previousArray[j - 1] + triangle[i][j]);
					} else {
						nextArray.push(Math.min(previousArray[j], previousArray[j - 1]) + triangle[i][j]);
					}
				}
				previousArray = nextArray;
			}
			return Math.min.apply(null, nextArray);
		}

		// UNIQUE PATHS IN A GRID I

		function UniquePathsI(grid) {
			const rightMoves = grid[0] - 1;
			const downMoves = grid[1] - 1;
			return Math.round(factorialDivision(rightMoves + downMoves, rightMoves) / (factorial(downMoves)));
		}

		function factorial(n) { return factorialDivision(n, 1); }

		function factorialDivision(n, d) {
			if (n == 0 || n == 1 || n == d) return 1;
			return factorialDivision(n - 1, d) * n;
		}

		// UNIQUE PATHS IN A GRID II

		function UniquePathsII(grid, ignoreFirst = false, ignoreLast = false) {
			const rightMoves = grid[0].length - 1;
			const downMoves = grid.length - 1;
			let totalPossiblePaths = Math.round(factorialDivision(rightMoves + downMoves, rightMoves) / (factorial(downMoves)));

			for (let i = 0; i < grid.length; i++) {
				for (let j = 0; j < grid[i].length; j++) {
					if (grid[i][j] == 1 && (!ignoreFirst || i != 0 || j != 0) && (!ignoreLast || i != grid.length - 1 || j != grid[i].length - 1)) {
						const newArray = [];
						for (let k = i; k < grid.length; k++) {
							newArray.push(grid[k].slice(j, grid[i].length));
						}

						let removedPaths = UniquePathsII(newArray, true, ignoreLast);
						removedPaths *= UniquePathsI([i + 1, j + 1]);

						totalPossiblePaths -= removedPaths;
					}
				}
			}
			return totalPossiblePaths;
		}

		// SHORTEST PATH IN A GRID

		/*function ShortestGridPath(data) {
			const data = _data as number[][];
			const width = data[0].length;
			const height = data.length;
			const dstY = height - 1;
			const dstX = width - 1;
	
			const distance: [number][] = new Array(height);
			//const prev: [[number, number] | undefined][] = new Array(height);
			const queue = new MinHeap < [number, number] > ();
	
			for (let y = 0; y < height; y++) {
				distance[y] = new Array(width).fill(Infinity) as [number];
				//prev[y] = new Array(width).fill(undefined) as [undefined];
			}
	
			function validPosition(y: number, x: number): boolean {
				return y >= 0 && y < height && x >= 0 && x < width && data[y][x] == 0;
			}
	
			// List in-bounds and passable neighbors
			function* neighbors(y: number, x: number): Generator<[number, number]> {
				if (validPosition(y - 1, x)) yield [y - 1, x]; // Up
				if (validPosition(y + 1, x)) yield [y + 1, x]; // Down
				if (validPosition(y, x - 1)) yield [y, x - 1]; // Left
				if (validPosition(y, x + 1)) yield [y, x + 1]; // Right
			}
	
			// Prepare starting point
			distance[0][0] = 0;
			queue.push([0, 0], 0);
	
			// Take next-nearest position and expand potential paths from there
			while (queue.size > 0) {
				const [y, x] = queue.pop() as [number, number];
				for (const [yN, xN] of neighbors(y, x)) {
					const d = distance[y][x] + 1;
					if (d < distance[yN][xN]) {
						if (distance[yN][xN] == Infinity)
							// Not reached previously
							queue.push([yN, xN], d);
						// Found a shorter path
						else queue.changeWeight(([yQ, xQ]) => yQ == yN && xQ == xN, d);
						//prev[yN][xN] = [y, x];
						distance[yN][xN] = d;
					}
				}
			}
	
			// No path at all?
			if (distance[dstY][dstX] == Infinity) return ans == "";
	
			// There is a solution, require that the answer path is as short as the shortest
			// path we found
			if (ans.length > distance[dstY][dstX]) return false;
	
			// Further verify that the answer path is a valid path
			let ansX = 0;
			let ansY = 0;
			for (const direction of ans) {
				switch (direction) {
					case "U":
						ansY -= 1;
						break;
					case "D":
						ansY += 1;
						break;
					case "L":
						ansX -= 1;
						break;
					case "R":
						ansX += 1;
						break;
					default:
						return false; // Invalid character
				}
				if (!validPosition(ansY, ansX)) return false;
			}
	
			// Path was valid, finally verify that the answer path brought us to the end coordinates
			return ansY == dstY && ansX == dstX;
		}*/

		// SANITIZE PARENTHESES IN EXPRESSION

		function SanitizeParentheses(data) {
			let context = { "maxLeftLength": 0 }
			let exprs = findSanitized(data, 0, context);
			exprs = exprs.filter(e => e.length >= context["maxLeftLength"]).sort();
			for (let i = 0; i < exprs.length - 1; i++) {
				while (exprs[i] == exprs[i + 1]) {
					exprs.splice(i + 1, 1);
				}
			}
			return exprs;
		}

		function findSanitized(s, pos, context) {
			// ns.tprint(s, " ", pos, " ", context["maxLeftLength"], " ", validateParentheses(s));
			if (s.length < context["maxLeftLength"]) { return []; }

			if (pos == s.length) {
				if (validateParentheses(s)) {
					if (s.length > context["maxLeftLength"]) { context["maxLeftLength"] = s.length; }
					return [s];
				} else { return []; }
			}

			let results = [];
			let c = s[pos];
			if (c == "(" || c == ")") {
				results = results.concat(
					findSanitized(s, pos + 1, context),
					findSanitized(s.slice(0, pos) + s.slice(pos + 1), pos, context)
				);
			} else {
				results = results.concat(
					findSanitized(s, pos + 1, context)
				);
			}
			return results;
		}

		function validateParentheses(s) {
			let n = 0;
			for (let i = 0; i < s.length; i++) {
				if (s[i] == "(") { n++; }
				if (s[i] == ")") { n--; }
				if (n < 0) { return false; }
			}
			return n == 0;
		}

		// FIND ALL VALID MATH EXPRESSIONS

		function FindAllValidMathExpr(data) {
			let [s, n] = data;
			return findExpr(s, n, "");
		}

		function findExpr(s, n, expr) {
			if (s.length == 0) {
				if (eval(expr) == n) { return [expr] }
				else { return [] }
			}

			let results = [];
			if (s.startsWith("0")) {
				let sliced = s.slice(1);
				if (expr.length == 0) { return findExpr(sliced, n, expr + "0"); }

				results = results.concat(
					findExpr(sliced, n, expr + "+0"),
					findExpr(sliced, n, expr + "-0"),
					findExpr(sliced, n, expr + "*0"),
				);
				return results;
			}

			let maxLength = s.length;
			let ops = [];
			if (expr.length == 0) { ops = ["", "-"]; }
			else { ops = ["-", "+", "*"]; }

			for (let op of ops) {
				for (let i = 1; i <= maxLength; i++) {
					results = results.concat(
						findExpr(s.slice(i), n, expr + op + s.slice(0, i))
					);
				}
			}
			return results;
		}

		// HAMMINGCODES: INTEGER TO ENCODED BINARY

		/*function Hamming1(data) {
			if (typeof data !== "number") throw new Error("solver expected number");
			return HammingEncode(data);
		}
	
		// HAMMINGCODES: ENCODED BINARY TO INTEGER
	
		function Hamming2(data) {
			if (typeof data !== "string") throw new Error("solver expected string");
			return HammingDecode(data);
		}*/

		// PROPER 2-COLORING OF A GRAPH

		/** Find a proper 2-coloring for a given graph. If none exist, returns an empty array
		* @param {(number | number[][])[]} data The data for the graph to color.
		* - Should be an array with the 2 elements: # of nodes in graph & array of edges in graph.
		*/
		function colorGraph2(data) {
			// Declare variables & Constants
			const numNodes = data[0];	// numNodes = number of nodes in graph
			const edges = data[1];		// edges = array of all edges in graph
			let colors = Array(numNodes).fill(undefined); // Make an array of size numNodes, where each element is undefined.

			// While there are still undefined elements in colors, color in the next island.
			while (colors.some((val) => val === undefined)) {

				// Get the index of the first "undefined" element in colors. (aka The lowest-numbered uncolored node)
				const firstNode = colors.findIndex((val) => val === undefined);
				colors[firstNode] = 0;		// Color this node w/ color 0.
				const Queue = [firstNode];		// Make a queue
				
				// Loop until the queue is empty
				while (Queue.length > 0) {
					const v = Queue.pop() || 0;	// Get the next node (v) in the queue
					const neighbors = getNeighbors(v, edges);

					// Iterate over each node u adjacent to v.
					for (const u of neighbors) {

						// If node u is new (uncolored)...
						if (colors[u] === undefined) {
							// Set u's color to the opposite of v's color.
							if (colors[v] === 0) colors[u] = 1;
							else colors[u] = 0;
							// Add u to the queue
							Queue.push(u);
						}
						// If node u is already colored, assert that it is not the same color as v.
						else if (colors[u] === colors[v]) {
							// If u,v do have the same color, no proper 2-coloring exists, so return an empty array.
							return [];
						}
					}
				}
			}
			// If this code is reached, we found a valid 2-coloring of the graph, so return it
			return colors;
		}

		/** Get the neighbors for a given node
		* @param {number} node The numerical ID of the node to get the neighbors of.
		* @param {number[][]} edges The array of all edges in the graph.
		*/
		function getNeighbors(node, edges){
			const adjLeft = edges.filter(([a]) => a == node).map(([, b]) => b); // get all edges where node is the 1st element
			const adjRight = edges.filter(([, b]) => b == node).map(([a]) => a); // get all edges where node is the 2nd element
			return adjLeft.concat(adjRight);
		}

		// COMPRESSION I: RLE COMPRESSION

		/*function Compression1(plain) {
			if (typeof plain !== "string") throw new Error("solver expected string");
			if (ans.length % 2 !== 0) {
				return false;
			}
	
			let ans_plain = "";
			for (let i = 0; i + 1 < ans.length; i += 2) {
				const length = ans.charCodeAt(i) - 0x30;
				if (length < 0 || length > 9) {
					return false;
				}
	
				ans_plain += ans[i + 1].repeat(length);
			}
			if (ans_plain !== plain) {
				return false;
			}
	
			let length = 0;
			for (let i = 0; i < plain.length;) {
				let run_length = 1;
				while (i + run_length < plain.length && plain[i + run_length] === plain[i]) {
					++run_length;
				}
				i += run_length;
	
				while (run_length > 0) {
					run_length -= 9;
					length += 2;
				}
			}
	
			return ans.length <= length;
		}*/

		// COMPRESSION II: LZ DECOMPRESSION

		/*function Compression2(compr) {
			if (typeof compr !== "string") throw new Error("solver expected string");
			return comprLZDecode(compr);
		}*/

		// COMPRESSION III: LZ COMPRESSION

		/*function Compression3(plain) {
			if (typeof plain !== "string") throw new Error("solver expected string");
			return comprLZEncode(plain);
		}*/

		// ENCRYPTION I: CAESAR CIPHER

		function CaesarCipher(data) {
			if (!Array.isArray(data)) throw new Error("data should be array of string");
			// data = [plaintext, shift value]
			// build char array, shifting via map and join to final results
			const cipher = [...data[0]]
				.map((a) => (a === " " ? a : String.fromCharCode(((a.charCodeAt(0) - 65 - data[1] + 26) % 26) + 65)))
				.join("");
			return cipher;
		}

		// ENCRYPTION II: VIGENÈRE CIPHER

		function VigenereCipher(data) {
			if (!Array.isArray(data)) throw new Error("data should be array of string");
			// data = [plaintext, keyword]
			// build char array, shifting via map and corresponding keyword letter and join to final results
			const cipher = [...data[0]]
				.map((a, i) => {
					return a === " "
						? a
						: String.fromCharCode(((a.charCodeAt(0) - 2 * 65 + data[1].charCodeAt(i % data[1].length)) % 26) + 65);
				})
				.join("");
			return cipher;
		}
	}
}