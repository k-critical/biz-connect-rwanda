/** Runs once when the web server starts: starts the background job workers. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startWorkers } = await import("./server/jobs/workers");
  try {
    await startWorkers();
  } catch (error) {
    // The site still works without the worker; queued emails wait until it runs.
    console.error("[jobs] could not start the workers:", error);
  }
}
