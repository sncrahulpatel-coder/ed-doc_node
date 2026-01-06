import cron from "node-cron";
import { cronUpdateSchoolStorage } from "./schoolControllers.js";
import { sendMail } from "../aws/aws3.js";

cron.schedule("0 2 * * *", async () => {
    const startTime = new Date();
    console.log("⏳ Cron job started at:", startTime.toLocaleString());

    let status = "SUCCESS";
    let errorMessage = "None";
    let stackTrace = "";

    try {
        await cronUpdateSchoolStorage(); // your main task
    } catch (err) {
        status = "FAILED";
        errorMessage = err.message;
        stackTrace = err.stack || "";
        console.error("❌ Cron job error:", err);
    }

    const endTime = new Date();
    const durationMs = endTime - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    const subject = `🕒 Daily Cron Report (2 AM) — ${status}`;

    const body = `
        <h2>Daily Cron Job Report</h2>

        <p><strong>Status:</strong> ${status}</p>

        <h3>⏱ Timing Details</h3>
        <p><strong>Start Time:</strong> ${startTime.toLocaleString()}</p>
        <p><strong>End Time:</strong> ${endTime.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${durationSec} seconds</p>

        <h3>📌 Error Details</h3>
        <p><strong>Error Message:</strong> ${errorMessage}</p>
        <pre style="background:#f4f4f4;padding:10px;border-radius:6px;">
${stackTrace}
        </pre>

        <p>— Server Cron Monitor 🤖</p>
    `;

    try {
        await sendMail("rpteqi@gmail.com", subject, body);
        console.log("📧 Cron report email sent.");
    } catch (mailError) {
        console.error("📧 Failed to send cron report email:", mailError);
    }
});

