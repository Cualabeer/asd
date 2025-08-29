import { sendEmailAlert } from "./alertMailer.js";
import { sendSlackAlert } from "./alertSlack.js";

// Simple color codes for console
const colors = {
  reset: "\x1b[0m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgCyan: "\x1b[36m",
};

export const logInitialization = async () => {
  console.log(`${colors.fgCyan}📝 Initialization Report Start${colors.reset}`);

  try {
    // Fetch data from DB (replace with real queries)
    const users = []; // await User.find({});
    const bookings = []; // await Booking.find({});
    const conflicts = []; // Determine conflicts from bookings

    // Users summary
    console.log(`${colors.fgGreen}✅ Users loaded: ${users.length}${colors.reset}`);

    // Bookings summary
    console.log(`${colors.fgGreen}✅ Bookings loaded: ${bookings.length}${colors.reset}`);

    // Conflict detection
    if (conflicts.length > 0) {
      console.log(`${colors.fgRed}⚠️ Mechanic Conflicts Detected: ${conflicts.length}${colors.reset}`);
      conflicts.forEach(c =>
        console.log(`${colors.fgRed}Mechanic ${c.mechanicId} double-booked at ${c.date}${colors.reset}`)
      );

      // Send alerts safely
      await sendEmailAlert(
        "Mechanic Conflict Detected",
        `${conflicts.length} conflicts detected in upcoming bookings!`
      );
      await sendSlackAlert(`⚠️ ${conflicts.length} mechanic conflicts detected!`);
    } else {
      console.log(`${colors.fgGreen}✅ No mechanic conflicts detected${colors.reset}`);
    }

    // Example heatmap summary
    console.log(`${colors.fgYellow}🌡️ Heatmap of bookings by day (simulated)${colors.reset}`);
    console.log("Mon: 3 | Tue: 5 | Wed: 2 | Thu: 0 | Fri: 4 | Sat: 1 | Sun: 0");

  } catch (err) {
    console.error(`${colors.fgRed}❌ Initialization error: ${err.message}${colors.reset}`);
    await sendEmailAlert("Initialization Error", err.message);
    await sendSlackAlert(`❌ Initialization Error: ${err.message}`);
  }

  console.log(`${colors.fgCyan}📝 Initialization Report End${colors.reset}\n`);
};