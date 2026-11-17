// Only the current request may publish data, errors, or loading completion.
export function createLatestRequest() {
  let sequence = 0

  return {
    invalidate() { sequence++ },
    async run<T>(
      request: () => Promise<T>,
      handlers: {
        start: () => void
        success: (result: T) => void
        error: (error: unknown) => void
        finish: () => void
      },
    ) {
      const current = ++sequence
      handlers.start()
      try {
        const result = await request()
        if (current === sequence) handlers.success(result)
      } catch (error) {
        if (current === sequence) handlers.error(error)
      } finally {
        if (current === sequence) handlers.finish()
      }
    },
  }
}
