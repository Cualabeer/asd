import mongoose from "mongoose";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import chalk from "chalk";

let lastReportState = {
  users: {},
  totalUsers: 0,
  bookings: 0,
  recentBookingIds: [],
  importantUsers: [],
};

export const logInitialization = async (isPeriodic = false) => {
  console.log(chalk.blue.bold(isPeriodic ? "\n⏱️ Periodic Backend Report" : "\n🔹 Full Initialization Report 🔹"));

  // 1️⃣ MongoDB Status
  const dbState = mongoose.connection.readyState;
  const stateText = ["Disconnected", "Connected", "Connecting", "Disconnecting"][dbState];
  const dbColor = dbState === 1 ? chalk.green : chalk.red;
  console.log(`\n🗄️ MongoDB Status: ${dbColor(stateText)}`);
  if (dbState !== 1) console.log(chalk.red.bold("❌ ALERT: MongoDB is not connected!"));

  // 2️⃣ Users breakdown
  const roles = ["customer", "mechanic", "garage", "admin"];
  const userCounts = {};
  let totalUsers = 0;
  for (const role of roles) {
    const count = await User.countDocuments({ role });
    userCounts[role] = count;
    totalUsers += count;
  }

  if (!isPeriodic || JSON.stringify(userCounts) !== JSON.stringify(lastReportState.users)) {
    console.log(chalk.green("\n👤 Users Breakdown by Role:"));
    console.table(userCounts);
    console.log(chalk.green(`Total Users: ${totalUsers}`));
  }

  // 3️⃣ Admins & Mechanics
  const importantUsers = await User.find({ role: { $in: ["admin", "mechanic"] } }).select("name email role");
  if (!isPeriodic || !arraysEqual(importantUsers, lastReportState.importantUsers)) {
    console.log(chalk.cyan("\n📝 Admins and Mechanics:"));
    if (importantUsers.length === 0) {
      console.log(chalk.red(" - ❌ ALERT: No admins or mechanics found!"));
    } else console.table(importantUsers.map(u => ({ Role: u.role.toUpperCase(), Name: u.name, Email: u.email })));
  }

  // 4️⃣ Bookings summary
  const totalBookings = await Booking.countDocuments();
  const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name email");
  const recentBookingIds = recentBookings.map(b => b._id.toString());

  if (!isPeriodic || totalBookings !== lastReportState.bookings || recentBookingIds.join(",") !== lastReportState.recentBookingIds.join(",")) {
    console.log(chalk.magenta("\n📅 Bookings Summary:"));
    console.log(` - Total Bookings: ${totalBookings}`);

    if (recentBookings.length > 0) {
      console.log(chalk.magenta("\n🆕 Most Recent Bookings:"));
      console.table(
        recentBookings.map(b => ({
          Vehicle: b.vehicleDetails,
          Service: b.serviceType,
          Customer: b.customer.name,
          Email: b.customer.email,
          Date: b.date,
        }))
      );

      // Upcoming bookings
      const upcomingBookings = await Booking.find({ date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(10)
        .populate("customer", "name email")
        .populate("mechanic", "name");

      console.log(chalk.yellow("\n📌 Upcoming Bookings:"));
      if (upcomingBookings.length === 0) console.log(" - None upcoming");
      else
        console.table(
          upcomingBookings.map(b => ({
            Vehicle: b.vehicleDetails,
            Service: b.serviceType,
            Customer: b.customer.name,
            Mechanic: b.mechanic?.name || "Unassigned",
            Scheduled: b.date,
          }))
        );

      // Mechanic conflicts
      const mechConflicts = findMechanicConflicts(upcomingBookings);
      if (mechConflicts.length > 0) {
        console.log(chalk.red.bold("⚠️ ALERT: Mechanic scheduling conflicts detected!"));
        mechConflicts.forEach(c => {
          console.log(
            ` - Mechanic: ${c[0].mechanic?.name || "Unknown"} | ${c[0].vehicleDetails} (${c[0].customer.name}) ↔ ${c[1].vehicleDetails} (${c[1].customer.name})`
          );
        });
      }

      // Conflict heatmap
      const heatmap = calculateConflictHeatmap(upcomingBookings);
      if (Object.keys(heatmap).length > 0) {
        console.log(chalk.bgRed.white("\n🔥 Conflict Heatmap (high-risk days):"));
        Object.entries(heatmap).forEach(([day, count]) => {
          const color =
            count >= 3 ? chalk.bgRed.white :
            count === 2 ? chalk.bgYellow.black :
            chalk.bgGreen.black;
          console.log(color(` ${day}: ${count} conflict(s) `));
        });
      }
    }
  }

  // Save state
  lastReportState = { users: userCounts, totalUsers, bookings: totalBookings, recentBookingIds, importantUsers };

  if (!isPeriodic) console.log(chalk.blue.bold("\n🚀 Server is ready for first requests!\n"));
};

// --------------------
// HELPERS
// --------------------
const arraysEqual = (arr1, arr2) => {
  if (!arr1 || !arr2) return false;
  const emails1 = arr1.map(u => u.email).sort();
  const emails2 = arr2.map(u => u.email).sort();
  return JSON.stringify(emails1) === JSON.stringify(emails2);
};

const findMechanicConflicts = (bookings) => {
  const conflicts = [];
  const bookingsByMechanic = {};
  bookings.forEach(b => {
    if (!b.mechanic?._id) return;
    if (!bookingsByMechanic[b.mechanic._id]) bookingsByMechanic[b.mechanic._id] = [];
    bookingsByMechanic[b.mechanic._id].push(b);
  });

  for (const mechId in bookingsByMechanic) {
    const mechBookings = bookingsByMechanic[mechId].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 0; i < mechBookings.length - 1; i++) {
      const currentStart = new Date(mechBookings[i].date).getTime();
      const currentEnd = currentStart + (mechBookings[i].durationMinutes || 60) * 60 * 1000;
      const nextStart = new Date(mechBookings[i + 1].date).getTime();
      if (nextStart < currentEnd) conflicts.push([mechBookings[i], mechBookings[i + 1]]);
    }
  }
  return conflicts;
};

const calculateConflictHeatmap = (bookings) => {
  const dayCounts = {};
  bookings.forEach(b => {
    const day = new Date(b.date).toISOString().split("T")[0];
    if (!dayCounts[day]) dayCounts[day] = 0;
  });

  const mechConflicts = findMechanicConflicts(bookings);
  mechConflicts.forEach(pair => {
    const day = new Date(pair[0].date).toISOString().split("T")[0];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  return dayCounts;
};