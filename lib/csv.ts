'use server';

import path from "path";
import { promises as fs } from "fs"; // ✅ Use async fs API
import { parse } from "csv-parse/sync";

export const loadCandidates = async () => {
  try {
    const filePath = path.join(process.cwd(), "public", "candidates.csv");
    const fileContent = await fs.readFile(filePath, "utf-8"); // ✅ Async read

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log("✅ CSV Loaded:", records.length, "records");
    return records;
  } catch (error) {
    console.error("❌ Error loading candidates.csv:", error);
    return []; // return empty array to avoid crashing
  }
};
