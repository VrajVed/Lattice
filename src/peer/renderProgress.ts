export function renderProgress(received: number, total: number, width = 30) {
    const ratio = Math.min(received / total, 1);
    const filled = Math.round(ratio * width);
    const empty = width - filled;

    const bar = `[${"#".repeat(filled)}${".".repeat(empty)}]`;
    const percent = Math.round(ratio * 100);

    process.stdout.write(`\r${bar} ${percent}%`);
}
