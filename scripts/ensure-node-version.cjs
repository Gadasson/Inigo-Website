const major = Number(process.version.slice(1).split(".")[0]);
if (major < 20) {
  console.error(
    "\n[inigo-website] Node.js 20 or newer is required (Tailwind CSS v4 / @tailwindcss/oxide).\n" +
      `  Current: ${process.version}\n` +
      "  Fix: nvm use 20 && rm -rf node_modules && npm install\n",
  );
  process.exit(1);
}
