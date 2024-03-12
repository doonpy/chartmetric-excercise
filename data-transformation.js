const response = [
    {
        id: 1293487,
        name: "KCRW", // radio station callsign
        tracks: [{ timestp: "2021-04-08", trackName: "Peaches" }],
    },
    {
        id: 12923,
        name: "KQED",
        tracks: [
            { timestp: "2021-04-09", trackName: "Savage" },
            { timestp: "2021-04-09", trackName: "Savage (feat. Beyonce)" },
            { timestp: "2021-04-08", trackName: "Savage" },
            { timestp: "2021-04-08", trackName: "Savage" },
            { timestp: "2021-04-08", trackName: "Savage" },
        ],
    },
    {
        id: 4,
        name: "WNYC",
        tracks: [
            { timestp: "2021-04-09", trackName: "Captain Hook" },
            { timestp: "2021-04-08", trackName: "Captain Hook" },
            { timestp: "2021-04-07", trackName: "Captain Hook" },
        ],
    },
];

// Merge tracks in each station and sort by timestamp
const tracks = response
    .flatMap((item) => item.tracks)
    .sort((a, b) => a.timestp.localeCompare(b.timestp));

// Count spins for each track
const dataPointMap = new Map();
for (const { timestp: x, trackName } of tracks) {
    // Find existing data point or create a new one
    const dataPoint = dataPointMap.get(x) || { y: 0, tooltip: "" };

    // Define a tooltip RegExp for the track name and spins
    const tooltipRegex = new RegExp(`${trackName} \\((\\d+)\\)`);

    // Define a new tooltip with the upserted track name and spins
    const tooltip = tooltipRegex.test(dataPoint.tooltip)
        ? dataPoint.tooltip.replace(
            tooltipRegex,
            (match, spins) => `${trackName} (${parseInt(spins) + 1})`,
        )
        : `${dataPoint.tooltip}, ${trackName} (1)`;

    // Update the data point
    dataPointMap.set(x, { y: dataPoint.y + 1, tooltip });
}

// Convert map to array
const result = Array.from(dataPointMap, ([x, y]) => ({ x, ...y }));
console.log(result);
