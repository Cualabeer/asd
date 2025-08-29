import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { sendEmailAlert } from "./alertMailer.js";
import { sendSlackAlert } from "./alertSlack.js";

// Console colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgCyan: "\x1b[36m",
  fgMagenta: "\x1b[35m",
};

export const logInitialization = async (isPeriodic = false) => {
  try {
    const reportType = isPeriodic ? "Periodic" : "Initialization";
    console.log(`${colors.fgCyan}\n📝 ${reportType} Report Start${colors.reset}`);

    // 1️⃣ Users summary
    const users = await User.find({});
    const totalUsers = users.length;
    const rolesCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    console.log(`${colors.fgMagenta}📊 Users Summary:${colors.reset}`);
    console.table({ Total: totalUsers, ...rolesCount });

    // 2️⃣ Bookings summary
    const bookings = await Booking.find({});
    const upcoming = bookings.filter(b => new Date(b.date) >= new Date());
    console.log(`${colors.fgMagenta}📅 Total Bookings: ${bookings.length}${colors.reset}`);
    console.log(`${colors.fgMagenta}🔜 Upcoming Bookings: ${upcoming.length}${colors.reset}`);

    // 3️⃣ Mechanic conflicts
    const conflicts = upcoming.filter((b, i, arr) =>
      arr.some(
        o =>
          o._id.toString() !== b._id.toString() &&
          o.mechanicId.toString() === b.mechanicId.toString() &&
          new Date(o.date).getTime() === new Date(b.date).getTime()
      )
    );

    if (conflicts.length > 0) {
      console.log(`${colors.fgRed}⚠️ Mechanic Conflicts Detected!${colors.reset}`);
      conflicts.forEach(c =>
        console.log(`${colors.fgRed}Mechanic ${c.mechanicId} double-booked at ${c.date}${colors.reset}`)
      );

      // Send alerts
      await sendEmailAlert("Mechanic Conflict Detected", `${conflicts.length} conflicts found!`);
      await sendSlackAlert(`⚠️ Mechanic conflicts detected: ${conflicts.length} bookings overlap.`);
    } else {
      console.log(`${colors.fgGreen}✅ No mechanic conflicts detected${colors.reset}`);
    }

    // 4️⃣ Heatmap
    const heatmap = {};
    upcoming.forEach(b => {
      const day = new Date(b.date).toDateString();
      heatmap[day] = (heatmap[day] || 0) + 1;
    });
    console.log(`${colors.fgYellow}🌡️ Booking Heatmap (upcoming days):${colors.reset}`);
    console.table(heatmap);

    console.log(`${colors.fgCyan}📝 ${reportType} Report End\n${colors.reset}`);
  } catch (err) {
    console.error(`${colors.fgRed}❌ Error in logInitialization: ${err.message}${colors.reset}`);

    // Critical alerts
    await sendEmailAlert("Backend Alert: Initialization Failed", err.message);
    await sendSlackAlert(`Backend initialization failed:\n${err.message}`);
  }
};